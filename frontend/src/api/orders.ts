import { apiRequest } from './client'
import type { Allergen } from './menu'
import type { StationType } from './stations'
import { parseUtc } from '@/lib/dates'

export const COURSES = ['Starter', 'Main', 'Dessert'] as const
export type Course = (typeof COURSES)[number]

export type OrderStatus = 'Opened' | 'Closed' | 'Cancelled'
export type OrderType = 'DineIn' | 'Takeaway' | 'Delivery'

/**
 * Draft: on the ticket, not sent. Held: sent, waiting for its course to be fired.
 * Pending: fired to the station. InProgress -> Ready -> Served. Cancelled ends it.
 */
export type OrderItemStatus = 'Draft' | 'Held' | 'Pending' | 'InProgress' | 'Ready' | 'Served' | 'Cancelled'

export interface OrderItem {
  id: string
  menuItemId: string
  name: string
  unitPrice: number
  quantity: number
  totalPrice: number
  course: Course
  /** The station the item was ordered for; firing follows the station's firesImmediately flag on the server. */
  stationId: string
  stationName: string
  stationType: StationType
  allergens: Allergen[]
  seatNumber: number | null
  notes: string | null
  status: OrderItemStatus
  /** UTC ISO, normalised with "Z". */
  firedAt: string | null
  readyAt: string | null
}

export interface Order {
  id: string
  orderNumber: string
  type: OrderType
  status: OrderStatus
  tableId: string | null
  tableNumber: number | null
  waiterId: string | null
  notes: string | null
  currentCourse: Course | null
  totalAmount: number
  createdAt: string
  items: OrderItem[]
}

export interface AddItemInput {
  menuItemId: string
  quantity: number
  course: Course
  notes: string | null
  seatNumber: number | null
}

/** Item-level actions exposed as POST /api/orders/{id}/items/{itemId}/{action}. */
export type ItemAction = 'serve' | 'cancel' | 'start' | 'ready'

const BASE = '/api/orders'

const utc = (iso: string | null | undefined) => (iso ? parseUtc(iso).toISOString() : null)

/** Pins every timestamp to UTC and fills lists older responses may omit. */
function normalise(order: Order): Order {
  return {
    ...order,
    createdAt: utc(order.createdAt) ?? order.createdAt,
    items: (order.items ?? []).map((item) => ({
      ...item,
      allergens: item.allergens ?? [],
      firedAt: utc(item.firedAt),
      readyAt: utc(item.readyAt),
    })),
  }
}

const post = async (path: string, body?: unknown) =>
  normalise(await apiRequest<Order>(path, { method: 'POST', body }))

export const ordersApi = {
  /** Open orders, optionally for one table. */
  listOpen: async (tableId?: string, signal?: AbortSignal) => {
    const query = tableId ? `?tableId=${encodeURIComponent(tableId)}` : ''
    return (await apiRequest<Order[]>(`${BASE}${query}`, { signal })).map(normalise)
  },
  get: async (id: string, signal?: AbortSignal) => normalise(await apiRequest<Order>(`${BASE}/${id}`, { signal })),
  open: (tableId: string, notes: string | null = null) => post(BASE, { tableId, notes }),
  addItem: (id: string, input: AddItemInput) => post(`${BASE}/${id}/items`, input),
  updateQuantity: async (id: string, itemId: string, quantity: number) =>
    normalise(await apiRequest<Order>(`${BASE}/${id}/items/${itemId}`, { method: 'PATCH', body: { quantity } })),
  removeItem: async (id: string, itemId: string) =>
    normalise(await apiRequest<Order>(`${BASE}/${id}/items/${itemId}`, { method: 'DELETE' })),
  send: (id: string) => post(`${BASE}/${id}/send`),
  fireNext: (id: string) => post(`${BASE}/${id}/fire-next`),
  itemAction: (id: string, itemId: string, action: ItemAction) => post(`${BASE}/${id}/items/${itemId}/${action}`),
  close: (id: string) => post(`${BASE}/${id}/close`),
  cancel: (id: string) => post(`${BASE}/${id}/cancel`),
}

export const orderKeys = {
  all: ['orders'] as const,
  open: () => [...orderKeys.all, 'open'] as const,
  detail: (id: string) => [...orderKeys.all, 'detail', id] as const,
}
