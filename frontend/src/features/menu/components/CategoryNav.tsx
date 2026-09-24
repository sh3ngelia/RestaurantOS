import { Link } from 'react-router'

import { cn } from '@/lib/utils'

export const ALL_CATEGORIES = 'all'

export interface CategoryNavEntry {
  id: string
  label: string
  count: number
}

interface CategoryNavProps {
  entries: CategoryNavEntry[]
  activeId: string
  className?: string
}

/** Horizontal pill tabs on small screens, a vertical list on desktop. The choice lives in ?category=. */
export function CategoryNav({ entries, activeId, className }: CategoryNavProps) {
  return (
    <nav aria-label="Menu categories" className={className}>
      <p className="mb-3 hidden px-3 font-mono text-[10.5px] tracking-[0.16em] text-muted-foreground/80 uppercase lg:block">
        Categories
      </p>
      <ul
        className={cn(
          'flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          'mask-[linear-gradient(to_right,black_85%,transparent)] lg:flex-col lg:gap-0.5 lg:overflow-visible lg:mask-none',
        )}
      >
        {entries.map((entry) => {
          const active = entry.id === activeId
          return (
            <li key={entry.id} className="shrink-0">
              <Link
                to={{ search: entry.id === ALL_CATEGORIES ? '' : `?category=${entry.id}` }}
                replace
                preventScrollReset
                aria-current={active ? 'true' : undefined}
                className={cn(
                  'flex h-9 items-center gap-2 rounded-full border px-3.5 text-sm whitespace-nowrap outline-none',
                  'transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring',
                  'lg:w-full lg:justify-between lg:rounded-lg lg:border-transparent lg:px-3',
                  active
                    ? 'border-primary/40 bg-primary-soft font-medium text-primary lg:bg-accent lg:text-foreground'
                    : 'border-border text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                )}
              >
                <span className="truncate">{entry.label}</span>
                <span
                  className={cn(
                    'font-mono text-[11px] tabular-nums',
                    active ? 'text-primary' : 'text-muted-foreground/80',
                  )}
                >
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
