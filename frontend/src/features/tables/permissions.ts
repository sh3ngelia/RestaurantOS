import { getModule } from '@/config/modules'
import type { Role } from '@/config/roles'
import { useSession } from '@/features/auth/useAuth'

export interface TablePermissions {
  /** Open the floor view and seat, reserve or clear tables (Host, Manager). */
  canUseFloor: boolean
  /** Add, edit and delete tables (Manager). */
  canManage: boolean
}

/** Mirrors the API's [Authorize(Roles = …)] attributes; the server still enforces them. */
export function getTablePermissions(role: Role): TablePermissions {
  return {
    canUseFloor: getModule('tables')?.roles.includes(role) ?? false,
    canManage: role === 'Manager',
  }
}

export function useTablePermissions() {
  return getTablePermissions(useSession().role)
}
