import { apiRequest } from './client'

/** Mirrors RestaurantOS.Domain.Enums.PreparationStation: the kind of station, which decides kitchen vs. bar. */
export const STATION_TYPES = ['Kitchen', 'Bar'] as const
export type StationType = (typeof STATION_TYPES)[number]

export interface Station {
  id: string
  name: string
  type: StationType
  /** Items for this station are sent as soon as the round is sent, without waiting for their course. */
  firesImmediately: boolean
  displayOrder: number
  isActive: boolean
}

export interface StationInput {
  name: string
  type: StationType
  firesImmediately: boolean
  displayOrder: number
}

const STATIONS = '/api/stations'

export const stationsApi = {
  list: (signal?: AbortSignal) => apiRequest<Station[]>(STATIONS, { signal }),
  create: (input: StationInput) => apiRequest<Station>(STATIONS, { method: 'POST', body: input }),
  update: (id: string, input: StationInput) => apiRequest<Station>(`${STATIONS}/${id}`, { method: 'PUT', body: input }),
  activate: (id: string) => apiRequest<Station>(`${STATIONS}/${id}/activate`, { method: 'POST' }),
  deactivate: (id: string) => apiRequest<Station>(`${STATIONS}/${id}/deactivate`, { method: 'POST' }),
  remove: (id: string) => apiRequest<void>(`${STATIONS}/${id}`, { method: 'DELETE' }),
}

export const stationKeys = {
  all: ['stations'] as const,
  list: () => [...stationKeys.all, 'list'] as const,
}
