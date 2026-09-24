import type { MenuCategory, MenuCategoryInput, MenuItem, MenuItemInput, PreparationStation } from '@/api/menu'
import { parsePrice, priceInputValue } from '@/lib/format'

/*
 * Client-side rules mirroring the API's FluentValidation validators and EF
 * column limits. They exist for fast feedback; the server remains authoritative
 * and its errors are always shown too.
 */

export const ITEM_LIMITS = { name: 150, description: 1000, prepMin: 1, prepMax: 240 } as const
export const CATEGORY_LIMITS = { name: 100, description: 500 } as const
// Price is stored as decimal(10,2).
const PRICE_MAX = 99_999_999.99

type Errors<F extends string> = Partial<Record<F, string>>

// ── Items ────────────────────────────────────────────────────────────────────

export const ITEM_FIELDS = [
  'name',
  'description',
  'price',
  'categoryId',
  'preparationStation',
  'preparationTimeInMinutes',
] as const
export type ItemField = (typeof ITEM_FIELDS)[number]

export interface ItemFormValues {
  name: string
  description: string
  price: string
  categoryId: string
  preparationStation: PreparationStation
  preparationTimeInMinutes: string
}

export function itemFormValues(item: MenuItem | null, defaults: { categoryId?: string } = {}): ItemFormValues {
  return {
    name: item?.name ?? '',
    description: item?.description ?? '',
    price: item ? priceInputValue(item.price) : '',
    categoryId: item?.categoryId ?? defaults.categoryId ?? '',
    preparationStation: item?.preparationStation ?? 'Kitchen',
    preparationTimeInMinutes: item ? String(item.preparationTimeInMinutes) : '',
  }
}

export function validatePrice(input: string): string | undefined {
  if (!input.trim()) return 'Enter a price.'
  const value = parsePrice(input)
  if (value === null) return 'Enter a price like 12.50.'
  if (value <= 0) return 'Price must be greater than zero.'
  if (value > PRICE_MAX) return 'That price is too high.'
  const decimals = input.replace(',', '.').split('.')[1]?.replace(/\s/g, '') ?? ''
  if (decimals.length > 2) return 'Use at most two decimal places.'
  return undefined
}

export function validateItem(values: ItemFormValues): Errors<ItemField> {
  const errors: Errors<ItemField> = {}
  const name = values.name.trim()
  if (!name) errors.name = 'Item name is required.'
  else if (name.length > ITEM_LIMITS.name) errors.name = `Keep the name under ${ITEM_LIMITS.name} characters.`

  if (values.description.trim().length > ITEM_LIMITS.description) {
    errors.description = `Keep the description under ${ITEM_LIMITS.description} characters.`
  }

  const priceError = validatePrice(values.price)
  if (priceError) errors.price = priceError

  if (!values.categoryId) errors.categoryId = 'Choose a category.'

  const prep = values.preparationTimeInMinutes.trim()
  const minutes = Number(prep)
  if (!prep) errors.preparationTimeInMinutes = 'Enter a preparation time.'
  else if (!Number.isInteger(minutes) || minutes < ITEM_LIMITS.prepMin || minutes > ITEM_LIMITS.prepMax) {
    errors.preparationTimeInMinutes = `Preparation time must be between ${ITEM_LIMITS.prepMin} and ${ITEM_LIMITS.prepMax} minutes.`
  }
  return errors
}

/** Call only after validateItem() passes. */
export function toItemInput(values: ItemFormValues): MenuItemInput {
  return {
    name: values.name.trim(),
    description: values.description.trim() || null,
    price: parsePrice(values.price) ?? 0,
    categoryId: values.categoryId,
    preparationStation: values.preparationStation,
    preparationTimeInMinutes: Number(values.preparationTimeInMinutes.trim()),
  }
}

// ── Categories ───────────────────────────────────────────────────────────────

export const CATEGORY_FIELDS = ['name', 'description', 'displayOrder'] as const
export type CategoryField = (typeof CATEGORY_FIELDS)[number]

export interface CategoryFormValues {
  name: string
  description: string
  displayOrder: string
}

export function categoryFormValues(category: MenuCategory | null, nextDisplayOrder: number): CategoryFormValues {
  return {
    name: category?.name ?? '',
    description: category?.description ?? '',
    displayOrder: String(category?.displayOrder ?? nextDisplayOrder),
  }
}

export function validateCategory(values: CategoryFormValues): Errors<CategoryField> {
  const errors: Errors<CategoryField> = {}
  const name = values.name.trim()
  if (!name) errors.name = 'Category name is required.'
  else if (name.length > CATEGORY_LIMITS.name) errors.name = `Keep the name under ${CATEGORY_LIMITS.name} characters.`

  if (values.description.trim().length > CATEGORY_LIMITS.description) {
    errors.description = `Keep the description under ${CATEGORY_LIMITS.description} characters.`
  }

  const order = Number(values.displayOrder.trim())
  if (!values.displayOrder.trim() || !Number.isInteger(order) || order < 0) {
    errors.displayOrder = 'Use a whole number, 0 or higher.'
  }
  return errors
}

export function toCategoryInput(values: CategoryFormValues): MenuCategoryInput {
  return {
    name: values.name.trim(),
    description: values.description.trim() || null,
    displayOrder: Number(values.displayOrder.trim()),
  }
}
