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
    description: 'The floor at a glance: seat, reserve and clear tables in a tap.',
    highlights: [
      'Drag-and-drop floor plan per section',
      'Status at a glance: free, seated, mains, check',
      'Turn-time alerts before a table runs long',
    ],
    icon: Armchair,
    group: 'Service',
    roles: ['Host', 'Manager'],
    status: 'available',
  },
  {
    id: 'reservations',
    title: 'Reservations',
    description: 'The book for tonight and beyond — seat, confirm and track guests.',
    highlights: [
      "Tonight's book with covers per slot",
      'Walk-ins, waitlist and no-show tracking',
      'Guest notes and allergies carried to the table',
    ],
    icon: CalendarClock,
    group: 'Service',
    roles: ['Host', 'Manager'],
    status: 'coming-soon',
  },
  {
    id: 'orders',
    title: 'Orders',
    description: 'Take orders at the table and fire courses to the right station.',
    highlights: [
      'Course-by-course ordering at the table',
      'Fire and hold per course',
      'Modifiers and allergens sent straight to the pass',
    ],
    icon: ClipboardList,
    group: 'Service',
    roles: ['Waiter', 'Manager'],
    status: 'coming-soon',
  },
  {
    id: 'menu',
    title: 'Menu',
    description: 'Dishes, categories, pricing and availability, 86 in one tap.',
    highlights: [
      'Categories, dishes and pricing in one place',
      '86 an item and every station knows instantly',
      'Preparation station per dish: kitchen or bar',
    ],
    icon: BookOpen,
    group: 'Production',
    roles: ['Kitchen', 'Bar', 'Waiter', 'Manager'],
    status: 'available',
  },
  {
    id: 'kitchen',
    title: 'Kitchen Display',
    description: 'Tickets by station with timers, bumps and recall.',
    highlights: [
      'Tickets grouped by station and course',
      'Live timers with late-ticket highlighting',
      'Bump, recall and all-day counts',
    ],
    icon: Flame,
    group: 'Production',
    roles: ['Kitchen', 'Manager'],
    status: 'coming-soon',
  },
  {
    id: 'bar',
    title: 'Bar',
    description: 'Drink tickets, pours and stock levels behind the bar.',
    highlights: [
      'Drink tickets separate from the kitchen',
      'Pour tracking against inventory',
      'Tab management for bar seating',
    ],
    icon: Wine,
    group: 'Production',
    roles: ['Bar', 'Manager'],
    status: 'coming-soon',
  },
  {
    id: 'payments',
    title: 'Payments',
    description: 'Split bills, settle checks and reconcile the drawer.',
    highlights: [
      'Split by seat, item or amount',
      'Cash, card and mixed settlements',
      'End-of-shift drawer reconciliation',
    ],
    icon: CreditCard,
    group: 'Business',
    roles: ['Waiter', 'Accountant', 'Manager'],
    status: 'coming-soon',
  },
  {
    id: 'reports',
    title: 'Reports',
    description: 'Sales, covers and product mix across any service window.',
    highlights: [
      'Sales and covers by service period',
      'Product mix and 86 history',
      'Export for the accountant, no spreadsheets',
    ],
    icon: ChartColumn,
    group: 'Business',
    roles: ['Accountant', 'Manager'],
    status: 'coming-soon',
  },
  {
    id: 'staff',
    title: 'Staff',
    description: 'Team accounts, roles and shift schedules.',
    highlights: [
      'Invite team members with a role',
      'Shift schedules and clock-in history',
      'Deactivate access in one step',
    ],
    icon: Users,
    group: 'Business',
    roles: ['Manager'],
    status: 'coming-soon',
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
