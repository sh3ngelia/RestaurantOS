import { apiRequest } from './client'
import type { Role } from '@/config/roles'
import { parseUtc } from '@/lib/dates'

export interface StaffMember {
  id: string
  firstName: string
  lastName: string
  fullName: string
  email: string
  role: Role
  isActive: boolean
  /** UTC ISO, normalised with "Z". */
  createdAt: string
}

export interface CreateStaffInput {
  firstName: string
  lastName: string
  email: string
  password: string
  role: Role
}

export interface UpdateStaffProfileInput {
  firstName: string
  lastName: string
  email: string
}

const BASE = '/api/staff'

function normalise(member: StaffMember): StaffMember {
  return {
    ...member,
    fullName: member.fullName || `${member.firstName} ${member.lastName}`.trim(),
    createdAt: member.createdAt ? parseUtc(member.createdAt).toISOString() : member.createdAt,
  }
}

const send = async (path: string, method: 'POST' | 'PUT' | 'PATCH', body?: unknown) =>
  normalise(await apiRequest<StaffMember>(path, { method, body }))

export const staffApi = {
  list: async (signal?: AbortSignal) => (await apiRequest<StaffMember[]>(BASE, { signal })).map(normalise),
  get: async (id: string, signal?: AbortSignal) => normalise(await apiRequest<StaffMember>(`${BASE}/${id}`, { signal })),
  create: (input: CreateStaffInput) => send(BASE, 'POST', input),
  updateProfile: (id: string, input: UpdateStaffProfileInput) => send(`${BASE}/${id}`, 'PUT', input),
  changeRole: (id: string, role: Role) => send(`${BASE}/${id}/role`, 'PATCH', { role }),
  deactivate: (id: string) => send(`${BASE}/${id}/deactivate`, 'POST'),
  activate: (id: string) => send(`${BASE}/${id}/activate`, 'POST'),
  resetPassword: (id: string, newPassword: string) =>
    apiRequest<void>(`${BASE}/${id}/reset-password`, { method: 'POST', body: { newPassword } }),
}

export const staffKeys = {
  all: ['staff'] as const,
  list: () => [...staffKeys.all, 'list'] as const,
}
