import { apiRequest } from './client'
import { parseUtc } from '@/lib/dates'

export const TABLE_STATUSES = ['Available', 'Occupied', 'Reserved'] as const
/**
 * Computed by the server. "Reserved" means either a manual hold (isHeld) or a
 * confirmed booking starting within 45 minutes / up to 20 minutes late.
 */
export type TableStatus = (typeof TABLE_STATUSES)[number]

export interface TableNextReservation {
  reservationId: string
  /** Normalised to a UTC ISO string ending in "Z". */
  reservationTime: string
  guestName: string
  guestCount: number
  isLate: boolean
}

export interface DiningTable {
  id: string
  tableNumber: number
  capacity: number
  status: TableStatus
  /** The host put a manual hold on the table. */
  isHeld: boolean
  /** The nearest confirmed booking in the next 12 hours, if any. */
  nextReservation: TableNextReservation | null
}

export interface TableInput {
  tableNumber: number
  capacity: number
}

/** Status changes the API exposes as POST /api/tables/{id}/{action}. "reserve" is a manual hold. */
export type TableAction = 'occupy' | 'reserve' | 'free'

const TABLES = '/api/tables'

/** Fills fields older responses may omit and pins the booking time to UTC. */
function normalise(table: DiningTable): DiningTable {
  const next = table.nextReservation ?? null
  return {
    ...table,
    isHeld: table.isHeld ?? false,
    nextReservation: next && { ...next, reservationTime: parseUtc(next.reservationTime).toISOString() },
  }
}

export const tablesApi = {
  list: async (signal?: AbortSignal) => (await apiRequest<DiningTable[]>(TABLES, { signal })).map(normalise),
  create: async (input: TableInput) => normalise(await apiRequest<DiningTable>(TABLES, { method: 'POST', body: input })),
  update: async (id: string, input: TableInput) =>
    normalise(await apiRequest<DiningTable>(`${TABLES}/${id}`, { method: 'PUT', body: input })),
  changeStatus: async (id: string, action: TableAction) =>
    normalise(await apiRequest<DiningTable>(`${TABLES}/${id}/${action}`, { method: 'POST' })),
  remove: (id: string) => apiRequest<void>(`${TABLES}/${id}`, { method: 'DELETE' }),
}

export const tableKeys = {
  all: ['tables'] as const,
  list: () => [...tableKeys.all, 'list'] as const,
}
