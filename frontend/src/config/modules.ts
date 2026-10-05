import {
  Armchair,
  BookOpen,
  CalendarClock,
  ChartColumn,
  ClipboardList,
  CreditCard,
  Flame,
  Users,
  Wine,
  type LucideIcon,
} from 'lucide-react'

import type { Role } from './roles'

export type ModuleStatus = 'available' | 'coming-soon'
export type ModuleGroup = 'Service' | 'Production' | 'Business'

export interface ModuleDefinition {
  id: string
  title: string
  description: string
  /** What the module will do — shown on its "coming soon" page. */
  highlights: readonly string[]
  icon: LucideIcon
  group: ModuleGroup
  /** Roles that can see and open this module. */
  roles: readonly Role[]
  /** Flip to 'available' (and add a route) when a module ships. */
  status: ModuleStatus
}

/**
 * Single source of truth for navigation, dashboard cards and route guards.
 * To add a module: append an entry here. It appears in the sidebar and on the
 * dashboard for the listed roles, and /m/<id> is guarded automatically.
 */
export const MODULES: readonly ModuleDefinition[] = [
  {
    id: 'tables',
    title: 'Tables',
    description: 'Seat, hold and clear tables.',
    highlights: ['Floor plan per section', 'Table status: free, seated, mains, check', 'Turn-time alerts'],
    icon: Armchair,
    group: 'Service',
    roles: ['Host', 'Manager'],
    status: 'available',
  },
  {
    id: 'reservations',
    title: 'Reservations',
    description: 'Take, confirm and seat bookings.',
    highlights: ['Covers per time slot', 'Walk-ins, waitlist and no-shows', 'Guest notes and allergies on the table'],
    icon: CalendarClock,
    group: 'Service',
    roles: ['Host', 'Manager'],
    status: 'available',
  },
  {
    id: 'orders',
    title: 'Orders',
    description: 'Take orders and fire courses to the kitchen and bar.',
    highlights: ['Ordering by course', 'Fire and hold per course', 'Modifiers and allergens on the ticket'],
    icon: ClipboardList,
    group: 'Service',
    roles: ['Waiter', 'Manager'],
    status: 'available',
  },
  {
    id: 'menu',
    title: 'Menu',
    description: 'Dishes, categories, prices and availability.',
    highlights: ['Categories, dishes and prices', "86'd items shown to every station", 'Preparation station per dish'],
    icon: BookOpen,
    group: 'Production',
    roles: ['Kitchen', 'Bar', 'Waiter', 'Manager'],
    status: 'available',
  },
  {
    id: 'kitchen',
    title: 'Kitchen Display',
    description: 'Live tickets by station, and the pass.',
    highlights: ['Tickets by station and course', 'Ticket timers with late highlighting', 'Bump, recall and all-day counts'],
    icon: Flame,
    group: 'Production',
    roles: ['Kitchen', 'Bar', 'Manager'],
    status: 'available',
  },
  {
    id: 'bar',
    title: 'Bar',
    description: 'Live drink tickets for the bar.',
    highlights: ['Drink tickets separate from the kitchen', 'Pour tracking against inventory', 'Tabs for bar seating'],
    icon: Wine,
    group: 'Production',
    roles: ['Bar', 'Manager'],
    // The Kitchen Display, opened on a Bar-type station.
    status: 'available',
  },
  {
    id: 'payments',
    title: 'Payments',
    description: 'Split bills, settle checks and reconcile the drawer.',
    highlights: ['Split by seat, item or amount', 'Cash, card and mixed payments', 'End-of-shift drawer reconciliation'],
    icon: CreditCard,
    group: 'Business',
    roles: ['Waiter', 'Accountant', 'Manager'],
    status: 'coming-soon',
  },
  {
    id: 'reports',
    title: 'Reports',
    description: 'Sales, covers and product mix.',
    highlights: ['Sales and covers by service period', "Product mix and 86'd history", 'Export for accounting'],
    icon: ChartColumn,
    group: 'Business',
    roles: ['Accountant', 'Manager'],
    status: 'coming-soon',
  },
  {
    id: 'staff',
    title: 'Staff',
    description: 'Staff accounts, roles and access.',
    highlights: ['Accounts with a role', 'Shift schedules and clock-in history', 'Deactivate access'],
    icon: Users,
    group: 'Business',
    roles: ['Manager'],
    status: 'available',
  },
]

export const MODULE_GROUPS: readonly ModuleGroup[] = ['Service', 'Production', 'Business']

export function getModulesForRole(role: Role) {
  return MODULES.filter((module) => module.roles.includes(role))
}

export function getModule(id: string | undefined) {
  return MODULES.find((module) => module.id === id)
}

export function modulePath(module: Pick<ModuleDefinition, 'id'>) {
  return `/m/${module.id}`
}
