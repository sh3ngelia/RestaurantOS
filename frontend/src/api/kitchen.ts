import { apiRequest } from './client'
import type { Allergen } from './menu'
import type { Course, OrderItemStatus } from './orders'
import type { StationType } from './stations'
import { parseUtc } from '@/lib/dates'

/**
 * A line on a kitchen ticket. Stations see Held, Pending and InProgress; the passes also see Ready.
 * Held items were sent but wait for their course to be fired: they have no firedAt and can't be started.
 */
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
  /** UTC ISO, normalised with "Z". Null while the item is Held. */
  firedAt: string | null
}

/**
 * One order's items as the kitchen sees them, limited to the station or type asked for: never the
 * whole order. Fired items, and held ones waiting for their course.
 */
export interface KitchenTicket {
  orderId: string
  orderNumber: string
  tableNumber: number | null
  /** When the ticket was first fired. UTC ISO, normalised with "Z"; null if nothing on it has been fired. */
  firedAt: string | null
  items: KitchenTicketItem[]
}

/**
 * Which tickets a screen shows. The API enforces who may ask for what (403 with a `detail`):
 * - one station: Kitchen users Kitchen-type stations, Bar users Bar-type, Managers any;
 * - a pass for one station type (`?type=`): same rule by type;
 * - every station (`type: null`): Managers only.
 */
export type KitchenView = { kind: 'station'; stationId: string } | { kind: 'pass'; type: StationType | null }

const utc = (iso: string | null | undefined) => (iso ? parseUtc(iso).toISOString() : null)

/** The API's timestamps are .NET DateTimes; pin them to UTC like every other client here. */
function normalise(ticket: KitchenTicket): KitchenTicket {
  return {
    ...ticket,
    firedAt: utc(ticket.firedAt),
    items: (ticket.items ?? []).map((item) => ({ ...item, allergens: item.allergens ?? [], firedAt: utc(item.firedAt) })),
  }
}

export const kitchenApi = {
  /** Oldest ticket first. */
  tickets: async (view: KitchenView, signal?: AbortSignal) => {
    const query =
      view.kind === 'station'
        ? `?stationId=${encodeURIComponent(view.stationId)}`
        : view.type
          ? `?type=${view.type}`
          : ''
    return (await apiRequest<KitchenTicket[]>(`/api/kitchen/tickets${query}`, { signal })).map(normalise)
  },
}

export const kitchenKeys = {
  all: ['kitchen'] as const,
  /** ['kitchen', 'tickets', 'station' | 'pass', stationId | type | 'all'] */
  tickets: (view: KitchenView) =>
    [...kitchenKeys.all, 'tickets', view.kind, view.kind === 'station' ? view.stationId : (view.type ?? 'all')] as const,
}
