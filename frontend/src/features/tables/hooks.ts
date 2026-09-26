import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { ApiError, getErrorMessage } from '@/api/errors'
import { tableKeys, tablesApi, type DiningTable, type TableAction, type TableInput } from '@/api/tables'
import { TABLE_ACTIONS } from './status'

// ── Queries ──────────────────────────────────────────────────────────────────

export function useTables({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: tableKeys.list(),
    queryFn: ({ signal }) => tablesApi.list(signal),
    select: (tables) => [...tables].sort((a, b) => a.tableNumber - b.tableNumber),
    enabled,
    // The floor changes as other hosts seat guests; keep every open screen roughly current.
    refetchInterval: 30_000,
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

/** Seat, reserve or clear: optimistic, rolled back if the API refuses the transition. */
export function useChangeTableStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: STATUS_MUTATION_KEY,
    mutationFn: ({ table, action }: { table: DiningTable; action: TableAction }) =>
      tablesApi.changeStatus(table.id, action),
    onMutate: async ({ table, action }) => {
      await queryClient.cancelQueries({ queryKey: tableKeys.list() })
      const previous = queryClient.getQueryData<DiningTable[]>(tableKeys.list())
      queryClient.setQueryData<DiningTable[]>(tableKeys.list(), (tables) =>
        patchTable(tables, table.id, (t) => ({ ...t, status: TABLE_ACTIONS[action].to })),
      )
      return { previous }
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(tableKeys.list(), context.previous)
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<DiningTable[]>(tableKeys.list(), (tables) => patchTable(tables, updated.id, () => updated))
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
