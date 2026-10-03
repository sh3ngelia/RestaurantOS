import { CalendarClock, CalendarX2, Ellipsis, Pencil, UserX } from 'lucide-react'
import { toast } from 'sonner'

import type { Reservation, ReservationAction } from '@/api/reservations'
import { StatusChip } from '@/components/StatusChip'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatTime } from '@/lib/dates'
import { cn } from '@/lib/utils'
import { notifyReservationError, useReservationAction } from '../hooks'
import { RESERVATION_ACTIONS, canRun, isFinal, timingOf } from '../status'
import { ReservationStatusBadge } from './ReservationStatusBadge'

/**
 * Column template shared by the rows and the header above them. Below the desktop
 * breakpoint a row stacks: time on the left, everything else beside it.
 */
const ROW_GRID =
  'grid grid-cols-[3rem_minmax(0,1fr)] gap-x-3 gap-y-1.5 lg:grid-cols-[3.5rem_minmax(0,1fr)_4.5rem_4.5rem_9rem_11rem_13rem] lg:items-center'

/** Column labels above the list, on desktop where the rows read as a table. */
export function ReservationRowHeader() {
  return (
    <div aria-hidden="true" className={cn(ROW_GRID, 'hidden border-l-2 border-l-transparent px-3 py-2 text-xs text-muted-foreground lg:grid')}>
      <span>Time</span>
      <span>Guest</span>
      <span>Party</span>
      <span>Table</span>
      <span>Phone</span>
      <span>Status</span>
      <span />
    </div>
  )
}

interface ReservationRowProps {
  reservation: Reservation
  now: Date
  onReschedule: (reservation: Reservation) => void
  onEdit: (reservation: Reservation) => void
  onCancel: (reservation: Reservation) => void
}

function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, '')}`
}

export function ReservationRow({ reservation, now, onReschedule, onEdit, onCancel }: ReservationRowProps) {
  const runAction = useReservationAction()
  const { status, guestName, guestCount, tableNumber } = reservation
  const time = formatTime(new Date(reservation.reservationTime))
  const timing = timingOf(reservation, now)
  const final = isFinal(status)
  const nameId = `reservation-${reservation.id}`

  function run(action: Exclude<ReservationAction, 'cancel'>) {
    runAction.mutate(
      { reservation, action },
      {
        onSuccess: () =>
          toast.success(RESERVATION_ACTIONS[action].successTitle(guestName), {
            description:
              action === 'arrive'
                ? `Table ${tableNumber} is now seated.`
                : `${time} · table ${tableNumber} · ${guestCount} ${guestCount === 1 ? 'guest' : 'guests'}`,
          }),
        onError: (error) => notifyReservationError(error, `Couldn't update ${guestName}'s booking`),
      },
    )
  }

  // The one next step shown as a button; everything else lives in the menu.
  const primary: Exclude<ReservationAction, 'cancel'> | null = canRun('confirm', status)
    ? 'confirm'
    : canRun('arrive', status)
      ? 'arrive'
      : null
  const PrimaryIcon = primary ? RESERVATION_ACTIONS[primary].icon : null
  // The API rejects a no-show before the booking time.
  const noShowAllowed = new Date(reservation.reservationTime) <= now
  // A late party gets the no-show option up front.
  const showNoShow = canRun('no-show', status) && timing?.kind === 'late'

  return (
    <article
      aria-labelledby={nameId}
      className={cn(
        ROW_GRID,
        'border-l-2 px-3 py-2.5 transition-colors duration-150',
        timing?.kind === 'late'
          ? 'border-l-status-attention'
          : timing?.kind === 'soon'
            ? 'border-l-status-waiting'
            : 'border-l-transparent',
      )}
    >
      <p className={cn('pt-px text-sm font-semibold tabular-nums lg:pt-0', final && 'text-muted-foreground')}>
        <time dateTime={reservation.reservationTime}>{time}</time>
      </p>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h3
            id={nameId}
            className={cn(
              'truncate text-sm font-medium',
              final && 'text-muted-foreground',
              status === 'Cancelled' && 'line-through decoration-muted-foreground/60',
            )}
          >
            {guestName}
          </h3>
          <ReservationStatusBadge status={status} className="lg:hidden" />
          {timing && <TimingChip timing={timing} className="lg:hidden" />}
        </div>
        {reservation.notes && (
          <p className="mt-0.5 line-clamp-1 text-[13px] text-muted-foreground">
            <span className="sr-only">Notes: </span>
            {reservation.notes}
          </p>
        )}
      </div>

      {/* Below desktop these sit on one line under the name; on desktop they become columns. */}
      <dl className="col-start-2 flex flex-wrap gap-x-3 gap-y-0.5 text-[13px] text-muted-foreground lg:contents">
        <div>
          <dt className="sr-only">Party size</dt>
          <dd className="tabular-nums">
            {guestCount} {guestCount === 1 ? 'guest' : 'guests'}
          </dd>
        </div>
        <div>
          <dt className="sr-only">Table</dt>
          <dd className="tabular-nums">Table {tableNumber}</dd>
        </div>
        <div className="min-w-0">
          <dt className="sr-only">Phone</dt>
          <dd className="truncate">
            <a
              href={telHref(reservation.guestPhoneNumber)}
              className="rounded-sm tabular-nums underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`Call ${guestName} on ${reservation.guestPhoneNumber}`}
            >
              {reservation.guestPhoneNumber}
            </a>
          </dd>
        </div>
      </dl>

      <div className="hidden flex-wrap items-center gap-1.5 lg:flex">
        <ReservationStatusBadge status={status} />
        {timing && <TimingChip timing={timing} />}
      </div>

      <div className={cn('col-start-2 flex items-center gap-1.5 lg:col-start-auto lg:justify-end', final && 'hidden lg:flex')}>
        {!final && (
          <>
            {showNoShow && (
              <Button variant="outline" size="sm" onClick={() => run('no-show')}>
                <UserX aria-hidden="true" />
                No-show
              </Button>
            )}
            {primary && PrimaryIcon && (
              <Button size="sm" variant={timing || primary === 'confirm' ? 'default' : 'outline'} onClick={() => run(primary)}>
                <PrimaryIcon aria-hidden="true" />
                {RESERVATION_ACTIONS[primary].label}
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="shrink-0 text-muted-foreground" aria-label={`More actions for ${guestName}`}>
                  <Ellipsis aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => onReschedule(reservation)}>
                  <CalendarClock aria-hidden="true" />
                  Reschedule
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onEdit(reservation)}>
                  <Pencil aria-hidden="true" />
                  Edit details
                </DropdownMenuItem>
                {canRun('no-show', status) &&
                  !showNoShow &&
                  (noShowAllowed ? (
                    <DropdownMenuItem onSelect={() => run('no-show')}>
                      <UserX aria-hidden="true" />
                      Mark as no-show
                    </DropdownMenuItem>
                  ) : (
                    // Soft-disabled rather than `disabled`, so it stays focusable and its tooltip can explain why.
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuItem
                          aria-disabled="true"
                          onSelect={(event) => event.preventDefault()}
                          className="cursor-not-allowed text-muted-foreground opacity-60 focus:bg-transparent"
                        >
                          <UserX aria-hidden="true" />
                          Mark as no-show
                          <span className="sr-only">, available from {time}</span>
                        </DropdownMenuItem>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-56">
                        Available from {time}. A guest can't be a no-show before their booking time.
                      </TooltipContent>
                    </Tooltip>
                  ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={() => onCancel(reservation)}>
                  <CalendarX2 aria-hidden="true" />
                  Cancel booking
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>
    </article>
  )
}

function TimingChip({ timing, className }: { timing: NonNullable<ReturnType<typeof timingOf>>; className?: string }) {
  const late = timing.kind === 'late'
  const text = late ? `Late by ${timing.minutes} min` : timing.minutes === 0 ? 'Due now' : `Arriving in ${timing.minutes} min`
  return (
    <StatusChip tone={late ? 'attention' : 'waiting'} className={className}>
      {text}
    </StatusChip>
  )
}
