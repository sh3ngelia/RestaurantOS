import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { ApiError, getErrorMessage } from '@/api/errors'
import { reservationKeys, reservationsApi } from '@/api/reservations'
import { tableKeys, tablesApi, type DiningTable, type TableInput } from '@/api/tables'
import { QUICK_ACTIONS, type QuickAction } from './status'

// ── Queries ──────────────────────────────────────────────────────────────────

export function useTables({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: tableKeys.list(),
    queryFn: ({ signal }) => tablesApi.list(signal),
    select: (tables) => [...tables].sort((a, b) => a.tableNumber - b.tableNumber),
    enabled,
    // Status is computed server-side from the clock (tables turn Reserved as bookings
    // approach) and other hosts seat guests, so poll to stay current without a reload.
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  })
}

// ── Errors ───────────────────────────────────────────────────────────────────

/**
 * Toasts for actions outside a form. 400 from a status change carries the
 * DomainException message ("Only available tables can be reserved") in `detail`.
 */
export function notifyTableError(error: unknown, title: string) {
  if (error instanceof ApiError && error.status === 404) {
    toast.error('Table not found', { description: 'Someone else removed it. The floor has been refreshed.' })
    return
  }
  toast.error(title, { description: getErrorMessage(error) })
}

// ── Mutations ────────────────────────────────────────────────────────────────

function patchTable(tables: DiningTable[] | undefined, id: string, update: (t: DiningTable) => DiningTable | null) {
  return tables?.flatMap((table) => {
    if (table.id !== id) return [table]
    const next = update(table)
    return next ? [next] : []
  })
}

const STATUS_MUTATION_KEY = ['tables', 'status'] as const

/**
 * Every quick action on the floor: seat, hold, release, clear, seat the booked party
 * (which arrives their reservation), or seat a walk-in. Optimistic, rolled back if the
 * API refuses, then reconciled with the server's computed status.
 */
export function useQuickAction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: STATUS_MUTATION_KEY,
    mutationFn: async ({ table, action }: { table: DiningTable; action: QuickAction }) => {
      const { endpoint } = QUICK_ACTIONS[action]
      if (endpoint.kind === 'table') return tablesApi.changeStatus(table.id, endpoint.action)
      if (!table.nextReservation) throw new Error('This table has no booking to seat.')
      await reservationsApi.changeStatus(table.nextReservation.reservationId, 'arrive')
      return null
    },
    onMutate: async ({ table, action }) => {
      await queryClient.cancelQueries({ queryKey: tableKeys.list() })
      const previous = queryClient.getQueryData<DiningTable[]>(tableKeys.list())
      queryClient.setQueryData<DiningTable[]>(tableKeys.list(), (tables) =>
        patchTable(tables, table.id, (t) => ({ ...t, ...QUICK_ACTIONS[action].apply(t) })),
      )
      return { previous }
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(tableKeys.list(), context.previous)
    },
    onSuccess: (updated, { action }) => {
      // Status-change responses don't carry the booking info, so keep the cached nextReservation
      // and take only the stored status from the server until the list refetches.
      if (updated) {
        queryClient.setQueryData<DiningTable[]>(tableKeys.list(), (tables) =>
          patchTable(tables, updated.id, (t) => ({ ...t, status: updated.status, isHeld: updated.isHeld })),
        )
      }
      if (QUICK_ACTIONS[action].endpoint.kind === 'reservation-arrive') {
        void queryClient.invalidateQueries({ queryKey: reservationKeys.all })
      }
    },
    onSettled: () => {
      // Only the last of several quick taps refetches, so an early response can't undo a later one.
      if (queryClient.isMutating({ mutationKey: STATUS_MUTATION_KEY }) === 1) {
        void queryClient.invalidateQueries({ queryKey: tableKeys.list() })
      }
    },
  })
}

export function useSaveTable() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: TableInput }) =>
      id ? tablesApi.update(id, input) : tablesApi.create(input),
    onSettled: () => queryClient.invalidateQueries({ queryKey: tableKeys.all }),
  })
}

export function useDeleteTable() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (table: DiningTable) => tablesApi.remove(table.id),
    // Drop it from the cache at once so the card animates out without waiting for a refetch.
    onSuccess: (_data, table) =>
      queryClient.setQueryData<DiningTable[]>(tableKeys.list(), (tables) => patchTable(tables, table.id, () => null)),
    onSettled: () => queryClient.invalidateQueries({ queryKey: tableKeys.all }),
  })
}
