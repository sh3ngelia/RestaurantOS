import { CalendarClock, Eraser, UsersRound, type LucideIcon } from 'lucide-react'

import type { TableAction, TableStatus } from '@/api/tables'

/** Floor language: the API says Available/Occupied, the host says free/seated. */
export const STATUS_LABELS: Record<TableStatus, string> = {
  Available: 'Free',
  Occupied: 'Seated',
  Reserved: 'Reserved',
}

interface ActionDefinition {
  label: string
  description: string
  icon: LucideIcon
  /** Statuses the API accepts this action from (mirrors the Table entity's rules). */
  from: readonly TableStatus[]
  to: TableStatus
  successTitle: (tableNumber: number) => string
}

export const TABLE_ACTIONS: Record<TableAction, ActionDefinition> = {
  occupy: {
    label: 'Seat guests',
    description: 'Mark the table as seated.',
    icon: UsersRound,
    from: ['Available', 'Reserved'],
    to: 'Occupied',
    successTitle: (n) => `Guests seated at table ${n}`,
  },
  reserve: {
    label: 'Reserve',
    description: 'Hold the table for a booking.',
    icon: CalendarClock,
    from: ['Available'],
    to: 'Reserved',
    successTitle: (n) => `Table ${n} reserved`,
  },
  free: {
    label: 'Clear table',
    description: 'Guests have left; ready to reset.',
    icon: Eraser,
    from: ['Occupied', 'Reserved'],
    to: 'Available',
    successTitle: (n) => `Table ${n} is free again`,
  },
}

const ACTION_ORDER: readonly TableAction[] = ['occupy', 'reserve', 'free']

export function actionsFor(status: TableStatus): TableAction[] {
  return ACTION_ORDER.filter((action) => TABLE_ACTIONS[action].from.includes(status))
}

/** Visual treatment per status: calm neutral, warm copper, and a cool second tone. */
export const STATUS_TONES: Record<TableStatus, { card: string; badge: string; dot: string }> = {
  Available: {
    card: 'border-border bg-card',
    badge: 'border-border-strong text-muted-foreground',
    dot: 'bg-muted-foreground/60',
  },
  Occupied: {
    card: 'border-primary/45 bg-primary-soft shadow-[0_14px_36px_-18px_var(--primary)]',
    badge: 'border-primary/30 bg-primary/15 text-primary',
    dot: 'bg-primary',
  },
  Reserved: {
    card: 'border-dashed border-reserved/50 bg-reserved-soft',
    badge: 'border-reserved/35 bg-reserved/10 text-reserved',
    dot: 'bg-reserved',
  },
}

// ── Filters (kept in ?status=) ───────────────────────────────────────────────

export const STATUS_FILTERS = [
  { id: 'all', label: 'All', status: null },
  { id: 'free', label: 'Free', status: 'Available' },
  { id: 'seated', label: 'Seated', status: 'Occupied' },
  { id: 'reserved', label: 'Reserved', status: 'Reserved' },
] as const satisfies ReadonlyArray<{ id: string; label: string; status: TableStatus | null }>

export type StatusFilterId = (typeof STATUS_FILTERS)[number]['id']

export function parseStatusFilter(value: string | null): StatusFilterId {
  return STATUS_FILTERS.find((f) => f.id === value)?.id ?? 'all'
}
