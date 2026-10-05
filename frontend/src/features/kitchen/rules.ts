import type { KitchenTicket, KitchenTicketItem } from '@/api/kitchen'
import { COURSES, type Course } from '@/api/orders'
import type { Role } from '@/config/roles'
import type { StatusTone } from '@/lib/status-tones'

// ── Ticket timing ────────────────────────────────────────────────────────────

/** A ticket open this long (since it was fired) turns to the warning state. */
export const TICKET_WARNING_MINUTES = 10
/** A ticket open this long is late. */
export const TICKET_LATE_MINUTES = 15

export type TicketTimeState = 'normal' | 'warning' | 'late'

export function ticketTimeState(elapsedMs: number): TicketTimeState {
  const minutes = elapsedMs / 60_000
  if (minutes >= TICKET_LATE_MINUTES) return 'late'
  if (minutes >= TICKET_WARNING_MINUTES) return 'warning'
  return 'normal'
}

/** Warning uses the accent (needs attention); late uses the danger colour. */
export const TIME_STATE_TONES: Record<TicketTimeState, StatusTone> = {
  normal: 'neutral',
  warning: 'attention',
  late: 'danger',
}

/** Elapsed time as mm:ss; minutes keep counting past 59 ("72:05"). */
export function formatTimer(elapsedMs: number) {
  const total = Math.max(0, Math.floor(elapsedMs / 1000))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

// ── Items ────────────────────────────────────────────────────────────────────

/** Kitchen wording: Pending means the item is waiting for a cook. */
export const KITCHEN_STATUS_LABELS: Partial<Record<KitchenTicketItem['status'], string>> = {
  Pending: 'Waiting',
  InProgress: 'Preparing',
  Ready: 'Ready',
}

export const KITCHEN_STATUS_TONES: Partial<Record<KitchenTicketItem['status'], StatusTone>> = {
  Pending: 'neutral',
  InProgress: 'active',
  Ready: 'attention',
}

/** The status a tap moves an item to on a station screen: Pending → InProgress → Ready. */
export function nextStatus(item: KitchenTicketItem): 'InProgress' | 'Ready' | null {
  if (item.status === 'Pending') return 'InProgress'
  if (item.status === 'InProgress') return 'Ready'
  return null
}

export function groupByCourse(items: KitchenTicketItem[]): { course: Course; items: KitchenTicketItem[] }[] {
  return COURSES.map((course) => ({ course, items: items.filter((i) => i.course === course) })).filter((g) => g.items.length > 0)
}

/** Courses where everything fired so far is Ready: the pass can send them out. */
export function readyCourses(ticket: KitchenTicket): Course[] {
  return groupByCourse(ticket.items)
    .filter((group) => group.items.every((i) => i.status === 'Ready'))
    .map((group) => group.course)
}

// ── Permissions ──────────────────────────────────────────────────────────────

/**
 * Kitchen, Bar and Manager use the Kitchen Display (see config/modules.ts) and may start and
 * ready items at a station. On the pass, only Kitchen and Manager mark items ready.
 */
export function canMarkReadyOnPass(role: Role) {
  return role === 'Kitchen' || role === 'Manager'
}
