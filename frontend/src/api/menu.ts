import { apiRequest } from './client'
import type { StationType } from './stations'

/** The 14 EU allergens (Regulation 1169/2011), in the order the API's Allergen enum declares them. */
export const ALLERGENS = [
  'Gluten',
  'Crustaceans',
  'Eggs',
  'Fish',
  'Peanuts',
  'Soybeans',
  'Milk',
  'Nuts',
  'Celery',
  'Mustard',
  'Sesame',
  'Sulphites',
  'Lupin',
  'Molluscs',
] as const
export type Allergen = (typeof ALLERGENS)[number]

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
  stationId: string
  stationName: string
  stationType: StationType
  isAvailable: boolean
  preparationTimeInMinutes: number
  allergens: Allergen[]
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
  stationId: string
  preparationTimeInMinutes: number
  allergens: Allergen[]
}

const CATEGORIES = '/api/menu/categories'

/** Responses from before allergen support carry no list; treat that as "none declared". */
function normaliseItem(item: MenuItem): MenuItem {
  return { ...item, allergens: item.allergens ?? [] }
}
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
    list: async (categoryId?: string, signal?: AbortSignal) =>
      (
        await apiRequest<MenuItem[]>(categoryId ? `${ITEMS}?categoryId=${encodeURIComponent(categoryId)}` : ITEMS, { signal })
      ).map(normaliseItem),
    get: async (id: string, signal?: AbortSignal) => normaliseItem(await apiRequest<MenuItem>(`${ITEMS}/${id}`, { signal })),
    create: async (input: MenuItemInput) => normaliseItem(await apiRequest<MenuItem>(ITEMS, { method: 'POST', body: input })),
    update: async (id: string, input: MenuItemInput) =>
      normaliseItem(await apiRequest<MenuItem>(`${ITEMS}/${id}`, { method: 'PUT', body: input })),
    changePrice: async (id: string, newPrice: number) =>
      normaliseItem(await apiRequest<MenuItem>(`${ITEMS}/${id}/price`, { method: 'PATCH', body: { newPrice } })),
    setAvailability: async (id: string, isAvailable: boolean) =>
      normaliseItem(await apiRequest<MenuItem>(`${ITEMS}/${id}/availability`, { method: 'PATCH', body: { isAvailable } })),
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
