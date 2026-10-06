import { Link } from 'react-router'

import { filterChipClass, filterChipCountClass } from '@/lib/controls'
import { cn } from '@/lib/utils'

export const ALL_CATEGORIES = 'all'
/** Every Bar-type item, whatever its category. Category ids are GUIDs, so this can't collide. */
export const DRINKS = 'drinks'

export interface CategoryNavEntry {
  id: string
  label: string
  count: number
}

interface CategoryNavProps {
  entries: CategoryNavEntry[]
  activeId: string
  /** The entry shown when ?category= is absent (Drinks for Bar users, All otherwise); it links to the bare URL. */
  defaultId: string
  className?: string
}

/** Horizontal chips on small screens, a vertical list on desktop. The choice lives in ?category=. */
export function CategoryNav({ entries, activeId, defaultId, className }: CategoryNavProps) {
  return (
    <nav aria-label="Menu categories" className={className}>
      <p className="mb-1 hidden px-2.5 text-xs font-medium text-muted-foreground lg:block">
        Categories
      </p>
      <ul
        className={cn(
          'flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          'lg:flex-col lg:gap-0.5 lg:overflow-visible',
        )}
      >
        {entries.map((entry) => {
          const active = entry.id === activeId
          return (
            <li key={entry.id} className="shrink-0">
              <Link
                to={{ search: entry.id === defaultId ? '' : `?category=${entry.id}` }}
                replace
                preventScrollReset
                aria-current={active ? 'true' : undefined}
                className={cn(
                  filterChipClass(active),
                  // On desktop it reads as a side list: no outline, the active entry tinted like the nav.
                  'lg:w-full lg:justify-between lg:rounded-md lg:border-transparent lg:px-2.5',
                  active && 'lg:bg-accent lg:text-foreground',
                )}
              >
                <span className="truncate">{entry.label}</span>
                <span className={cn(filterChipCountClass(active), active && 'lg:text-muted-foreground')}>
                  {entry.count}
                  <span className="sr-only"> items</span>
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
