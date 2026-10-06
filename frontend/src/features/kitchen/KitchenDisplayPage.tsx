import { useState } from 'react'
import { CircleAlert, Maximize, Minimize, RefreshCw } from 'lucide-react'

import { getErrorMessage } from '@/api/errors'
import type { KitchenTicket } from '@/api/kitchen'
import type { Station } from '@/api/stations'
import { ConnectionStatus } from '@/components/ConnectionStatus'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useSession } from '@/features/auth/useAuth'
import { notifyOrderError } from '@/features/orders/hooks'
import { STATION_ICONS } from '@/features/stations/icons'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useNow } from '@/hooks/useNow'
import { useHubGroup } from '@/realtime/useRealtime'
import { PassTicket } from './components/PassTicket'
import { StationTicket } from './components/StationTicket'
import { useActiveStations, useAdvanceItems, useItemsInFlight, useKitchenTickets, type AdvanceItems } from './hooks'
import { canFireFromPass, canMarkReadyOnPass, isHeldOnly, orderForDisplay } from './rules'
import { PASS, choiceToView, readChoice, resolveChoice, writeChoice, type DisplayMode, type StationChoice } from './station-choice'
import { useFullScreen } from './useFullScreen'

const TICKET_GRID = 'grid grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] items-start gap-3'

/**
 * The Kitchen Display: one station's open tickets, or the pass across every station.
 * Made to be read from a couple of metres away on a wall-mounted tablet.
 */
export function KitchenDisplayPage({ mode }: { mode: DisplayMode }) {
  useDocumentTitle(mode === 'bar' ? 'Bar' : 'Kitchen Display')
  const { role } = useSession()
  const stations = useActiveStations()
  const [stored, setStored] = useState<StationChoice | null>(() => readChoice(mode))

  const choice = stations.isSuccess ? resolveChoice(stored, mode, role, stations.active) : null
  const view = choice ? choiceToView(choice) : null
  const station = view?.kind === 'station' ? stations.active.find((s) => s.id === view.stationId) : undefined
  const isPass = view?.kind === 'pass'

  useHubGroup(view)
  const tickets = useKitchenTickets(view)
  const advance = useAdvanceItems()
  const inFlight = useItemsInFlight()
  const now = useNow(1_000)
  const fullScreen = useFullScreen()

  function choose(next: StationChoice) {
    setStored(next)
    writeChoice(mode, next)
  }

  function run(ticket: KitchenTicket, change: Omit<AdvanceItems, 'orderId'>) {
    const where = ticket.tableNumber !== null ? `table ${ticket.tableNumber}` : `order #${ticket.orderNumber}`
    const single = change.itemIds.length === 1 ? ticket.items.find((i) => i.id === change.itemIds[0]) : undefined
    const failure = single
      ? `Couldn't ${change.to === 'InProgress' ? 'start' : 'mark ready'} ${single.name}`
      : `Couldn't bump ${where}`
    advance.mutate({ orderId: ticket.orderId, ...change }, { onError: (error) => notifyOrderError(error, failure) })
  }

  // Tickets being cooked first, oldest first; tickets with only held items after them.
  const list = orderForDisplay(tickets.data ?? [])
  const onHold = list.filter(isHeldOnly).length
  const viewName = isPass ? 'the pass' : (station?.name ?? '')

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center gap-3">
        <StationPicker
          stations={stations.active}
          value={choice}
          onChange={choose}
          disabled={!stations.isSuccess}
          label={mode === 'bar' ? 'Bar screen' : 'Kitchen Display screen'}
        />
        {tickets.isSuccess && (
          <p className="text-lg font-medium tabular-nums" aria-live="polite">
            {list.length - onHold} {list.length - onHold === 1 ? 'ticket' : 'tickets'}
            {onHold > 0 && <span className="text-muted-foreground"> · {onHold} on hold</span>}
          </p>
        )}
        <div className="ml-auto flex items-center gap-2">
          {fullScreen.active && <ConnectionStatus large />}
          <Button variant="outline" size="lg" onClick={fullScreen.toggle} aria-pressed={fullScreen.active}>
            {fullScreen.active ? <Minimize aria-hidden="true" /> : <Maximize aria-hidden="true" />}
            {fullScreen.active ? 'Exit full screen' : 'Full screen'}
          </Button>
        </div>
      </header>

      {stations.isError ? (
        <EmptyState
          icon={CircleAlert}
          title="Couldn’t load stations"
          description={getErrorMessage(stations.error)}
          action={
            <Button variant="outline" onClick={() => void stations.refetch()}>
              <RefreshCw aria-hidden="true" />
              Try again
            </Button>
          }
        />
      ) : !view || tickets.isPending ? (
        <div className={TICKET_GRID} role="status" aria-label="Loading tickets">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-72 rounded-md" />
          ))}
        </div>
      ) : tickets.isError ? (
        <EmptyState
          icon={CircleAlert}
          title="Couldn’t load tickets"
          description={getErrorMessage(tickets.error)}
          action={
            <Button variant="outline" onClick={() => void tickets.refetch()}>
              <RefreshCw aria-hidden="true" />
              Try again
            </Button>
          }
        />
      ) : list.length === 0 ? (
        <div className="grid place-items-center rounded-md border border-dashed border-border-strong px-6 py-24 text-center">
          <p className="text-2xl font-semibold">No open tickets</p>
          {viewName && <p className="mt-1 text-lg text-muted-foreground">Nothing waiting at {viewName}.</p>}
        </div>
      ) : (
        <ul aria-label={`Tickets at ${viewName}, oldest first`} className={TICKET_GRID}>
          {list.map((ticket) => (
            <li key={ticket.orderId}>
              {isPass ? (
                <PassTicket
                  ticket={ticket}
                  now={now}
                  canMarkReady={canMarkReadyOnPass(role)}
                  canFire={canFireFromPass(role)}
                  inFlight={inFlight}
                  onReady={(itemIds) => run(ticket, { itemIds, to: 'Ready' })}
                />
              ) : (
                <StationTicket
                  ticket={ticket}
                  now={now}
                  inFlight={inFlight}
                  onAdvance={(itemIds, to) => run(ticket, { itemIds, to })}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function StationPicker({
  stations,
  value,
  onChange,
  disabled,
  label,
}: {
  stations: Station[]
  value: StationChoice | null
  onChange: (choice: StationChoice) => void
  disabled: boolean
  label: string
}) {
  return (
    <Select value={value ?? ''} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger aria-label={label} className="h-12 w-auto min-w-64 text-lg font-semibold">
        <SelectValue placeholder="Loading stations…" />
      </SelectTrigger>
      <SelectContent>
        {stations.map((station) => {
          const Icon = STATION_ICONS[station.type]
          return (
            <SelectItem key={station.id} value={station.id} className="text-base">
              <span className="flex items-center gap-2">
                <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
                {station.name}
              </span>
            </SelectItem>
          )
        })}
        {stations.length > 0 && <SelectSeparator />}
        <SelectItem value={PASS} className="text-base">
          Pass — all stations
        </SelectItem>
      </SelectContent>
    </Select>
  )
}
