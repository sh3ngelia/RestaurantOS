import { apiRequest } from './client'
import { dayRange, parseUtc } from '@/lib/dates'

export const RESERVATION_STATUSES = ['Pending', 'Confirmed', 'Arrived', 'Cancelled', 'NoShow'] as const
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number]

export interface Reservation {
  id: string
  tableId: string
  tableNumber: number
  guestName: string
  guestPhoneNumber: string
  guestCount: number
  /** Normalised to a UTC ISO string ending in "Z". */
  reservationTime: string
  status: ReservationStatus
  notes: string | null
}

export interface CreateReservationInput {
  tableId: string
  guestName: string
  guestPhoneNumber: string
  guestCount: number
  /** ISO 8601 with Z, from Date.toISOString(). */
  reservationTime: string
  notes: string | null
}

export interface UpdateGuestInfoInput {
  guestName: string
  guestPhoneNumber: string
  guestCount: number
  notes: string | null
}

/** Status changes the API exposes as POST /api/reservations/{id}/{action}. */
export type ReservationAction = 'confirm' | 'arrive' | 'cancel' | 'no-show'

const BASE = '/api/reservations'

/** Guarantees the timestamp carries its UTC designator before anything reads it. */
function normalise(reservation: Reservation): Reservation {
  return { ...reservation, reservationTime: parseUtc(reservation.reservationTime).toISOString() }
}

export const reservationsApi = {
  /** Reservations for one local calendar day. */
  listDay: async (dayKey: string, signal?: AbortSignal) => {
    const { from, to } = dayRange(dayKey)
    const query = new URLSearchParams({ from, to })
    const list = await apiRequest<Reservation[]>(`${BASE}?${query}`, { signal })
    return list.map(normalise)
  },
  get: async (id: string, signal?: AbortSignal) => normalise(await apiRequest<Reservation>(`${BASE}/${id}`, { signal })),
  create: async (input: CreateReservationInput) =>
    normalise(await apiRequest<Reservation>(BASE, { method: 'POST', body: input })),
  updateGuestInfo: async (id: string, input: UpdateGuestInfoInput) =>
    normalise(await apiRequest<Reservation>(`${BASE}/${id}`, { method: 'PUT', body: input })),
  reschedule: async (id: string, reservationTime: string) =>
    normalise(await apiRequest<Reservation>(`${BASE}/${id}/reschedule`, { method: 'PATCH', body: { reservationTime } })),
  changeStatus: async (id: string, action: ReservationAction) =>
    normalise(await apiRequest<Reservation>(`${BASE}/${id}/${action}`, { method: 'POST' })),
}

export const reservationKeys = {
  all: ['reservations'] as const,
  day: (dayKey: string) => [...reservationKeys.all, 'day', dayKey] as const,
}
