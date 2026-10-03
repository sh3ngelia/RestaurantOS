import { useState } from 'react'
import { CalendarClock, Ellipsis, Lock, Pencil, Trash2, Users } from 'lucide-react'
import { toast } from 'sonner'

import type { Order } from '@/api/orders'
import type { DiningTable, TableNextReservation } from '@/api/tables'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { StatusChip } from '@/components/StatusChip'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { formatTime } from '@/lib/dates'
import { STATUS_TONE_CLASSES } from '@/lib/status-tones'
import { cn } from '@/lib/utils'
import { notifyTableError, useQuickAction } from '../hooks'
import { canRunQuickAction, type TablePermissions } from '../permissions'
import {
  ACTIONS_BY_STATE,
  QUICK_ACTIONS,
  STATUS_LABELS,
  STATUS_TONES,
  floorStateOf,
  type FloorState,
  type QuickAction,
} from '../status'
import { OrderStatusLine } from '@/features/orders/components/OrderSummary'
import { StatusBadge } from './StatusBadge'
import { TableOrderLink } from './TableOrderLink'
import { TableShape } from './TableShape'

interface TableCardProps {
  table: DiningTable
  permissions: TablePermissions
  onEdit: (table: DiningTable) => void
  onDelete: (table: DiningTable) => void
  /** The table's open order, when the signed-in role may read orders. */
  order?: Order
  /** The role may take orders, so seated tables offer "Start order". */
  canTakeOrders?: boolean
}

const bookingTime = (next: TableNextReservation) => formatTime(new Date(next.reservationTime))
const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name

/** One sentence for screen readers covering everything the card shows. */
function describe(table: DiningTable, state: FloorState, seats: string) {
  const next = table.nextReservation
  const parts = [`Table ${table.tableNumber}`, seats]
  if (state === 'booked' && next) {
    parts.push(`reserved for ${next.guestName}, party of ${next.guestCount} at ${bookingTime(next)}${next.isLate ? ', running late' : ''}`)
  } else if (state === 'held') {
    parts.push('held')
  } else {
    parts.push(STATUS_LABELS[table.status].toLowerCase())
    if (next) parts.push(`next booking ${bookingTime(next)} for ${next.guestName}, party of ${next.guestCount}`)
  }
  return `${parts.join(', ')}. Show actions`
}

export function TableCard({ table, permissions, onEdit, onDelete, order, canTakeOrders = false }: TableCardProps) {
  const [open, setOpen] = useState(false)
  const [walkInOpen, setWalkInOpen] = useState(false)
  const quickAction = useQuickAction()
  const state = floorStateOf(table)
  const actions = ACTIONS_BY_STATE[state].filter((action) => canRunQuickAction(action, permissions))
  const next = table.nextReservation
  const seats = `${table.capacity} ${table.capacity === 1 ? 'seat' : 'seats'}`

  function mutate(action: QuickAction) {
    return quickAction.mutateAsync({ table, action }).then(
      () => {
        toast.success(QUICK_ACTIONS[action].successTitle(table), { description: `Table ${table.tableNumber} · ${seats}` })
      },
      (error: unknown) => {
        notifyTableError(error, `Couldn't update table ${table.tableNumber}`)
        throw error
      },
    )
  }

  function run(action: QuickAction) {
    setOpen(false)
    if (QUICK_ACTIONS[action].needsConfirmation) {
      setWalkInOpen(true)
      return
    }
    mutate(action).catch(() => {
      // Already reported by mutate(); the optimistic change has been rolled back.
    })
  }

  return (
    <div
      className={cn(
        'relative h-full rounded-md border transition-[background-color,border-color] duration-150',
        STATUS_TONE_CLASSES[STATUS_TONES[table.status]].surface,
        state === 'held' && 'border-dashed',
      )}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={describe(table, state, seats)}
            className={cn(
              'flex h-full min-h-40 w-full flex-col rounded-md p-3 text-left outline-none',
              'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-base leading-tight font-semibold tabular-nums">Table {table.tableNumber}</p>
              <StatusBadge status={table.status} />
            </div>

            <TableShape capacity={table.capacity} status={table.status} className="my-3 h-16 w-full" />

            <div className={cn('mt-auto space-y-1', permissions.canManage && 'pr-10')}>
              <TableNote table={table} state={state} />
              {order && <OrderStatusLine order={order} className="pb-0.5" />}
              <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                <Users className="size-3.5" aria-hidden="true" />
                {seats}
              </p>
            </div>
          </button>
        </PopoverTrigger>

        <PopoverContent className="w-72 p-1.5">
          <div className="flex items-start justify-between gap-3 px-2 pt-1 pb-2">
            <div className="min-w-0">
              <p className="text-sm leading-tight font-semibold">Table {table.tableNumber}</p>
              <p className="text-xs text-muted-foreground">{seats}</p>
            </div>
            <StatusBadge status={table.status} />
          </div>
          {(state === 'booked' || state === 'held') && (
            <div className="px-2 pb-2">
              <TableNote table={table} state={state} />
            </div>
          )}
          <div className="grid gap-0.5 border-t border-border pt-1.5">
            {(order || (canTakeOrders && state === 'seated')) && (
              <TableOrderLink table={table} order={order} onNavigate={() => setOpen(false)} />
            )}
            {actions.map((action, index) => {
              const definition = QUICK_ACTIONS[action]
              const Icon = definition.icon
              const secondary = index > 0 && definition.needsConfirmation
              return (
                <button
                  key={action}
                  type="button"
                  onClick={() => run(action)}
                  className={cn(
                    'flex min-h-11 w-full items-center gap-3 rounded-sm px-2 py-1.5 text-left outline-none',
                    'transition-colors duration-150 hover:bg-accent focus-visible:bg-accent focus-visible:ring-2 focus-visible:ring-ring',
                  )}
                >
                  <span
                    className={cn(
                      'grid size-8 shrink-0 place-items-center rounded-sm border',
                      secondary
                        ? 'border-border text-muted-foreground'
                        : STATUS_TONE_CLASSES[STATUS_TONES[definition.apply(table).status]].chip,
                    )}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className={cn('block truncate text-sm font-medium', secondary && 'text-muted-foreground')}>
                      {definition.label(table)}
                    </span>
                    <span className="block text-xs text-muted-foreground">{definition.description(table)}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </PopoverContent>
      </Popover>

      {next && (
        <ConfirmDialog
          open={walkInOpen}
          onOpenChange={setWalkInOpen}
          title={`Seat a walk-in at table ${table.tableNumber}?`}
          description={`${next.guestName} (party of ${next.guestCount}) is booked here for ${bookingTime(next)}${
            next.isLate ? ' and is running late' : ''
          }. Seating a walk-in now may leave them without a table.`}
          confirmLabel="Seat walk-in"
          confirmVariant="default"
          onConfirm={() => mutate('seatWalkIn')}
        />
      )}

      {permissions.canManage && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1.5 bottom-1.5 text-muted-foreground hover:text-foreground"
              aria-label={`Manage table ${table.tableNumber}`}
            >
              <Ellipsis aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => onEdit(table)}>
              <Pencil aria-hidden="true" />
              Edit table
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => onDelete(table)}>
              <Trash2 aria-hidden="true" />
              Delete table
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}

/** The line under the table: who it's booked for, that it's held, or when the next booking is. */
function TableNote({ table, state }: { table: DiningTable; state: FloorState }) {
  const next = table.nextReservation

  if (state === 'held') {
    return (
      <p className="flex items-center gap-1.5 text-[13px] font-medium text-status-waiting">
        <Lock className="size-3.5" aria-hidden="true" />
        Held
      </p>
    )
  }

  if (!next) return null

  if (state === 'booked') {
    return (
      <p className="flex min-w-0 items-center gap-2 text-[13px] font-medium text-status-waiting">
        <span className="truncate tabular-nums">
          {next.guestName} · {next.guestCount} · {bookingTime(next)}
        </span>
        {next.isLate && (
          <StatusChip tone="attention" className="shrink-0">
            Late
          </StatusChip>
        )}
      </p>
    )
  }

  return (
    <p className="flex min-w-0 items-center gap-1 text-xs font-medium text-status-waiting">
      <CalendarClock className="size-3.5 shrink-0" aria-hidden="true" />
      <span className="truncate tabular-nums">
        Next: {bookingTime(next)} · {firstName(next.guestName)} ({next.guestCount})
      </span>
    </p>
  )
}
