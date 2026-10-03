import { cn } from '@/lib/utils'

/*
 * Class recipes for the filter chips and segmented controls that pages build from
 * links and radio items. Kept here so every filter looks and behaves the same.
 */

/** A filter chip (a Link or a toggle button). Neutral: the active one is inverted, never the accent. */
export function filterChipClass(active: boolean, className?: string) {
  return cn(
    'touch-target flex h-8 shrink-0 items-center gap-2 rounded-sm border px-3 text-sm whitespace-nowrap outline-none',
    'transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring',
    active
      ? 'border-foreground bg-foreground font-medium text-background'
      : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground',
    className,
  )
}

/** The count inside a filter chip. */
export function filterChipCountClass(active: boolean) {
  return cn('text-xs tabular-nums', active ? 'text-background/70' : 'text-muted-foreground')
}

/** The track around a segmented control. */
export const segmentGroupClass = 'grid gap-0.5 rounded-md border border-border bg-sunken p-0.5'

/** One option in a segmented control; pass `data-[state=checked]` or aria-pressed state as `active`. */
export function segmentClass(active?: boolean, className?: string) {
  return cn(
    'touch-target h-8 rounded-sm px-3 text-sm font-medium text-muted-foreground outline-none',
    'transition-colors duration-150 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring',
    'data-[state=checked]:bg-card data-[state=checked]:text-foreground data-[state=checked]:ring-1 data-[state=checked]:ring-border-strong',
    active && 'bg-card text-foreground ring-1 ring-border-strong',
    className,
  )
}
