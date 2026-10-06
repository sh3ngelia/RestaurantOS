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

/** Kitchen wording: Pending means the item is waiting for a cook; Held, for its course to be fired. */
export const KITCHEN_STATUS_LABELS: Partial<Record<KitchenTicketItem['status'], string>> = {
  Held: 'On hold',
  Pending: 'Waiting',
  InProgress: 'Preparing',
  Ready: 'Ready',
}

export const KITCHEN_STATUS_TONES: Partial<Record<KitchenTicketItem['status'], StatusTone>> = {
  Held: 'muted',
  Pending: 'neutral',
  InProgress: 'active',
  Ready: 'attention',
}

/** The status a tap moves an item to on a station screen: Pending → InProgress → Ready. Held items don't move. */
export function nextStatus(item: KitchenTicketItem): 'InProgress' | 'Ready' | null {
  if (item.status === 'Pending') return 'InProgress'
  if (item.status === 'InProgress') return 'Ready'
  return null
}

export function groupByCourse(items: KitchenTicketItem[]): { course: Course; items: KitchenTicketItem[] }[] {
  return COURSES.map((course) => ({ course, items: items.filter((i) => i.course === course) })).filter((g) => g.items.length > 0)
}

// ── Held items ───────────────────────────────────────────────────────────────

export const isHeld = (item: KitchenTicketItem) => item.status === 'Held'

/** Fired items (to cook or ready) and held ones (waiting for their course), kept apart on the ticket. */
export function splitHeld(ticket: KitchenTicket) {
  return { active: ticket.items.filter((i) => !isHeld(i)), held: ticket.items.filter(isHeld) }
}

/** Nothing on the ticket has been fired yet: shown muted, after the tickets being cooked. */
export const isHeldOnly = (ticket: KitchenTicket) => ticket.items.length > 0 && ticket.items.every(isHeld)

/** Tickets being cooked first (oldest first, as the API sends them), then tickets only on hold. */
export function orderForDisplay(tickets: readonly KitchenTicket[]) {
  return [...tickets.filter((t) => !isHeldOnly(t)), ...tickets.filter(isHeldOnly)]
}

/** The course fire-next would send: the lowest one with held items. Mirrors the API. */
export function nextHeldCourse(ticket: KitchenTicket): Course | null {
  const held = ticket.items.filter(isHeld).map((i) => i.course)
  return COURSES.find((course) => held.includes(course)) ?? null
}

/** Courses where everything fired so far is Ready: the pass can send them out. Held items don't count. */
export function readyCourses(ticket: KitchenTicket): Course[] {
  return groupByCourse(splitHeld(ticket).active)
    .filter((group) => group.items.every((i) => i.status === 'Ready'))
    .map((group) => group.course)
}

// ── Permissions ──────────────────────────────────────────────────────────────

/**
 * Kitchen, Bar and Manager use the Kitchen Display (see config/modules.ts) and may start and
 * ready items at a station. On the pass, only Kitchen and Manager mark items ready, and only
 * they fire the next course (the API allows fire-next for Kitchen, Waiter and Manager).
 */
export function canMarkReadyOnPass(role: Role) {
  return role === 'Kitchen' || role === 'Manager'
}

export function canFireFromPass(role: Role) {
  return role === 'Kitchen' || role === 'Manager'
}
