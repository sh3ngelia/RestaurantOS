import type { DiningTable } from '@/api/tables'
import type { CreateReservationInput, Reservation, UpdateGuestInfoInput } from '@/api/reservations'
import { addDays, combineLocal, isDayKey, toDayKey, toTimeValue, todayKey } from '@/lib/dates'

/*
 * Client rules mirroring CreateReservationRequestValidator, UpdateReservationGuestInfoRequestValidator
 * and RescheduleReservationRequestValidator. The server stays authoritative.
 */
export const RESERVATION_LIMITS = { name: 150, phone: 20, notes: 1000, guestsMin: 1, guestsMax: 30 } as const

// ── Time slots ───────────────────────────────────────────────────────────────

/** Bookable service hours: first seating 11:00, last 23:00, every 15 minutes. */
const FIRST_SLOT_MINUTES = 11 * 60
const LAST_SLOT_MINUTES = 23 * 60
const SLOT_STEP = 15

const ALL_SLOTS = Array.from(
  { length: (LAST_SLOT_MINUTES - FIRST_SLOT_MINUTES) / SLOT_STEP + 1 },
  (_, i) => {
    const total = FIRST_SLOT_MINUTES + i * SLOT_STEP
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
  },
)

/**
 * Slots offered for a day: past slots are dropped for today. `keep` preserves an
 * existing booking's time even if it falls outside service hours.
 */
export function timeSlotsFor(dayKey: string, now: Date, keep?: string): string[] {
  const slots = ALL_SLOTS.filter((slot) => combineLocal(dayKey, slot) > now)
  if (keep && !slots.includes(keep)) return [...slots, keep].sort()
  return slots
}

/** A sensible default: the next open slot at least 15 minutes out, else tomorrow's evening service. */
export function defaultDateTime(preferredDay: string, now: Date): { date: string; time: string } {
  const day = isDayKey(preferredDay) && preferredDay >= todayKey() ? preferredDay : todayKey()
  const soon = new Date(now.getTime() + 15 * 60_000)
  const slots = timeSlotsFor(day, soon)
  if (day !== todayKey()) return { date: day, time: '19:00' }
  if (slots[0]) return { date: day, time: slots.includes('19:00') ? '19:00' : slots[0] }
  return { date: addDays(day, 1), time: '19:00' }
}

// ── Shared field rules ───────────────────────────────────────────────────────

type Errors<F extends string> = Partial<Record<F, string>>

function validateGuest(values: { guestName: string; guestPhoneNumber: string; guestCount: string; notes: string }) {
  const errors: Errors<'guestName' | 'guestPhoneNumber' | 'guestCount' | 'notes'> = {}
  const name = values.guestName.trim()
  if (!name) errors.guestName = 'Guest name is required.'
  else if (name.length > RESERVATION_LIMITS.name) errors.guestName = `Keep the name under ${RESERVATION_LIMITS.name} characters.`

  const phone = values.guestPhoneNumber.trim()
  if (!phone) errors.guestPhoneNumber = 'Phone number is required.'
  else if (phone.length > RESERVATION_LIMITS.phone) errors.guestPhoneNumber = `Use at most ${RESERVATION_LIMITS.phone} characters.`
  else if (!/\d/.test(phone)) errors.guestPhoneNumber = 'Enter a phone number with digits.'

  const count = Number(values.guestCount.trim())
  if (!values.guestCount.trim()) errors.guestCount = 'How many guests?'
  else if (!Number.isInteger(count) || count < RESERVATION_LIMITS.guestsMin || count > RESERVATION_LIMITS.guestsMax) {
    errors.guestCount = `Guest count must be between ${RESERVATION_LIMITS.guestsMin} and ${RESERVATION_LIMITS.guestsMax}.`
  }

  if (values.notes.trim().length > RESERVATION_LIMITS.notes) {
    errors.notes = `Keep notes under ${RESERVATION_LIMITS.notes} characters.`
  }
  return errors
}

function validateWhen(values: { date: string; time: string }, now: Date) {
  const errors: Errors<'date' | 'time'> = {}
  if (!isDayKey(values.date)) errors.date = 'Choose a date.'
  else if (values.date < toDayKey(now)) errors.date = 'Choose today or a later date.'
  if (!/^\d{2}:\d{2}$/.test(values.time)) errors.time = 'Choose a time.'
  else if (!errors.date && combineLocal(values.date, values.time) <= now) errors.time = 'Reservation time must be in the future.'
  return errors
}

// ── New reservation ──────────────────────────────────────────────────────────

export const CREATE_FIELDS = ['date', 'time', 'guestCount', 'tableId', 'guestName', 'guestPhoneNumber', 'notes'] as const
export type CreateField = (typeof CREATE_FIELDS)[number]
export type CreateValues = Record<CreateField, string>

export function validateCreate(values: CreateValues, now: Date, tables: DiningTable[]): Errors<CreateField> {
  const errors: Errors<CreateField> = { ...validateWhen(values, now), ...validateGuest(values) }
  if (!values.tableId) errors.tableId = 'Choose a table.'
  else {
    const table = tables.find((t) => t.id === values.tableId)
    const count = Number(values.guestCount)
    if (table && !errors.guestCount && table.capacity < count) {
      errors.tableId = `Table ${table.tableNumber} seats only ${table.capacity}.`
    }
  }
  return errors
}

export function toCreateInput(values: CreateValues): CreateReservationInput {
  return {
    tableId: values.tableId,
    guestName: values.guestName.trim(),
    guestPhoneNumber: values.guestPhoneNumber.trim(),
    guestCount: Number(values.guestCount.trim()),
    reservationTime: combineLocal(values.date, values.time).toISOString(),
    notes: values.notes.trim() || null,
  }
}

// ── Edit guest details ───────────────────────────────────────────────────────

export const EDIT_FIELDS = ['guestName', 'guestPhoneNumber', 'guestCount', 'notes'] as const
export type EditField = (typeof EDIT_FIELDS)[number]
export type EditValues = Record<EditField, string>

export function editValues(reservation: Reservation): EditValues {
  return {
    guestName: reservation.guestName,
    guestPhoneNumber: reservation.guestPhoneNumber,
    guestCount: String(reservation.guestCount),
    notes: reservation.notes ?? '',
  }
}

export function validateEdit(values: EditValues, tableCapacity: number | undefined): Errors<EditField> {
  const errors: Errors<EditField> = validateGuest(values)
  const count = Number(values.guestCount)
  if (!errors.guestCount && tableCapacity !== undefined && count > tableCapacity) {
    errors.guestCount = `The table seats only ${tableCapacity}.`
  }
  return errors
}

export function toEditInput(values: EditValues): UpdateGuestInfoInput {
  return {
    guestName: values.guestName.trim(),
    guestPhoneNumber: values.guestPhoneNumber.trim(),
    guestCount: Number(values.guestCount.trim()),
    notes: values.notes.trim() || null,
  }
}

// ── Reschedule ───────────────────────────────────────────────────────────────

export const RESCHEDULE_FIELDS = ['date', 'time'] as const
export type RescheduleField = (typeof RESCHEDULE_FIELDS)[number]
export type RescheduleValues = Record<RescheduleField, string>

export function rescheduleValues(reservation: Reservation): RescheduleValues {
  const at = new Date(reservation.reservationTime)
  return { date: toDayKey(at), time: toTimeValue(at) }
}

export function validateReschedule(values: RescheduleValues, now: Date): Errors<RescheduleField> {
  return validateWhen(values, now)
}
