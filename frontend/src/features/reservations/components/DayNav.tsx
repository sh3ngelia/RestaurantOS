import { useId, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { addDays, formatShortDay, isDayKey, todayKey } from '@/lib/dates'
import { cn } from '@/lib/utils'

interface DayNavProps {
  dayKey: string
  onChange: (dayKey: string) => void
  className?: string
}

/** Previous / Today / next, plus a native date picker (the best picker on a tablet). */
export function DayNav({ dayKey, onChange, className }: DayNavProps) {
  const dateId = useId()
  const isToday = dayKey === todayKey()

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <div className="flex items-center rounded-xl border border-border bg-card p-1">
        <NavButton label={`Previous day, ${formatShortDay(addDays(dayKey, -1))}`} onClick={() => onChange(addDays(dayKey, -1))}>
          <ChevronLeft aria-hidden="true" />
        </NavButton>
        <Button
          variant="ghost"
          onClick={() => onChange(todayKey())}
          disabled={isToday}
          aria-label={isToday ? 'Showing today' : 'Jump to today'}
          className="h-10 px-4 disabled:opacity-100 disabled:text-muted-foreground"
        >
          Today
        </Button>
        <NavButton label={`Next day, ${formatShortDay(addDays(dayKey, 1))}`} onClick={() => onChange(addDays(dayKey, 1))}>
          <ChevronRight aria-hidden="true" />
        </NavButton>
      </div>

      <label htmlFor={dateId} className="sr-only">
        Choose a date
      </label>
      <input
        id={dateId}
        type="date"
        value={dayKey}
        onChange={(e) => isDayKey(e.target.value) && onChange(e.target.value)}
        className={cn(
          'h-12 rounded-xl border border-border bg-card px-3.5 text-sm text-foreground tabular-nums outline-none [color-scheme:inherit]',
          'transition-[border-color,box-shadow] duration-150 hover:border-border-strong',
          'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/25',
        )}
      />
    </div>
  )
}

function NavButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" onClick={onClick} aria-label={label} className="size-10">
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
