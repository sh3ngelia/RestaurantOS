/** Mirrors RestaurantOS.Domain.Enums.UserRole. */
export const ROLES = ['Host', 'Waiter', 'Kitchen', 'Bar', 'Manager', 'Accountant'] as const

export type Role = (typeof ROLES)[number]

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value)
}

interface RoleMeta {
  /** Where this person works — used in copy ("Front of house"). */
  station: string
}

export const ROLE_META: Record<Role, RoleMeta> = {
  Host: { station: 'Front of house' },
  Waiter: { station: 'Floor' },
  Kitchen: { station: 'Back of house' },
  Bar: { station: 'Bar' },
  Manager: { station: 'Management' },
  Accountant: { station: 'Office' },
}
