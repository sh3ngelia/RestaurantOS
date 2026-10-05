import { apiRequest } from './client'
import type { Allergen } from './menu'
import type { Course, OrderItemStatus } from './orders'
import { parseUtc } from '@/lib/dates'

/** A line on a kitchen ticket. Stations see Pending and InProgress; the pass also sees Ready. */
export interface KitchenTicketItem {
  id: string
  name: string
  quantity: number
  course: Course
  seatNumber: number | null
  notes: string | null
  allergens: Allergen[]
  status: OrderItemStatus
  stationId: string
  stationName: string
  /** UTC ISO, normalised with "Z". */
  firedAt: string | null
}

/** One order's fired items, as the kitchen sees them. */
export interface KitchenTicket {
  orderId: string
  orderNumber: string
  tableNumber: number | null
  /** When the ticket was first fired. UTC ISO, normalised with "Z". */
  firedAt: string
  items: KitchenTicketItem[]
}

/** Which tickets a screen shows: one station, or the pass (every station). */
export type KitchenView = { kind: 'station'; stationId: string } | { kind: 'pass' }

const utc = (iso: string | null | undefined) => (iso ? parseUtc(iso).toISOString() : null)

/** The API's timestamps are .NET DateTimes; pin them to UTC like every other client here. */
function normalise(ticket: KitchenTicket): KitchenTicket {
  return {
    ...ticket,
    firedAt: utc(ticket.firedAt) ?? ticket.firedAt,
    items: (ticket.items ?? []).map((item) => ({ ...item, allergens: item.allergens ?? [], firedAt: utc(item.firedAt) })),
  }
}

export const kitchenApi = {
  /** Oldest ticket first. Without a station: the pass. */
  tickets: async (view: KitchenView, signal?: AbortSignal) => {
    const query = view.kind === 'station' ? `?stationId=${encodeURIComponent(view.stationId)}` : ''
    return (await apiRequest<KitchenTicket[]>(`/api/kitchen/tickets${query}`, { signal })).map(normalise)
  },
}

export const kitchenKeys = {
  all: ['kitchen'] as const,
  tickets: (view: KitchenView) => [...kitchenKeys.all, 'tickets', view.kind === 'station' ? view.stationId : 'pass'] as const,
}
