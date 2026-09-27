import { AnimatePresence, motion } from 'motion/react'

import type { Reservation } from '@/api/reservations'
import { formatTime } from '@/lib/dates'
import { ReservationRow } from './ReservationRow'

const EASE = [0.2, 0.8, 0.2, 1] as const

interface ReservationTimelineProps {
  reservations: Reservation[]
  now: Date
  /** Show the "now" marker between past and upcoming hours. */
  isToday: boolean
  onReschedule: (reservation: Reservation) => void
  onEdit: (reservation: Reservation) => void
  onCancel: (reservation: Reservation) => void
}

interface HourGroup {
  label: string
  /** Start of the hour, for placing the "now" marker. */
  startsAt: Date
  items: Reservation[]
}

function groupByHour(reservations: Reservation[]): HourGroup[] {
  const groups: HourGroup[] = []
  for (const reservation of reservations) {
    const startsAt = new Date(reservation.reservationTime)
    startsAt.setMinutes(0, 0, 0)
    const label = formatTime(startsAt)
    const last = groups[groups.length - 1]
    if (last && last.label === label) last.items.push(reservation)
    else groups.push({ label, startsAt, items: [reservation] })
  }
  return groups
}

export function ReservationTimeline({ reservations, now, isToday, onReschedule, onEdit, onCancel }: ReservationTimelineProps) {
  const groups = groupByHour(reservations)
  // The marker sits before the first hour that hasn't finished yet, when earlier hours exist.
  const nowIndex = isToday ? groups.findIndex((g) => g.startsAt.getTime() + 3_600_000 > now.getTime()) : -1

  return (
    <ol aria-label="Bookings by hour" className="space-y-8">
      <AnimatePresence initial={false} mode="popLayout">
        {groups.map((group, index) => (
          <motion.li
            key={group.label}
            layout="position"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            transition={{ duration: 0.22, ease: EASE }}
          >
            {index === nowIndex && index > 0 && <NowMarker now={now} />}
            <div className="grid gap-3 sm:grid-cols-[4.5rem_minmax(0,1fr)] sm:gap-5">
              <h2 className="flex items-center gap-3 font-mono text-[11px] tracking-[0.16em] text-muted-foreground tabular-nums sm:block sm:pt-6">
                {group.label}
                <span className="h-px flex-1 bg-border sm:hidden" aria-hidden="true" />
                <span className="sr-only">
                  , {group.items.length} {group.items.length === 1 ? 'booking' : 'bookings'}
                </span>
              </h2>
              <ul className="relative space-y-3 sm:border-l sm:border-border sm:pl-5">
                <AnimatePresence initial={false} mode="popLayout">
                  {group.items.map((reservation) => (
                    <motion.li
                      key={reservation.id}
                      layout
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.15 } }}
                      transition={{ duration: 0.22, ease: EASE }}
                    >
                      <ReservationRow
                        reservation={reservation}
                        now={now}
                        onReschedule={onReschedule}
                        onEdit={onEdit}
                        onCancel={onCancel}
                      />
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </div>
          </motion.li>
        ))}
      </AnimatePresence>
    </ol>
  )
}

function NowMarker({ now }: { now: Date }) {
  return (
    <div
      role="separator"
      aria-label={`Now, ${formatTime(now)}`}
      className="mb-8 grid items-center gap-3 sm:grid-cols-[4.5rem_minmax(0,1fr)] sm:gap-5"
    >
      <span className="font-mono text-[11px] tracking-[0.16em] text-primary uppercase tabular-nums" aria-hidden="true">
        Now {formatTime(now)}
      </span>
      <span className="relative hidden h-px bg-primary/60 sm:block" aria-hidden="true">
        <span className="absolute top-1/2 -left-1 size-2 -translate-y-1/2 rounded-full bg-primary" />
      </span>
    </div>
  )
}
