import { Armchair, CalendarClock, CalendarX2, CircleAlert, Clock, Ellipsis, NotebookPen, Pencil, Phone, UserX, Users } from 'lucide-react'
import { toast } from 'sonner'

import type { Reservation, ReservationAction } from '@/api/reservations'
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
import { RESERVATION_ACTIONS, STATUS_TONES, canRun, isFinal, timingOf } from '../status'
import { ReservationStatusBadge } from './ReservationStatusBadge'

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
        'surface-edge flex flex-col gap-3 rounded-xl border p-4 transition-[background-color,border-color,opacity] duration-300 sm:flex-row sm:items-center sm:gap-5 sm:p-5',
        STATUS_TONES[status].row,
        timing?.kind === 'soon' && 'border-primary/40',
        timing?.kind === 'late' && 'border-destructive/40',
      )}
    >
      <div className="flex items-center gap-3 sm:w-20 sm:shrink-0 sm:flex-col sm:items-start sm:gap-1">
        <p className={cn('font-serif text-2xl leading-none tabular-nums', final && 'text-muted-foreground')}>
          <time dateTime={reservation.reservationTime}>{time}</time>
        </p>
        {timing && <TimingChip timing={timing} className="sm:hidden" />}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
          <h3
            id={nameId}
            className={cn(
              'font-sans text-[15px] font-medium tracking-normal',
              status === 'Cancelled' && 'text-muted-foreground line-through decoration-muted-foreground/60',
            )}
          >
            {guestName}
          </h3>
          <ReservationStatusBadge status={status} />
          {timing && <TimingChip timing={timing} className="hidden sm:inline-flex" />}
        </div>

        <dl className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Party size</dt>
            <Users className="size-4" aria-hidden="true" />
            <dd>
              {guestCount} {guestCount === 1 ? 'guest' : 'guests'}
            </dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Table</dt>
            <Armchair className="size-4" aria-hidden="true" />
            <dd>Table {tableNumber}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Phone</dt>
            <Phone className="size-4" aria-hidden="true" />
            <dd>
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

        {reservation.notes && (
          <p className="mt-2 flex gap-1.5 text-sm text-muted-foreground">
            <NotebookPen className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span className="line-clamp-2">
              <span className="sr-only">Notes: </span>
              {reservation.notes}
            </span>
          </p>
        )}
      </div>

      {!final && (
        <div className="flex items-center gap-2 border-t border-border pt-3 sm:border-0 sm:pt-0">
          {showNoShow && (
            <Button variant="outline" className="h-10 flex-1 sm:flex-none" onClick={() => run('no-show')}>
              <UserX aria-hidden="true" />
              No-show
            </Button>
          )}
          {primary && PrimaryIcon && (
            <Button
              variant={timing || primary === 'confirm' ? 'default' : 'outline'}
              className="h-10 flex-1 sm:flex-none"
              onClick={() => run(primary)}
            >
              <PrimaryIcon aria-hidden="true" />
              {RESERVATION_ACTIONS[primary].label}
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-10 shrink-0 text-muted-foreground" aria-label={`More actions for ${guestName}`}>
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
        </div>
      )}
    </article>
  )
}

function TimingChip({ timing, className }: { timing: NonNullable<ReturnType<typeof timingOf>>; className?: string }) {
  const late = timing.kind === 'late'
  const Icon = late ? CircleAlert : Clock
  const text = late ? `Late by ${timing.minutes} min` : timing.minutes === 0 ? 'Due now' : `Arriving in ${timing.minutes} min`
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        late ? 'border-destructive/30 bg-destructive/10 text-destructive' : 'border-primary/30 bg-primary/10 text-primary',
        className,
      )}
    >
      <Icon className="size-3" aria-hidden="true" />
      {text}
    </span>
  )
}
