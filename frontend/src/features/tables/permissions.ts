import { getModule } from '@/config/modules'
import type { Role } from '@/config/roles'
import { useSession } from '@/features/auth/useAuth'
import type { QuickAction } from './status'

export interface TablePermissions {
  /** Open the Tables floor view (Host, Manager). */
  canUseFloor: boolean
  /** Seat guests, hold / release, seat a booking (Host, Manager): POST occupy / reserve. */
  canSeat: boolean
  /** Clear a table (Host, Waiter, Manager): POST free. */
  canClear: boolean
  /** Add, edit and delete tables (Manager). */
  canManage: boolean
}

/** Mirrors the API's [Authorize(Roles = …)] attributes; the server still enforces them. */
export function getTablePermissions(role: Role): TablePermissions {
  return {
    canUseFloor: getModule('tables')?.roles.includes(role) ?? false,
    canSeat: role === 'Host' || role === 'Manager',
    canClear: role === 'Host' || role === 'Waiter' || role === 'Manager',
    canManage: role === 'Manager',
  }
}

export function useTablePermissions() {
  return getTablePermissions(useSession().role)
}

/** Whether a quick action's endpoint is open to the role behind these permissions. */
export function canRunQuickAction(action: QuickAction, permissions: TablePermissions) {
  return action === 'clear' ? permissions.canClear : permissions.canSeat
}
