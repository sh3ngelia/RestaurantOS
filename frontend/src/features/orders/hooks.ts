import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { ApiError, getErrorMessage } from '@/api/errors'
import { orderKeys, ordersApi, type AddItemInput, type ItemAction, type Order } from '@/api/orders'
import { tableKeys } from '@/api/tables'
import { orderTotal } from './rules'

/** Until SignalR arrives, open orders are polled so ready items show up on their own. */
const POLL_MS = 10_000

// ── Queries ──────────────────────────────────────────────────────────────────

export function useOpenOrders({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: orderKeys.open(),
    queryFn: ({ signal }) => ordersApi.listOpen(undefined, signal),
    enabled,
    refetchInterval: POLL_MS,
    refetchOnWindowFocus: true,
  })
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: orderKeys.detail(id ?? ''),
    queryFn: ({ signal }) => ordersApi.get(id as string, signal),
    enabled: !!id,
    // Stop polling once the order is closed or cancelled.
    refetchInterval: (query) => (query.state.data && query.state.data.status !== 'Opened' ? false : POLL_MS),
    refetchOnWindowFocus: true,
  })
}

// ── Errors ───────────────────────────────────────────────────────────────────

/** Domain-rule 400s and 409s carry a human-readable `detail`; show it as a toast. */
export function notifyOrderError(error: unknown, title: string) {
  if (error instanceof ApiError && error.status === 404) {
    toast.error('Not found', { description: 'That order or item no longer exists. The screen has been refreshed.' })
    return
  }
  toast.error(title, { description: getErrorMessage(error) })
}

// ── Cache ────────────────────────────────────────────────────────────────────

/** Writes the server's copy of an order to the detail cache and the open-orders list. */
function storeOrder(queryClient: QueryClient, order: Order) {
  queryClient.setQueryData(orderKeys.detail(order.id), order)
  queryClient.setQueryData<Order[]>(orderKeys.open(), (list) => {
    if (!list) return list
    const rest = list.filter((o) => o.id !== order.id)
    return order.status === 'Opened' ? [...rest, order] : rest
  })
}

// ── Mutations ────────────────────────────────────────────────────────────────

/** Open an order on an occupied table. */
export function useStartOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (tableId: string) => ordersApi.open(tableId),
    onSuccess: (order) => storeOrder(queryClient, order),
    // A 409 means someone else opened one; refresh so it appears.
    onSettled: () => queryClient.invalidateQueries({ queryKey: orderKeys.open() }),
  })
}

export function useAddItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ orderId, input }: { orderId: string; input: AddItemInput }) => ordersApi.addItem(orderId, input),
    onSuccess: (order) => storeOrder(queryClient, order),
  })
}

export type OrderAction =
  | { type: 'quantity'; itemId: string; quantity: number }
  | { type: 'remove'; itemId: string }
  | { type: 'send' }
  | { type: 'fireNext' }
  | { type: 'item'; itemId: string; action: ItemAction }
  | { type: 'close' }
  | { type: 'cancel' }

/**
 * What the order will look like after the action, or null to wait for the server.
 * Only quantity and removal are predicted: item status always comes from the API's
 * response, never from course or currentCourse on the client.
 */
function predict(order: Order, action: OrderAction): Order | null {
  let next: Order
  switch (action.type) {
    case 'quantity':
      next = {
        ...order,
        items: order.items.map((i) =>
          i.id === action.itemId ? { ...i, quantity: action.quantity, totalPrice: i.unitPrice * action.quantity } : i,
        ),
      }
      break
    case 'remove':
      next = { ...order, items: order.items.filter((i) => i.id !== action.itemId) }
      break
    default:
      // Send, fire, serve, start, ready, cancel, close: status changes wait for the server.
      return null
  }
  return { ...next, totalAmount: orderTotal(next.items) }
}

function run(order: Order, action: OrderAction): Promise<Order> {
  switch (action.type) {
    case 'quantity':
      return ordersApi.updateQuantity(order.id, action.itemId, action.quantity)
    case 'remove':
      return ordersApi.removeItem(order.id, action.itemId)
    case 'send':
      return ordersApi.send(order.id)
    case 'fireNext':
      return ordersApi.fireNext(order.id)
    case 'item':
      return ordersApi.itemAction(order.id, action.itemId, action.action)
    case 'close':
      return ordersApi.close(order.id)
    case 'cancel':
      return ordersApi.cancel(order.id)
  }
}

const ORDER_MUTATION_KEY = ['orders', 'action'] as const

/**
 * Every change to an open order. Each endpoint returns the full order, which is stored
 * as-is. Quantity and removal are optimistic (rolled back if refused); status changes
 * are shown only once the server has answered.
 */
export function useOrderAction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: ORDER_MUTATION_KEY,
    mutationFn: ({ order, action }: { order: Order; action: OrderAction }) => run(order, action),
    onMutate: async ({ order, action }) => {
      const key = orderKeys.detail(order.id)
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<Order>(key)
      const current = previous ?? order
      const optimistic = predict(current, action)
      if (optimistic) queryClient.setQueryData(key, optimistic)
      return { previous }
    },
    onError: (_error, { order }, context) => {
      if (context?.previous) queryClient.setQueryData(orderKeys.detail(order.id), context.previous)
    },
    onSuccess: (updated, { action }) => {
      storeOrder(queryClient, updated)
      // The floor shows order summaries; ending an order may also change the table.
      if (action.type === 'close' || action.type === 'cancel') {
        void queryClient.invalidateQueries({ queryKey: tableKeys.all })
      }
    },
    onSettled: (_data, _error, { order }) => {
      // Only the last of several quick taps refetches, so an early response can't undo a later one.
      if (queryClient.isMutating({ mutationKey: ORDER_MUTATION_KEY }) === 1) {
        void queryClient.invalidateQueries({ queryKey: orderKeys.detail(order.id) })
        void queryClient.invalidateQueries({ queryKey: orderKeys.open() })
      }
    },
  })
}
