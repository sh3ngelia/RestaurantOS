import { COURSES, type Course, type Order, type OrderItem, type OrderItemStatus } from '@/api/orders'

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
 * Calm, distinct chips. Ready is the loudest thing on the screen: food is waiting at the pass.
 * Held shares the cool "reserved" tone (waiting its turn); preparing is soft copper.
 */
export const ITEM_STATUS_TONES: Record<OrderItemStatus, string> = {
  Draft: 'border-dashed border-border-strong text-muted-foreground',
  Held: 'border-reserved/35 bg-reserved/10 text-reserved',
  Pending: 'border-border-strong text-foreground/80',
  InProgress: 'border-primary/30 bg-primary/10 text-primary',
  Ready: 'border-primary bg-primary text-primary-foreground',
  Served: 'border-border text-muted-foreground',
  Cancelled: 'border-border text-muted-foreground line-through',
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

/** "2 ready · 1 preparing · 1 held", most urgent first; empty parts are skipped. */
export function summaryParts(summary: OrderSummary): { key: keyof OrderSummary; text: string }[] {
  const parts: { key: keyof OrderSummary; text: string }[] = []
  if (summary.ready) parts.push({ key: 'ready', text: `${summary.ready} ready` })
  if (summary.preparing) parts.push({ key: 'preparing', text: `${summary.preparing} preparing` })
  if (summary.sent) parts.push({ key: 'sent', text: `${summary.sent} sent` })
  if (summary.held) parts.push({ key: 'held', text: `${summary.held} held` })
  if (summary.drafts) parts.push({ key: 'drafts', text: `${summary.drafts} not sent` })
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
