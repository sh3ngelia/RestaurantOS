import type { MenuItem } from '@/api/menu'
import type { StationType } from '@/api/stations'
import type { Role } from '@/config/roles'
import { useSession } from '@/features/auth/useAuth'

export interface MenuPermissions {
  /** Create, edit, delete and reprice (Manager). */
  canManage: boolean
  /** 86 or un-86 at least some items (Manager, Kitchen, Bar). */
  canToggleAvailability: boolean
  /**
   * Which items' availability the role may change: Kitchen-type for Kitchen, Bar-type for Bar,
   * all for Manager, none otherwise. The API answers 403 for anything else.
   */
  availabilityScope: StationType | 'all' | null
}

const SCOPES: Partial<Record<Role, StationType | 'all'>> = { Manager: 'all', Kitchen: 'Kitchen', Bar: 'Bar' }

/** Mirrors the API's [Authorize(Roles = …)] attributes and ownership rules; the server still enforces them. */
export function getMenuPermissions(role: Role): MenuPermissions {
  const availabilityScope = SCOPES[role] ?? null
  return {
    canManage: role === 'Manager',
    canToggleAvailability: availabilityScope !== null,
    availabilityScope,
  }
}

/** True when this role may 86 or un-86 this particular item. */
export function canToggleItem(permissions: MenuPermissions, item: Pick<MenuItem, 'stationType'>) {
  return permissions.availabilityScope === 'all' || permissions.availabilityScope === item.stationType
}

export function useMenuPermissions() {
  return getMenuPermissions(useSession().role)
}
