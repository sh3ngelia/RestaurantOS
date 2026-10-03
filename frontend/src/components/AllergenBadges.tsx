import { TriangleAlert } from 'lucide-react'

import type { Allergen } from '@/api/menu'
import { cn } from '@/lib/utils'

interface AllergenBadgesProps {
  allergens: readonly Allergen[]
  className?: string
  /** "warning" for tickets and ordering, where an allergen must not be missed; "quiet" for browsing. */
  tone?: 'warning' | 'quiet'
  /** Show at most this many, then "+N". */
  max?: number
}

/** Allergen tags. Screen readers hear one sentence: "Contains: Gluten, Milk." */
export function AllergenBadges({ allergens, className, tone = 'warning', max }: AllergenBadgesProps) {
  if (allergens.length === 0) return null
  const shown = max && allergens.length > max ? allergens.slice(0, max) : allergens
  const hidden = allergens.length - shown.length

  return (
    <span className={cn('flex flex-wrap items-center gap-1', className)}>
      <span className="sr-only">Contains: {allergens.join(', ')}.</span>
      {tone === 'warning' && <TriangleAlert className="size-3.5 shrink-0 text-destructive" aria-hidden="true" />}
      {shown.map((allergen) => (
        <span
          key={allergen}
          aria-hidden="true"
          className={cn(
            'rounded-full border px-1.5 py-px text-[11px] leading-4 font-medium whitespace-nowrap',
            tone === 'warning'
              ? 'border-destructive/35 bg-destructive/10 text-destructive'
              : 'border-border-strong text-muted-foreground',
          )}
        >
          {allergen}
        </span>
      ))}
      {hidden > 0 && (
        <span aria-hidden="true" className="text-[11px] font-medium text-muted-foreground">
          +{hidden}
        </span>
      )}
    </span>
  )
}
