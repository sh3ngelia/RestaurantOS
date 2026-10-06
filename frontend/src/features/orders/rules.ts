import { COURSES, type Course, type Order, type OrderItem, type OrderItemStatus } from '@/api/orders'
import type { StatusTone } from '@/lib/status-tones'

/*
 * Order rules mirrored from the Order / OrderItem entities, so the UI only offers
 * what the API will accept. The server stays authoritative; its 400s become toasts.
 */

export const ITEM_STATUS_LABELS: Record<OrderItemStatus, string> = {
  Draft: 'New',
  Held: 'Held',
  Pending: 'Sent',
  InProgress: 'Preparing',
  Ready: 'Ready',
  Served: 'Served',
  Cancelled: 'Cancelled',
}

/**
 * Each item status's tone in the app-wide palette. Ready is the loudest thing on the
 * screen (food is waiting at the pass); held is "waiting" its turn; preparing is "active".
 */
export const ITEM_STATUS_TONES: Record<OrderItemStatus, StatusTone> = {
  Draft: 'neutral',
  Held: 'waiting',
  Pending: 'neutral',
  InProgress: 'active',
  Ready: 'attention',
  Served: 'muted',
  Cancelled: 'muted',
}

/** Tones for the per-order status counts, matching the item chips. Unsent items are a warning: easy to forget. */
export const SUMMARY_TONES: Record<keyof OrderSummary, StatusTone> = {
  ready: 'attention',
  preparing: 'active',
  sent: 'neutral',
  held: 'waiting',
  drafts: 'warning',
  items: 'neutral',
  served: 'muted',
}

export const COURSE_LABELS: Record<Course, { one: string; many: string }> = {
  Starter: { one: 'Starter', many: 'Starters' },
  Main: { one: 'Main', many: 'Mains' },
  Dessert: { one: 'Dessert', many: 'Desserts' },
}

const SENT: readonly OrderItemStatus[] = ['Held', 'Pending', 'InProgress', 'Ready', 'Served']

// ── Line rules ───────────────────────────────────────────────────────────────

/** Quantity and removal are only possible before the item is sent. */
export const isEditable = (item: OrderItem) => item.status === 'Draft'
export const canServe = (item: OrderItem) => item.status === 'Ready'
/** Sent but not yet ready (Draft lines are removed instead of cancelled). */
export const canCancelItem = (item: OrderItem) => ['Held', 'Pending', 'InProgress'].includes(item.status)
export const canStart = (item: OrderItem) => item.status === 'Pending'
export const canMarkReady = (item: OrderItem) => item.status === 'Pending' || item.status === 'InProgress'

// ── Order rules ──────────────────────────────────────────────────────────────

export const isOpen = (order: Order) => order.status === 'Opened'
export const draftItems = (order: Order) => order.items.filter((i) => i.status === 'Draft')

/** Fire next takes the lowest held course. */
export function nextHeldCourse(order: Order): Course | null {
  const held = order.items.filter((i) => i.status === 'Held').map((i) => i.course)
  return COURSES.find((course) => held.includes(course)) ?? null
}

const latest = (isoTimes: (string | null)[]) => {
  const times = isoTimes.filter((t): t is string => t !== null).map((t) => Date.parse(t))
  return times.length > 0 ? new Date(Math.max(...times)).toISOString() : null
}

/** Sent to a station: not still on the ticket, not waiting for its course, not cancelled. */
const isFired = (item: OrderItem) => item.status !== 'Cancelled' && item.status !== 'Draft' && item.status !== 'Held'

/** The fired course just before `course` that has items, if any. */
function previousCourse(items: readonly OrderItem[], course: Course): Course | null {
  const earlier = COURSES.slice(0, COURSES.indexOf(course))
  return [...earlier].reverse().find((c) => items.some((i) => i.course === c && isFired(i))) ?? null
}

/**
 * The next held course and when the course before it was fired: the waiter's "Mains held · 18 min".
 * `previousFiredAt` is null when nothing earlier has been fired.
 */
export function heldCourseInfo(order: Order): { course: Course; previousFiredAt: string | null } | null {
  const course = nextHeldCourse(order)
  if (!course) return null
  const previous = previousCourse(order.items, course)
  const firedAt = previous
    ? latest(order.items.filter((i) => i.course === previous && isFired(i)).map((i) => i.firedAt))
    : null
  return { course, previousFiredAt: firedAt }
}

/**
 * The course before the next held one, and when its last item was marked ready: the chef's
 * cue for firing. `readyAt` is null while that course is still being cooked.
 */
export function lastCourseReady(order: Order): { course: Course; readyAt: string | null } | null {
  const held = nextHeldCourse(order)
  if (!held) return null
  const course = previousCourse(order.items, held)
  if (!course) return null
  // A late addition still on the ticket (Draft) isn't part of the course that went out.
  const items = order.items.filter((i) => i.course === course && isFired(i))
  const done = items.every((i) => i.status === 'Ready' || i.status === 'Served')
  return { course, readyAt: done ? latest(items.map((i) => i.readyAt)) : null }
}

/** Cancelling the whole order is allowed only while nothing has been sent. */
export const canCancelOrder = (order: Order) =>
  isOpen(order) && order.items.every((i) => i.status === 'Draft' || i.status === 'Cancelled')

/** Null when the order can be closed, otherwise the reason it can't (for the tooltip). */
export function closeBlocker(order: Order): string | null {
  if (!isOpen(order)) return 'This order is no longer open.'
  const active = order.items.filter((i) => i.status !== 'Served' && i.status !== 'Cancelled').length
  if (active > 0) return `${active} ${active === 1 ? 'item is' : 'items are'} still to be served or cancelled.`
  if (!order.items.some((i) => i.status === 'Served')) return 'Nothing has been served yet. Cancel the order instead.'
  return null
}

/** Total of everything not cancelled, as the server computes TotalAmount. */
export function orderTotal(items: OrderItem[]) {
  return items.filter((i) => i.status !== 'Cancelled').reduce((sum, i) => sum + i.totalPrice, 0)
}

// ── Summaries ────────────────────────────────────────────────────────────────

export interface OrderSummary {
  /** Lines that aren't cancelled. */
  items: number
  ready: number
  preparing: number
  sent: number
  held: number
  drafts: number
  served: number
}

export function summarizeOrder(order: Order): OrderSummary {
  const count = (s: OrderItemStatus) => order.items.filter((i) => i.status === s).length
  return {
    items: order.items.filter((i) => i.status !== 'Cancelled').length,
    ready: count('Ready'),
    preparing: count('InProgress'),
    sent: count('Pending'),
    held: count('Held'),
    drafts: count('Draft'),
    served: count('Served'),
  }
}

/**
 * "2 ready · 3 unsent · 1 preparing · Mains held · 18 min": what needs the waiter first, then
 * progress. The held part names the next held course and, given `now`, the minutes since the
 * course before it was fired. Empty parts are skipped.
 */
export function summaryParts(order: Order, now?: Date): { key: keyof OrderSummary; text: string }[] {
  const summary = summarizeOrder(order)
  const parts: { key: keyof OrderSummary; text: string }[] = []
  if (summary.ready) parts.push({ key: 'ready', text: `${summary.ready} ready` })
  if (summary.drafts) parts.push({ key: 'drafts', text: `${summary.drafts} unsent` })
  if (summary.preparing) parts.push({ key: 'preparing', text: `${summary.preparing} preparing` })
  if (summary.sent) parts.push({ key: 'sent', text: `${summary.sent} sent` })
  const held = heldCourseInfo(order)
  if (held) {
    const minutes = now && held.previousFiredAt ? Math.max(0, Math.floor((now.getTime() - Date.parse(held.previousFiredAt)) / 60_000)) : null
    parts.push({ key: 'held', text: `${COURSE_LABELS[held.course].many} held${minutes !== null ? ` · ${minutes} min` : ''}` })
  }
  return parts
}

export function hasSentAnything(order: Order) {
  return order.items.some((i) => SENT.includes(i.status))
}

/** Default course for a menu item from its category name: "Starter(s)", "Dessert(s)", else Main. */
export function defaultCourseFor(categoryName: string): Course {
  if (/starter/i.test(categoryName)) return 'Starter'
  if (/dessert/i.test(categoryName)) return 'Dessert'
  return 'Main'
}
