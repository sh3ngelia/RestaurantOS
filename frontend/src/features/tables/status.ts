import { Eraser, Lock, LockOpen, UserCheck, UsersRound, type LucideIcon } from 'lucide-react'

import type { DiningTable, TableAction, TableStatus } from '@/api/tables'
import type { StatusTone } from '@/lib/status-tones'

/** Floor language: the API says Available/Occupied, the host says free/seated. */
export const STATUS_LABELS: Record<TableStatus, string> = {
  Available: 'Free',
  Occupied: 'Seated',
  Reserved: 'Reserved',
}

// ── Floor state ──────────────────────────────────────────────────────────────

/**
 * What the host needs to know, derived from the server's computed status:
 * - seated: Occupied
 * - held:   Reserved by a manual hold (or, defensively, Reserved with no booking attached)
 * - booked: Reserved because a confirmed booking is due within 45 minutes or running late
 * - free:   Available (it may still have a booking later, shown as a hint)
 */
export type FloorState = 'free' | 'seated' | 'held' | 'booked'

export function floorStateOf(table: DiningTable): FloorState {
  if (table.status === 'Occupied') return 'seated'
  if (table.status === 'Reserved') return table.isHeld || !table.nextReservation ? 'held' : 'booked'
  return 'free'
}

// ── Quick actions ────────────────────────────────────────────────────────────

export type QuickAction = 'seat' | 'hold' | 'release' | 'clear' | 'seatBooking' | 'seatWalkIn'

interface QuickActionDefinition {
  label: (table: DiningTable) => string
  description: (table: DiningTable) => string
  icon: LucideIcon
  /** The endpoint behind the action: a table status change, or arriving the table's booking. */
  endpoint: { kind: 'table'; action: TableAction } | { kind: 'reservation-arrive' }
  /** Optimistic shape of the table once the action succeeds. */
  apply: (table: DiningTable) => Pick<DiningTable, 'status' | 'isHeld' | 'nextReservation'>
  /** Ask before running (seating a walk-in when a booking is due). */
  needsConfirmation?: boolean
  successTitle: (table: DiningTable) => string
}

const seated = (table: DiningTable) => ({ status: 'Occupied' as const, isHeld: false, nextReservation: table.nextReservation })

export const QUICK_ACTIONS: Record<QuickAction, QuickActionDefinition> = {
  seat: {
    label: () => 'Seat guests',
    description: () => 'Mark the table as seated.',
    icon: UsersRound,
    endpoint: { kind: 'table', action: 'occupy' },
    apply: seated,
    successTitle: (t) => `Guests seated at table ${t.tableNumber}`,
  },
  hold: {
    label: () => 'Hold',
    description: () => 'Keep the table back for someone.',
    icon: Lock,
    endpoint: { kind: 'table', action: 'reserve' },
    apply: (t) => ({ status: 'Reserved', isHeld: true, nextReservation: t.nextReservation }),
    successTitle: (t) => `Table ${t.tableNumber} is on hold`,
  },
  release: {
    label: () => 'Release hold',
    description: () => 'Make the table free again.',
    icon: LockOpen,
    endpoint: { kind: 'table', action: 'free' },
    apply: (t) => ({ status: 'Available', isHeld: false, nextReservation: t.nextReservation }),
    successTitle: (t) => `Hold released on table ${t.tableNumber}`,
  },
  clear: {
    label: () => 'Clear table',
    description: () => 'Guests have left; ready to reset.',
    icon: Eraser,
    endpoint: { kind: 'table', action: 'free' },
    apply: (t) => ({ status: 'Available', isHeld: false, nextReservation: t.nextReservation }),
    successTitle: (t) => `Table ${t.tableNumber} is free again`,
  },
  seatBooking: {
    label: (t) => `Seat ${t.nextReservation?.guestName ?? 'the booking'}`,
    description: () => 'Marks their booking as arrived.',
    icon: UserCheck,
    endpoint: { kind: 'reservation-arrive' },
    // The arrived booking is no longer "next"; the refetch brings the following one.
    apply: () => ({ status: 'Occupied', isHeld: false, nextReservation: null }),
    successTitle: (t) => `${t.nextReservation?.guestName ?? 'Guests'} seated at table ${t.tableNumber}`,
  },
  seatWalkIn: {
    label: () => 'Seat walk-in instead',
    description: () => 'A booking is due; you will be asked to confirm.',
    icon: UsersRound,
    endpoint: { kind: 'table', action: 'occupy' },
    apply: seated,
    needsConfirmation: true,
    successTitle: (t) => `Walk-in seated at table ${t.tableNumber}`,
  },
}

/** Only the actions the API accepts in each state, primary first. */
export const ACTIONS_BY_STATE: Record<FloorState, readonly QuickAction[]> = {
  seated: ['clear'],
  held: ['seat', 'release'],
  booked: ['seatBooking', 'seatWalkIn'],
  free: ['seat', 'hold'],
}

/** Each status's tone in the app-wide palette: free is neutral, seated is active, reserved is waiting. */
export const STATUS_TONES: Record<TableStatus, StatusTone> = {
  Available: 'neutral',
  Occupied: 'active',
  Reserved: 'waiting',
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
