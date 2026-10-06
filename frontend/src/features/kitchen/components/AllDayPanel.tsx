import { useId, useState } from 'react'
import { ChevronDown } from 'lucide-react'

import { cn } from '@/lib/utils'
import { ALL_DAY_LABELS, ALL_DAY_STATUSES, type AllDayLine } from '../rules'

const STATUS_TEXT: Record<(typeof ALL_DAY_STATUSES)[number], string> = {
  InProgress: 'text-status-active',
  Pending: 'text-foreground',
  Held: 'text-muted-foreground',
}

/** "(2 cooking, 4 on hold)": only the statuses present, coloured like the tickets' items. */
function Split({ line }: { line: AllDayLine }) {
  const parts = ALL_DAY_STATUSES.filter((status) => line.byStatus[status])
  return (
    <span className="text-sm text-muted-foreground tabular-nums">
      (
      {parts.map((status, index) => (
        <span key={status}>
          {index > 0 && ', '}
          <span className={STATUS_TEXT[status]}>
            {line.byStatus[status]} {ALL_DAY_LABELS[status]}
          </span>
        </span>
      ))}
      )
    </span>
  )
}

function Lines({ lines, className }: { lines: AllDayLine[]; className?: string }) {
  return (
    <ul className={cn('divide-y divide-border', className)}>
      {lines.map((line) => (
        <li key={line.name} className="flex items-baseline gap-3 px-3 py-2">
          <span className="min-w-0 flex-1">
            <span className="block text-base leading-snug font-semibold break-words">{line.name}</span>
            <Split line={line} />
          </span>
          <span className="text-2xl leading-none font-bold tabular-nums">{line.total}</span>
        </li>
      ))}
    </ul>
  )
}

/**
 * The all-day count: how many of each dish the tickets on screen add up to, so a cook can
 * batch. A side panel on wide screens; on tablets, a bar at the top that opens into the list.
 */
export function AllDayPanel({ lines, placement }: { lines: AllDayLine[]; placement: 'side' | 'top' }) {
  const headingId = useId()
  const listId = useId()
  const [open, setOpen] = useState(false)
  const portions = lines.reduce((sum, line) => sum + line.total, 0)

  if (placement === 'side') {
    return (
      <aside aria-labelledby={headingId} className="sticky top-3 self-start overflow-hidden rounded-md border border-border-strong bg-card">
        <h2 id={headingId} className="flex items-baseline justify-between border-b border-border px-3 py-2.5 text-lg font-semibold">
          All day
          <span className="text-sm font-normal text-muted-foreground tabular-nums">{portions} to make</span>
        </h2>
        {lines.length > 0 ? (
          <Lines lines={lines} className="max-h-[calc(100dvh-8rem)] overflow-y-auto" />
        ) : (
          <p className="px-3 py-4 text-base text-muted-foreground">Nothing to make.</p>
        )}
      </aside>
    )
  }

  const preview = lines.slice(0, 3)
  return (
    <section aria-labelledby={headingId} className="overflow-hidden rounded-md border border-border-strong bg-card">
      <h2 id={headingId}>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen((current) => !current)}
          className="touch-target flex w-full items-center gap-3 px-3 py-2.5 text-left outline-none transition-colors duration-150 hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        >
          <span className="text-lg font-semibold">All day</span>
          <span className="min-w-0 flex-1 truncate text-base text-muted-foreground tabular-nums" aria-hidden={open}>
            {preview.length === 0
              ? 'Nothing to make'
              : preview.map((line) => `${line.name} ${line.total}`).join(' · ') +
                (lines.length > preview.length ? ` · +${lines.length - preview.length} more` : '')}
          </span>
          <ChevronDown className={cn('size-5 shrink-0 transition-transform duration-150', open && 'rotate-180')} aria-hidden="true" />
        </button>
      </h2>
      <div id={listId} hidden={!open} className="border-t border-border">
        {/* A grid on wider tablets: each line draws its own bottom rule instead of dividers. */}
        <Lines lines={lines} className="grid divide-y-0 sm:grid-cols-2 lg:grid-cols-3 [&>li]:border-b [&>li]:border-border" />
      </div>
    </section>
  )
}
