import type { Reservation } from '@/api/reservations'
import { countsTowardCovers } from './status'

export interface DaySummary {
  /** Every booking on the day, whatever its status. */
  bookings: number
  /** Guests expected: sum of party sizes, excluding cancelled and no-show bookings. */
  coversExpected: number
  /** Bookings whose guests have arrived. */
  arrived: number
  /** Guests from arrived bookings. */
  coversArrived: number
  /** Bookings still counting toward covers (the denominator for "arrived"). */
  active: number
}

export function summarizeDay(reservations: Reservation[]): DaySummary {
  let coversExpected = 0
  let arrived = 0
  let coversArrived = 0
  let active = 0
  for (const r of reservations) {
    if (countsTowardCovers(r)) {
      coversExpected += r.guestCount
      active += 1
    }
    if (r.status === 'Arrived') {
      arrived += 1
      coversArrived += r.guestCount
    }
  }
  return { bookings: reservations.length, coversExpected, arrived, coversArrived, active }
}
