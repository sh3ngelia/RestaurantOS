import { apiRequest } from './client'

export const PREPARATION_STATIONS = ['Kitchen', 'Bar'] as const
export type PreparationStation = (typeof PREPARATION_STATIONS)[number]

export interface MenuCategory {
  id: string
  name: string
  description: string | null
  displayOrder: number
  isActive: boolean
}

export interface MenuItem {
  id: string
  name: string
  description: string | null
  price: number
  categoryId: string
  categoryName: string
  preparationStation: PreparationStation
  isAvailable: boolean
  preparationTimeInMinutes: number
}

export interface MenuCategoryInput {
  name: string
  description: string | null
  displayOrder: number
}

export interface MenuItemInput {
  name: string
  description: string | null
  price: number
  categoryId: string
  preparationStation: PreparationStation
  preparationTimeInMinutes: number
}

const CATEGORIES = '/api/menu/categories'
const ITEMS = '/api/menu/items'

export const menuApi = {
  categories: {
    list: (signal?: AbortSignal) => apiRequest<MenuCategory[]>(CATEGORIES, { signal }),
    create: (input: MenuCategoryInput) => apiRequest<MenuCategory>(CATEGORIES, { method: 'POST', body: input }),
    update: (id: string, input: MenuCategoryInput) =>
      apiRequest<MenuCategory>(`${CATEGORIES}/${id}`, { method: 'PUT', body: input }),
    remove: (id: string) => apiRequest<void>(`${CATEGORIES}/${id}`, { method: 'DELETE' }),
  },
  items: {
    list: (categoryId?: string, signal?: AbortSignal) =>
      apiRequest<MenuItem[]>(categoryId ? `${ITEMS}?categoryId=${encodeURIComponent(categoryId)}` : ITEMS, { signal }),
    get: (id: string, signal?: AbortSignal) => apiRequest<MenuItem>(`${ITEMS}/${id}`, { signal }),
    create: (input: MenuItemInput) => apiRequest<MenuItem>(ITEMS, { method: 'POST', body: input }),
    update: (id: string, input: MenuItemInput) => apiRequest<MenuItem>(`${ITEMS}/${id}`, { method: 'PUT', body: input }),
    changePrice: (id: string, newPrice: number) =>
      apiRequest<MenuItem>(`${ITEMS}/${id}/price`, { method: 'PATCH', body: { newPrice } }),
    setAvailability: (id: string, isAvailable: boolean) =>
      apiRequest<MenuItem>(`${ITEMS}/${id}/availability`, { method: 'PATCH', body: { isAvailable } }),
    remove: (id: string) => apiRequest<void>(`${ITEMS}/${id}`, { method: 'DELETE' }),
  },
}

/** Hierarchical keys so one invalidation can target a whole resource. */
export const menuKeys = {
  all: ['menu'] as const,
  categories: () => [...menuKeys.all, 'categories'] as const,
  items: () => [...menuKeys.all, 'items'] as const,
  itemList: (categoryId?: string) => [...menuKeys.items(), 'list', categoryId ?? 'all'] as const,
  item: (id: string) => [...menuKeys.items(), 'detail', id] as const,
}
