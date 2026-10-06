import { useEffect, useMemo, useState } from 'react'
import { CircleAlert, Maximize, Minimize, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

import { ApiError, getErrorMessage } from '@/api/errors'
import type { KitchenTicket } from '@/api/kitchen'
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
import { AllDayPanel } from './components/AllDayPanel'
import { PassTicket } from './components/PassTicket'
import { StationTicket } from './components/StationTicket'
import { useActiveStations, useAdvanceItems, useItemsInFlight, useKitchenTickets, type AdvanceItems } from './hooks'
import { allDay, canFireFromPass, canMarkReadyOnPass, isHeldOnly, orderForDisplay, showsAllDay } from './rules'
import {
  choiceLabel,
  choiceOptions,
  choiceToView,
  defaultChoice,
  readChoice,
  resolveChoice,
  writeChoice,
  type ChoiceOptions,
  type DisplayMode,
  type StationChoice,
} from './station-choice'
import { useFullScreen } from './useFullScreen'

const TICKET_GRID = 'grid grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] items-start gap-3'

/**
 * The Kitchen Display: one station's tickets, or a pass for a station type (or, for Managers,
 * every station). Each ticket holds only the items for what's on screen, never the whole order.
 * Made to be read from a couple of metres away on a wall-mounted tablet.
 */
export function KitchenDisplayPage({ mode }: { mode: DisplayMode }) {
  useDocumentTitle(mode === 'bar' ? 'Bar' : 'Kitchen Display')
  const { role } = useSession()
  const stations = useActiveStations()
  const [stored, setStored] = useState<StationChoice | null>(() => readChoice(mode))

  const options = useMemo(() => choiceOptions(role, stations.active), [role, stations.active])
  const fallback = stations.isSuccess ? defaultChoice(mode, role, stations.active) : null
  const choice = stations.isSuccess ? resolveChoice(stored, mode, role, stations.active) : null
  const view = choice ? choiceToView(choice) : null
  const label = choice ? choiceLabel(choice, role, stations.active) : ''
  const passType = view?.kind === 'pass' ? view.type : null

  useHubGroup(view)
  const tickets = useKitchenTickets(view, { onForbidden: leaveForbiddenView })
  const advance = useAdvanceItems()
  const inFlight = useItemsInFlight()
  const now = useNow(1_000)
  const fullScreen = useFullScreen()

  // A remembered value this role may no longer open (say, the old all-stations "pass" on a cook's
  // tablet) has already been replaced by the default above; store the replacement.
  useEffect(() => {
    if (choice && choice !== stored) writeChoice(mode, choice)
  }, [choice, stored, mode])

  // The API refused this screen for the role (403): say why and go back to the role's default.
  // If the default itself is refused, the error stays on screen instead.
  function leaveForbiddenView(error: ApiError) {
    if (!fallback || choice === fallback) return
    toast.error('That screen isn’t available for your role', { description: getErrorMessage(error) })
    choose(fallback)
  }
  const forbidden = tickets.error instanceof ApiError && tickets.error.status === 403

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
  const list = useMemo(() => orderForDisplay(tickets.data ?? []), [tickets.data])
  const lines = useMemo(() => allDay(list), [list])
  const onHold = list.filter(isHeldOnly).length
  const withAllDay = view !== null && showsAllDay(view) && list.length > 0
  const choiceCount = options.stations.length + options.overviews.length

  const ticketList = (
    <ul aria-label={`Tickets at ${label}, oldest first`} className={TICKET_GRID}>
      {list.map((ticket) => (
        <li key={ticket.orderId}>
          {view?.kind === 'pass' ? (
            <PassTicket
              ticket={ticket}
              now={now}
              canMarkReady={canMarkReadyOnPass(role, passType)}
              canFire={canFireFromPass(role, passType)}
              inFlight={inFlight}
              onReady={(itemIds) => run(ticket, { itemIds, to: 'Ready' })}
            />
          ) : (
            <StationTicket ticket={ticket} now={now} inFlight={inFlight} onAdvance={(itemIds, to) => run(ticket, { itemIds, to })} />
          )}
        </li>
      ))}
    </ul>
  )

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center gap-3">
        {stations.isSuccess && choiceCount <= 1 ? (
          // One screen to choose from (a Bar user with one bar): no picker, just its name.
          <h1 className="text-2xl font-semibold">{label}</h1>
        ) : (
          <StationPicker
            options={options}
            value={choice}
            onChange={choose}
            disabled={!stations.isSuccess}
            label={mode === 'bar' ? 'Bar screen' : 'Kitchen Display screen'}
          />
        )}
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
          title={forbidden ? 'Not available for your role' : 'Couldn’t load tickets'}
          description={getErrorMessage(tickets.error)}
          action={
            !forbidden && (
              <Button variant="outline" onClick={() => void tickets.refetch()}>
                <RefreshCw aria-hidden="true" />
                Try again
              </Button>
            )
          }
        />
      ) : list.length === 0 ? (
        <div className="grid place-items-center rounded-md border border-dashed border-border-strong px-6 py-24 text-center">
          <p className="text-2xl font-semibold">No open tickets</p>
          {label && <p className="mt-1 text-lg text-muted-foreground">Nothing waiting at {label}.</p>}
        </div>
      ) : withAllDay ? (
        // Wide screens: tickets with the all-day panel beside them. Tablets: the panel collapses
        // into a bar above the tickets.
        <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_20rem] xl:gap-3">
          <div className="space-y-3">
            <div className="xl:hidden">
              <AllDayPanel lines={lines} placement="top" />
            </div>
            {ticketList}
          </div>
          <div className="hidden xl:block">
            <AllDayPanel lines={lines} placement="side" />
          </div>
        </div>
      ) : (
        ticketList
      )}
    </div>
  )
}

function StationPicker({
  options,
  value,
  onChange,
  disabled,
  label,
}: {
  options: ChoiceOptions
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
        {options.stations.map((station) => {
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
        {options.stations.length > 0 && options.overviews.length > 0 && <SelectSeparator />}
        {options.overviews.map((overview) => (
          <SelectItem key={overview.value} value={overview.value} className="text-base">
            {overview.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
