import { Link } from 'react-router'

import type { TableStatus } from '@/api/tables'
import { filterChipClass, filterChipCountClass } from '@/lib/controls'
import { STATUS_TONE_CLASSES } from '@/lib/status-tones'
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
      <ul className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                className={filterChipClass(active)}
              >
                {filter.status && (
                  <span
                    className={cn('size-1.5 rounded-full', STATUS_TONE_CLASSES[STATUS_TONES[filter.status]].dot)}
                    aria-hidden="true"
                  />
                )}
                {filter.label}
                <span className={filterChipCountClass(active)}>
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
