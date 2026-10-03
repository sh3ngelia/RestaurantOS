/*
 * Local-calendar helpers. A "day key" is a local date as YYYY-MM-DD; it is what
 * the URL carries and what query keys use. Instants travel to and from the API
 * as UTC ISO strings and are only ever displayed in the browser's time zone.
 */

const pad = (n: number) => String(n).padStart(2, '0')

export function toDayKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function isDayKey(value: string | null | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  return toDayKey(fromDayKey(value)) === value // rejects 2026-02-31 and friends
}

/** Local midnight at the start of the day. */
export function fromDayKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number) as [number, number, number]
  return new Date(y, m - 1, d)
}

export function todayKey(): string {
  return toDayKey(new Date())
}

export function addDays(key: string, days: number): string {
  const date = fromDayKey(key)
  // Constructing from parts (not adding 24h) keeps DST days correct.
  return toDayKey(new Date(date.getFullYear(), date.getMonth(), date.getDate() + days))
}

/** [local midnight, next local midnight) as UTC ISO strings for a range query. */
export function dayRange(key: string): { from: string; to: string } {
  return { from: fromDayKey(key).toISOString(), to: fromDayKey(addDays(key, 1)).toISOString() }
}

/** A local date + "HH:mm" as a Date. */
export function combineLocal(key: string, time: string): Date {
  const [h, min] = time.split(':').map(Number) as [number, number]
  const date = fromDayKey(key)
  date.setHours(h, min, 0, 0)
  return date
}

/**
 * Parses an API timestamp. A value without "Z" or an offset is treated as UTC,
 * so a DateTime the server serialised with Kind=Unspecified can't shift by the
 * browser's offset.
 */
export function parseUtc(iso: string): Date {
  return new Date(/(Z|[+-]\d{2}:?\d{2})$/i.test(iso) ? iso : `${iso}Z`)
}

/** "HH:mm" in local time, 24-hour. */
export function toTimeValue(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const timeFormatter = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
const dayFormatter = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
const shortDayFormatter = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })

export function formatTime(date: Date): string {
  return timeFormatter.format(date)
}

export function formatDay(key: string): string {
  return dayFormatter.format(fromDayKey(key))
}

export function formatShortDay(key: string): string {
  return shortDayFormatter.format(fromDayKey(key))
}

/** "Today", "Tomorrow", "Yesterday", or null for any other day. */
export function relativeDayLabel(key: string, today = todayKey()): string | null {
  if (key === today) return 'Today'
  if (key === addDays(today, 1)) return 'Tomorrow'
  if (key === addDays(today, -1)) return 'Yesterday'
  return null
}

/** Time since an instant, as "8 min" or "1 h 05". */
export function formatElapsed(sinceIso: string, now: Date): string {
  const minutes = Math.max(0, Math.floor((now.getTime() - new Date(sinceIso).getTime()) / 60_000))
  if (minutes < 60) return `${minutes} min`
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')}`
}
