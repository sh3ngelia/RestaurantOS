import type { DiningTable, TableInput } from '@/api/tables'

/** Mirrors CreateTableRequestValidator / UpdateTableRequestValidator in the API. */
export const TABLE_LIMITS = { numberMin: 1, numberMax: 999, capacityMin: 1, capacityMax: 30 } as const

export const TABLE_FIELDS = ['tableNumber', 'capacity'] as const
export type TableField = (typeof TABLE_FIELDS)[number]

export interface TableFormValues {
  tableNumber: string
  capacity: string
}

export function tableFormValues(table: DiningTable | null, nextTableNumber: number): TableFormValues {
  return {
    tableNumber: String(table?.tableNumber ?? nextTableNumber),
    capacity: String(table?.capacity ?? 4),
  }
}

function wholeNumberBetween(value: string, min: number, max: number) {
  const trimmed = value.trim()
  const n = Number(trimmed)
  return trimmed !== '' && Number.isInteger(n) && n >= min && n <= max
}

export function validateTable(values: TableFormValues): Partial<Record<TableField, string>> {
  const errors: Partial<Record<TableField, string>> = {}
  const { numberMin, numberMax, capacityMin, capacityMax } = TABLE_LIMITS
  if (!values.tableNumber.trim()) errors.tableNumber = 'Enter a table number.'
  else if (!wholeNumberBetween(values.tableNumber, numberMin, numberMax)) {
    errors.tableNumber = `Table number must be between ${numberMin} and ${numberMax}.`
  }
  if (!values.capacity.trim()) errors.capacity = 'Enter how many guests it seats.'
  else if (!wholeNumberBetween(values.capacity, capacityMin, capacityMax)) {
    errors.capacity = `Capacity must be between ${capacityMin} and ${capacityMax} guests.`
  }
  return errors
}

export function toTableInput(values: TableFormValues): TableInput {
  return { tableNumber: Number(values.tableNumber.trim()), capacity: Number(values.capacity.trim()) }
}
