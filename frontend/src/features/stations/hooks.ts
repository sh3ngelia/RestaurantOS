import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { ApiError, getErrorMessage } from '@/api/errors'
import { menuKeys } from '@/api/menu'
import { stationKeys, stationsApi, type Station, type StationInput } from '@/api/stations'

function byDisplayOrder(a: Station, b: Station) {
  return a.displayOrder - b.displayOrder || a.name.localeCompare(b.name)
}

/** Every station, in display order. Any staff role may read them. */
export function useStations() {
  return useQuery({
    queryKey: stationKeys.list(),
    queryFn: ({ signal }) => stationsApi.list(signal),
    select: (stations) => [...stations].sort(byDisplayOrder),
  })
}

/** Toasts for station actions outside a form: 404 → it's gone, otherwise the server's detail. */
export function notifyStationError(error: unknown, title: string) {
  if (error instanceof ApiError && error.status === 404) {
    toast.error('Station not found', { description: 'It may have been removed. The list has been refreshed.' })
    return
  }
  toast.error(title, { description: getErrorMessage(error) })
}

export function useSaveStation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: StationInput }) =>
      id ? stationsApi.update(id, input) : stationsApi.create(input),
    onSettled: (_data, error) => {
      void queryClient.invalidateQueries({ queryKey: stationKeys.all })
      // Menu items carry the station's name and type, so an edit touches them too.
      if (!error) void queryClient.invalidateQueries({ queryKey: menuKeys.items() })
    },
  })
}

export function useSetStationActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ station, isActive }: { station: Station; isActive: boolean }) =>
      isActive ? stationsApi.activate(station.id) : stationsApi.deactivate(station.id),
    onSettled: () => queryClient.invalidateQueries({ queryKey: stationKeys.all }),
  })
}

export function useDeleteStation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (station: Station) => stationsApi.remove(station.id),
    onSettled: () => queryClient.invalidateQueries({ queryKey: stationKeys.all }),
  })
}
