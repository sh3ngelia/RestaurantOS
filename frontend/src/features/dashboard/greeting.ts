// Pinned to English so the date matches the rest of the UI copy.
const dateFormatter = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

export function formatServiceDate(date = new Date()) {
  return dateFormatter.format(date)
}
