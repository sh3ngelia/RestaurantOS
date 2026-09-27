import { CalendarCheck, CalendarX2, UserX, UsersRound, type LucideIcon } from 'lucide-react'

import type { Reservation, ReservationAction, ReservationStatus } from '@/api/reservations'

export const STATUS_LABELS: Record<ReservationStatus, string> = {
  Pending: 'Pending',
  Confirmed: 'Confirmed',
  Arrived: 'Arrived',
  Cancelled: 'Cancelled',
  NoShow: 'No-show',
}

/** Arrived, Cancelled and NoShow end the booking; the API accepts no further changes. */
export const FINAL_STATUSES: readonly ReservationStatus[] = ['Arrived', 'Cancelled', 'NoShow']

export function isFinal(status: ReservationStatus) {
  return FINAL_STATUSES.includes(status)
}

/** Counts toward expected covers: everything except cancelled and no-show bookings. */
export function countsTowardCovers(reservation: Reservation) {
  return reservation.status !== 'Cancelled' && reservation.status !== 'NoShow'
}

/**
 * Calm, distinct treatments that echo the Tables module: a booked table is the
 * cool "reserved" tone, arrived guests are seated copper, finished bookings recede.
 */
export const STATUS_TONES: Record<ReservationStatus, { row: string; badge: string; dot: string }> = {
  Pending: {
    row: 'border-dashed border-border-strong bg-card',
    badge: 'border-dashed border-border-strong text-muted-foreground',
    dot: 'bg-muted-foreground/60',
  },
  Confirmed: {
    row: 'border-border bg-card',
    badge: 'border-reserved/35 bg-reserved/10 text-reserved',
    dot: 'bg-reserved',
  },
  Arrived: {
    row: 'border-primary/35 bg-primary-soft',
    badge: 'border-primary/30 bg-primary/15 text-primary',
    dot: 'bg-primary',
  },
  Cancelled: {
    row: 'border-border bg-card/40 opacity-70',
    badge: 'border-border text-muted-foreground',
    dot: 'bg-muted-foreground/40',
  },
  NoShow: {
    row: 'border-border bg-card/40 opacity-70',
    badge: 'border-destructive/30 text-destructive',
    dot: 'bg-destructive/70',
  },
}

interface ActionDefinition {
  label: string
  icon: LucideIcon
  /** Statuses the API accepts this action from (mirrors the Reservation entity). */
  from: readonly ReservationStatus[]
  to: ReservationStatus
  successTitle: (guestName: string) => string
}

export const RESERVATION_ACTIONS: Record<ReservationAction, ActionDefinition> = {
  confirm: {
    label: 'Confirm',
    icon: CalendarCheck,
    from: ['Pending'],
    to: 'Confirmed',
    successTitle: (name) => `${name}'s booking confirmed`,
  },
  arrive: {
    label: 'Seat guests',
    icon: UsersRound,
    from: ['Confirmed'],
    to: 'Arrived',
    successTitle: (name) => `${name}'s party is seated`,
  },
  'no-show': {
    label: 'No-show',
    icon: UserX,
    from: ['Confirmed'],
    to: 'NoShow',
    successTitle: (name) => `${name} marked as a no-show`,
  },
  cancel: {
    label: 'Cancel',
    icon: CalendarX2,
    from: ['Pending', 'Confirmed'],
    to: 'Cancelled',
    successTitle: (name) => `${name}'s booking cancelled`,
  },
}

export function canRun(action: ReservationAction, status: ReservationStatus) {
  return RESERVATION_ACTIONS[action].from.includes(status)
}

// ── Timing ───────────────────────────────────────────────────────────────────

export const ARRIVING_SOON_MINUTES = 30

export type Timing = { kind: 'soon'; minutes: number } | { kind: 'late'; minutes: number } | null

/**
 * "soon": due within the next 30 minutes and still expected.
 * "late": the time has passed and the booking is still only Confirmed.
 */
export function timingOf(reservation: Reservation, now: Date): Timing {
  const diffMinutes = Math.round((new Date(reservation.reservationTime).getTime() - now.getTime()) / 60_000)
  if (reservation.status === 'Confirmed' && diffMinutes < 0) return { kind: 'late', minutes: -diffMinutes }
  if ((reservation.status === 'Confirmed' || reservation.status === 'Pending') && diffMinutes >= 0 && diffMinutes <= ARRIVING_SOON_MINUTES) {
    return { kind: 'soon', minutes: diffMinutes }
  }
  return null
}
