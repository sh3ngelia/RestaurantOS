import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { ApiError, getErrorMessage } from '@/api/errors'
import {
  menuApi,
  menuKeys,
  type MenuCategory,
  type MenuCategoryInput,
  type MenuItem,
  type MenuItemInput,
} from '@/api/menu'

// ── Queries ──────────────────────────────────────────────────────────────────

function byDisplayOrder(a: MenuCategory, b: MenuCategory) {
  return a.displayOrder - b.displayOrder || a.name.localeCompare(b.name)
}

export function useMenuCategories() {
  return useQuery({
    queryKey: menuKeys.categories(),
    queryFn: ({ signal }) => menuApi.categories.list(signal),
    select: (categories) => [...categories].sort(byDisplayOrder),
  })
}

/** The whole menu in one request; category and search filtering happen client-side. */
export function useMenuItems() {
  return useQuery({
    queryKey: menuKeys.itemList(),
    queryFn: ({ signal }) => menuApi.items.list(undefined, signal),
  })
}

// ── Errors ───────────────────────────────────────────────────────────────────

/** Toasts for mutations outside a form: 404 → it's gone, 409 → the server's detail. */
export function notifyMenuError(error: unknown, title: string) {
  if (error instanceof ApiError && error.status === 404) {
    toast.error('Already gone', { description: 'Someone else removed that. The menu has been refreshed.' })
    return
  }
  toast.error(title, { description: getErrorMessage(error) })
}

function isNotFound(error: unknown) {
  return error instanceof ApiError && error.status === 404
}

// ── Cache helpers ────────────────────────────────────────────────────────────

type ItemsCache = MenuItem[] | MenuItem | undefined

function mapItemsCache(queryClient: QueryClient, id: string, update: (item: MenuItem) => MenuItem | null) {
  queryClient.setQueriesData<ItemsCache>({ queryKey: menuKeys.items() }, (data) => {
    if (!data) return data
    if (Array.isArray(data)) {
      return data.flatMap((item) => {
        if (item.id !== id) return [item]
        const next = update(item)
        return next ? [next] : []
      })
    }
    return data.id === id ? (update(data) ?? undefined) : data
  })
}

// ── Category mutations ───────────────────────────────────────────────────────

export function useSaveCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: MenuCategoryInput }) =>
      id ? menuApi.categories.update(id, input) : menuApi.categories.create(input),
    onSettled: (_data, error) => {
      void queryClient.invalidateQueries({ queryKey: menuKeys.categories() })
      // Items carry the category's name, so a rename touches them too.
      if (!error || isNotFound(error)) void queryClient.invalidateQueries({ queryKey: menuKeys.items() })
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (category: MenuCategory) => menuApi.categories.remove(category.id),
    onSettled: () => queryClient.invalidateQueries({ queryKey: menuKeys.all }),
  })
}

// ── Item mutations ───────────────────────────────────────────────────────────

export function useSaveItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: MenuItemInput }) =>
      id ? menuApi.items.update(id, input) : menuApi.items.create(input),
    onSuccess: (saved) => queryClient.setQueryData(menuKeys.item(saved.id), saved),
    onSettled: () => queryClient.invalidateQueries({ queryKey: menuKeys.items() }),
  })
}

export function useDeleteItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (item: MenuItem) => menuApi.items.remove(item.id),
    // Remove from the cache straight away so the card animates out without waiting for a refetch.
    onSuccess: (_data, item) => mapItemsCache(queryClient, item.id, () => null),
    onSettled: () => queryClient.invalidateQueries({ queryKey: menuKeys.items() }),
  })
}

const PATCH_ITEM_KEY = ['menu', 'items', 'patch'] as const

/**
 * Shared optimistic flow for the quick edits (availability, price): patch every
 * cached copy of the item immediately, roll back on failure, then reconcile.
 */
function useOptimisticItemPatch<V extends { item: MenuItem }>(
  mutationFn: (vars: V) => Promise<MenuItem>,
  apply: (item: MenuItem, vars: V) => MenuItem,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: PATCH_ITEM_KEY,
    mutationFn,
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: menuKeys.items() })
      const snapshot = queryClient.getQueriesData<ItemsCache>({ queryKey: menuKeys.items() })
      mapItemsCache(queryClient, vars.item.id, (item) => apply(item, vars))
      return { snapshot }
    },
    onError: (_error, _vars, context) => {
      context?.snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data))
    },
    onSuccess: (updated) => mapItemsCache(queryClient, updated.id, () => updated),
    onSettled: () => {
      // With several quick edits in flight, only the last one to settle refetches,
      // so an early refetch can't overwrite a later optimistic value.
      if (queryClient.isMutating({ mutationKey: PATCH_ITEM_KEY }) === 1) {
        void queryClient.invalidateQueries({ queryKey: menuKeys.items() })
      }
    },
  })
}

export function useSetAvailability() {
  return useOptimisticItemPatch(
    ({ item, isAvailable }: { item: MenuItem; isAvailable: boolean }) =>
      menuApi.items.setAvailability(item.id, isAvailable),
    (item, { isAvailable }) => ({ ...item, isAvailable }),
  )
}

export function useChangePrice() {
  return useOptimisticItemPatch(
    ({ item, price }: { item: MenuItem; price: number }) => menuApi.items.changePrice(item.id, price),
    (item, { price }) => ({ ...item, price }),
  )
}
