import { useMemo } from 'react'
import { useMutation, useMutationState, useQuery, useQueryClient, type QueryClient, type QueryKey } from '@tanstack/react-query'

import { kitchenApi, kitchenKeys, type KitchenTicket, type KitchenView } from '@/api/kitchen'
import { orderKeys, ordersApi } from '@/api/orders'
import { useStations } from '@/features/stations/hooks'

/** Tickets refresh on the hub's OrderChanged event; this slow refetch only covers a dropped connection. */
const FALLBACK_REFETCH_MS = 60_000

export function useKitchenTickets(view: KitchenView | null) {
  return useQuery({
    queryKey: view ? kitchenKeys.tickets(view) : [...kitchenKeys.all, 'tickets', 'none'],
    queryFn: ({ signal }) => kitchenApi.tickets(view as KitchenView, signal),
    enabled: view !== null,
    refetchInterval: FALLBACK_REFETCH_MS,
    refetchOnWindowFocus: true,
  })
}

/** Active stations in display order, for the picker and the defaults. */
export function useActiveStations() {
  const query = useStations()
  const active = useMemo(() => (query.data ?? []).filter((s) => s.isActive), [query.data])
  return { ...query, active }
}

// ── Advancing items ──────────────────────────────────────────────────────────

/** Start (→ InProgress) or ready (→ Ready) one item, or every remaining item when bumping a ticket. */
export interface AdvanceItems {
  orderId: string
  itemIds: string[]
  to: 'InProgress' | 'Ready'
}

const ADVANCE_KEY = ['kitchen', 'advance'] as const

/**
 * Applies the change to one cached ticket list. Stations only list Pending and InProgress
 * items, so a ready item leaves the station screen (and an emptied ticket with it);
 * the pass keeps it, marked Ready.
 */
function patchTickets(tickets: KitchenTicket[] | undefined, isPass: boolean, { orderId, itemIds, to }: AdvanceItems) {
  if (!tickets) return tickets
  const ids = new Set(itemIds)
  return tickets.flatMap((ticket) => {
    if (ticket.orderId !== orderId) return [ticket]
    const items = ticket.items
      .map((item) => (ids.has(item.id) ? { ...item, status: to } : item))
      .filter((item) => isPass || item.status !== 'Ready')
    return items.length > 0 ? [{ ...ticket, items }] : []
  })
}

function patchAllTicketCaches(queryClient: QueryClient, change: AdvanceItems) {
  const snapshot = queryClient.getQueriesData<KitchenTicket[]>({ queryKey: [...kitchenKeys.all, 'tickets'] })
  for (const [key, data] of snapshot) {
    queryClient.setQueryData<KitchenTicket[]>(key, patchTickets(data, key[2] === 'pass', change))
  }
  return snapshot as [QueryKey, KitchenTicket[] | undefined][]
}

/**
 * Optimistic: every cached ticket list (station and pass) changes at once and is rolled
 * back if the API refuses. Bumping sends one request per item; if any fails, the whole
 * change rolls back and the refetch shows what actually went through.
 */
export function useAdvanceItems() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: ADVANCE_KEY,
    mutationFn: async ({ orderId, itemIds, to }: AdvanceItems) => {
      const action = to === 'InProgress' ? 'start' : 'ready'
      const results = await Promise.allSettled(itemIds.map((itemId) => ordersApi.itemAction(orderId, itemId, action)))
      const failure = results.find((r): r is PromiseRejectedResult => r.status === 'rejected')
      if (failure) throw failure.reason
    },
    onMutate: async (change) => {
      await queryClient.cancelQueries({ queryKey: kitchenKeys.all })
      return { snapshot: patchAllTicketCaches(queryClient, change) }
    },
    onError: (_error, _change, context) => {
      context?.snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data))
    },
    onSettled: (_data, _error, { orderId }) => {
      // Only the last of several quick taps refetches, so an early response can't undo a later tap.
      if (queryClient.isMutating({ mutationKey: ADVANCE_KEY }) === 1) {
        void queryClient.invalidateQueries({ queryKey: kitchenKeys.all })
        void queryClient.invalidateQueries({ queryKey: orderKeys.open() })
        void queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) })
      }
    },
  })
}

/** Item ids with a start / ready request in flight, so a second tap can't skip a step. */
export function useItemsInFlight(): ReadonlySet<string> {
  const pending = useMutationState({
    filters: { mutationKey: ADVANCE_KEY, status: 'pending' },
    select: (mutation) => (mutation.state.variables as AdvanceItems | undefined)?.itemIds ?? [],
  })
  return useMemo(() => new Set(pending.flat()), [pending])
}

// ── Firing the next course ───────────────────────────────────────────────────

/**
 * Fire the order's next held course from the pass. Not optimistic: the server decides what
 * moves (stations that fire immediately are already out), so the screen waits for its answer.
 */
export function useFireNext() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderId: string) => ordersApi.fireNext(orderId),
    onSuccess: (order) => queryClient.setQueryData(orderKeys.detail(order.id), order),
    onSettled: (_data, _error, orderId) => {
      void queryClient.invalidateQueries({ queryKey: kitchenKeys.all })
      void queryClient.invalidateQueries({ queryKey: orderKeys.open() })
      void queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) })
    },
  })
}
