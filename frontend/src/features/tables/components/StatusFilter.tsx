import { Link } from 'react-router'

import type { TableStatus } from '@/api/tables'
import { cn } from '@/lib/utils'
import { STATUS_FILTERS, STATUS_TONES, type StatusFilterId } from '../status'

interface StatusFilterProps {
  activeId: StatusFilterId
  counts: Record<TableStatus, number>
  total: number
}

/** Filter chips; the choice lives in ?status= so it survives reloads and the back button. */
export function StatusFilter({ activeId, counts, total }: StatusFilterProps) {
  return (
    <nav aria-label="Filter tables by status">
      <ul className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {STATUS_FILTERS.map((filter) => {
          const active = filter.id === activeId
          const count = filter.status ? counts[filter.status] : total
          return (
            <li key={filter.id} className="shrink-0">
              <Link
                to={{ search: filter.id === 'all' ? '' : `?status=${filter.id}` }}
                replace
                preventScrollReset
                aria-current={active ? 'true' : undefined}
                className={cn(
                  'flex h-10 items-center gap-2 rounded-full border px-4 text-sm whitespace-nowrap outline-none',
                  'transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring',
                  active
                    ? 'border-foreground/80 bg-foreground font-medium text-background'
                    : 'border-border text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                )}
              >
                {filter.status && (
                  <span className={cn('size-2 rounded-full', STATUS_TONES[filter.status].dot)} aria-hidden="true" />
                )}
                {filter.label}
                <span className={cn('font-mono text-[11px] tabular-nums', active ? 'text-background/70' : 'text-muted-foreground/80')}>
                  {count}
                  <span className="sr-only"> tables</span>
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
