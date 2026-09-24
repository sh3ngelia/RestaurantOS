const priceFormatter = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' })

/** 12.5 → "€12.50" */
export function formatPrice(value: number) {
  return priceFormatter.format(value)
}

/**
 * Parses what people actually type into a price field: "12", "12.5", "12,50", "€ 12.50".
 * Returns null for anything that isn't a plain non-negative amount.
 */
export function parsePrice(input: string): number | null {
  const cleaned = input.replace(/[€\s]/g, '').replace(',', '.')
  if (!/^\d+(\.\d*)?$|^\.\d+$/.test(cleaned)) return null
  const value = Number(cleaned)
  return Number.isFinite(value) ? value : null
}

/** Value for a price <input>: "12.50" rather than "12.5". */
export function priceInputValue(value: number) {
  return value.toFixed(2)
}
