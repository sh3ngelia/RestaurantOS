import type { Station, StationInput, StationType } from '@/api/stations'

/*
 * Client-side rules mirroring CreateStationRequestValidator / UpdateStationRequestValidator.
 * They exist for fast feedback; the server remains authoritative.
 */

export const STATION_LIMITS = { name: 100 } as const

/** Field names match the API's validation keys (Name, Type, DisplayOrder), case-insensitively. */
export const STATION_FIELDS = ['name', 'type', 'displayOrder'] as const
export type StationField = (typeof STATION_FIELDS)[number]

export interface StationFormValues {
  name: string
  type: StationType
  displayOrder: string
}

export function stationFormValues(station: Station | null, nextDisplayOrder: number): StationFormValues {
  return {
    name: station?.name ?? '',
    type: station?.type ?? 'Kitchen',
    displayOrder: String(station?.displayOrder ?? nextDisplayOrder),
  }
}

export function validateStation(values: StationFormValues): Partial<Record<StationField, string>> {
  const errors: Partial<Record<StationField, string>> = {}
  const name = values.name.trim()
  if (!name) errors.name = 'Station name is required.'
  else if (name.length > STATION_LIMITS.name) errors.name = `Keep the name under ${STATION_LIMITS.name} characters.`

  const order = Number(values.displayOrder.trim())
  if (!values.displayOrder.trim() || !Number.isInteger(order) || order < 0) {
    errors.displayOrder = 'Use a whole number, 0 or higher.'
  }
  return errors
}

/** Call only after validateStation() passes. firesImmediately lives outside the string-valued form state. */
export function toStationInput(values: StationFormValues, firesImmediately: boolean): StationInput {
  return {
    name: values.name.trim(),
    type: values.type,
    firesImmediately,
    displayOrder: Number(values.displayOrder.trim()),
  }
}
