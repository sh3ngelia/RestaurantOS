import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { ApiError, getErrorMessage } from '@/api/errors'
import {
  reservationKeys,
  reservationsApi,
  type CreateReservationInput,
  type Reservation,
  type ReservationAction,
  type UpdateGuestInfoInput,
} from '@/api/reservations'
import { tableKeys } from '@/api/tables'
import { RESERVATION_ACTIONS } from './status'

// ── Queries ──────────────────────────────────────────────────────────────────

export function useDayReservations(dayKey: string, { enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: reservationKeys.day(dayKey),
    queryFn: ({ signal }) => reservationsApi.listDay(dayKey, signal),
    select: (list) => [...list].sort((a, b) => a.reservationTime.localeCompare(b.reservationTime)),
    enabled,
    // Other hosts take bookings too; keep the book roughly current.
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  })
}

// ── Errors ───────────────────────────────────────────────────────────────────

/** Toasts for actions outside a form; 400/409 carry the domain message in `detail`. */
export function notifyReservationError(error: unknown, title: string) {
  if (error instanceof ApiError && error.status === 404) {
    toast.error('Booking not found', { description: 'It may have been removed. The book has been refreshed.' })
    return
  }
  toast.error(title, { description: getErrorMessage(error) })
}

// ── Cache helpers ────────────────────────────────────────────────────────────

type DayCache = Reservation[] | undefined

function patchEverywhere(
  queryClient: ReturnType<typeof useQueryClient>,
  id: string,
  update: (reservation: Reservation) => Reservation,
) {
  queryClient.setQueriesData<DayCache>({ queryKey: reservationKeys.all }, (list) =>
    list?.map((r) => (r.id === id ? update(r) : r)),
  )
}

// ── Mutations ────────────────────────────────────────────────────────────────

/**
 * Table status and each table's next booking are computed from reservations on the
 * server, so any change to the book can change the floor as well.
 */
function refreshTables(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: tableKeys.all })
}

const STATUS_MUTATION_KEY = ['reservations', 'status'] as const

/** Confirm, seat, no-show or cancel: optimistic, rolled back if the API refuses. */
export function useReservationAction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: STATUS_MUTATION_KEY,
    mutationFn: ({ reservation, action }: { reservation: Reservation; action: ReservationAction }) =>
      reservationsApi.changeStatus(reservation.id, action),
    onMutate: async ({ reservation, action }) => {
      await queryClient.cancelQueries({ queryKey: reservationKeys.all })
      const snapshot = queryClient.getQueriesData<DayCache>({ queryKey: reservationKeys.all })
      patchEverywhere(queryClient, reservation.id, (r) => ({ ...r, status: RESERVATION_ACTIONS[action].to }))
      return { snapshot }
    },
    onError: (_error, _vars, context) => {
      context?.snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data))
    },
    onSuccess: (updated) => {
      patchEverywhere(queryClient, updated.id, () => updated)
      // Arriving occupies the table; cancelling, confirming or a no-show changes its next booking.
      refreshTables(queryClient)
    },
    onSettled: () => {
      // Only the last of several quick taps refetches, so an early response can't undo a later one.
      if (queryClient.isMutating({ mutationKey: STATUS_MUTATION_KEY }) === 1) {
        void queryClient.invalidateQueries({ queryKey: reservationKeys.all })
      }
    },
  })
}

export function useCreateReservation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateReservationInput) => reservationsApi.create(input),
    onSuccess: () => refreshTables(queryClient),
    onSettled: () => queryClient.invalidateQueries({ queryKey: reservationKeys.all }),
  })
}

export function useUpdateGuestInfo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateGuestInfoInput }) => reservationsApi.updateGuestInfo(id, input),
    onSuccess: (updated) => {
      patchEverywhere(queryClient, updated.id, () => updated)
      // Table cards show the booked guest's name and party size.
      refreshTables(queryClient)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: reservationKeys.all }),
  })
}

/** Rescheduling can move a booking to another day, so every cached day is refreshed. */
export function useReschedule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reservationTime }: { id: string; reservationTime: string }) =>
      reservationsApi.reschedule(id, reservationTime),
    onSuccess: () => refreshTables(queryClient),
    onSettled: () => queryClient.invalidateQueries({ queryKey: reservationKeys.all }),
  })
}
