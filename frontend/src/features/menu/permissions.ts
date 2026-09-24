import type { Role } from '@/config/roles'
import { useSession } from '@/features/auth/useAuth'

export interface MenuPermissions {
  /** Create, edit, delete and reprice (Manager). */
  canManage: boolean
  /** 86 or un-86 a dish (Manager, Kitchen, Bar). */
  canToggleAvailability: boolean
}

const AVAILABILITY_ROLES: readonly Role[] = ['Manager', 'Kitchen', 'Bar']

/** Mirrors the API's [Authorize(Roles = …)] attributes; the server still enforces them. */
export function getMenuPermissions(role: Role): MenuPermissions {
  return {
    canManage: role === 'Manager',
    canToggleAvailability: AVAILABILITY_ROLES.includes(role),
  }
}

export function useMenuPermissions() {
  return getMenuPermissions(useSession().role)
}
