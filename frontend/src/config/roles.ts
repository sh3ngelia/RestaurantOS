/** Mirrors RestaurantOS.Domain.Enums.UserRole. */
export const ROLES = ['Host', 'Waiter', 'Kitchen', 'Bar', 'Manager', 'Accountant'] as const

export type Role = (typeof ROLES)[number]

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value)
}

interface RoleMeta {
  /** Where this person works — used in copy ("Front of house"). */
  station: string
  /** One-line dashboard subtitle. */
  tagline: string
}

export const ROLE_META: Record<Role, RoleMeta> = {
  Host: { station: 'Front of house', tagline: 'The door, the book and the floor — all in one place.' },
  Waiter: { station: 'Floor', tagline: 'Your section, your tickets, your guests.' },
  Kitchen: { station: 'Back of house', tagline: 'Tickets in, plates out. Keep the pass clean.' },
  Bar: { station: 'Bar', tagline: 'Every pour accounted for, every ticket on time.' },
  Manager: { station: 'Management', tagline: 'The whole service at a glance.' },
  Accountant: { station: 'Office', tagline: 'Settlements, reports and the numbers behind the night.' },
}
