import { getModule } from '@/config/modules'
import type { Role } from '@/config/roles'
import { useSession } from '@/features/auth/useAuth'

export interface OrderPermissions {
  /** Take, send, fire, serve and close orders (Waiter, Manager). */
  canTakeOrders: boolean
  /**
   * Start / mark ready (Kitchen, Bar, Manager on the API). Kitchen and Bar do this on the
   * Kitchen Display; the order screen offers it to the Manager too, for covering the pass.
   */
  canProduce: boolean
}

/** Mirrors the API's [Authorize(Roles = …)] attributes; the server still enforces them. */
export function getOrderPermissions(role: Role): OrderPermissions {
  return {
    canTakeOrders: getModule('orders')?.roles.includes(role) ?? false,
    canProduce: role === 'Manager',
  }
}

export function useOrderPermissions() {
  return getOrderPermissions(useSession().role)
}
