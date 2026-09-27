import { getModule } from '@/config/modules'
import type { Role } from '@/config/roles'

/** Mirrors the API's [Authorize(Roles = "Host,Manager")]; the server still enforces it. */
export function canUseReservations(role: Role) {
  return getModule('reservations')?.roles.includes(role) ?? false
}
