import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { ApiError, getErrorMessage } from '@/api/errors'
import { staffApi, staffKeys, type CreateStaffInput, type StaffMember, type UpdateStaffProfileInput } from '@/api/staff'
import type { Role } from '@/config/roles'

// ── Queries ──────────────────────────────────────────────────────────────────

export function useStaff() {
  return useQuery({
    queryKey: staffKeys.list(),
    queryFn: ({ signal }) => staffApi.list(signal),
  })
}

// ── Errors ───────────────────────────────────────────────────────────────────

/**
 * Toasts for actions outside a form. 409s carry a sentence worth reading in full
 * ("The restaurant must always have at least one active manager."), so it's the description.
 */
export function notifyStaffError(error: unknown, title: string) {
  if (error instanceof ApiError && error.status === 404) {
    toast.error('Staff member not found', { description: 'They may have been removed. The list has been refreshed.' })
    return
  }
  toast.error(title, { description: getErrorMessage(error) })
}

// ── Cache ────────────────────────────────────────────────────────────────────

function storeMember(queryClient: QueryClient, member: StaffMember) {
  queryClient.setQueryData<StaffMember[]>(staffKeys.list(), (list) => {
    if (!list) return list
    return list.some((m) => m.id === member.id) ? list.map((m) => (m.id === member.id ? member : m)) : [...list, member]
  })
}

// ── Mutations ────────────────────────────────────────────────────────────────

export function useCreateStaff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateStaffInput) => staffApi.create(input),
    onSuccess: (member) => storeMember(queryClient, member),
    onSettled: () => queryClient.invalidateQueries({ queryKey: staffKeys.all }),
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateStaffProfileInput }) => staffApi.updateProfile(id, input),
    onSuccess: (member) => storeMember(queryClient, member),
    onSettled: () => queryClient.invalidateQueries({ queryKey: staffKeys.all }),
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) => staffApi.resetPassword(id, newPassword),
  })
}

type QuickChange = { kind: 'role'; role: Role } | { kind: 'active'; isActive: boolean }

/** Role change and activate / deactivate: optimistic, rolled back on a 409 or any failure. */
export function useQuickStaffChange() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ member, change }: { member: StaffMember; change: QuickChange }) => {
      if (change.kind === 'role') return staffApi.changeRole(member.id, change.role)
      return change.isActive ? staffApi.activate(member.id) : staffApi.deactivate(member.id)
    },
    onMutate: async ({ member, change }) => {
      await queryClient.cancelQueries({ queryKey: staffKeys.list() })
      const previous = queryClient.getQueryData<StaffMember[]>(staffKeys.list())
      const patched = change.kind === 'role' ? { ...member, role: change.role } : { ...member, isActive: change.isActive }
      storeMember(queryClient, patched)
      return { previous }
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(staffKeys.list(), context.previous)
    },
    onSuccess: (member) => storeMember(queryClient, member),
    onSettled: () => queryClient.invalidateQueries({ queryKey: staffKeys.all }),
  })
}
