import type { ReactNode } from 'react'

import { STATUS_TONE_CLASSES, type StatusTone } from '@/lib/status-tones'
import { cn } from '@/lib/utils'

interface StatusChipProps {
  tone: StatusTone
  children: ReactNode
  /** Leading dot in the tone's colour. */
  dot?: boolean
  /** Dashed outline for provisional states (pending, not yet sent). */
  dashed?: boolean
  className?: string
}

/** The one chip used for statuses across the app. */
export function StatusChip({ tone, children, dot = false, dashed = false, className }: StatusChipProps) {
  const classes = STATUS_TONE_CLASSES[tone]
  return (
    <span
      className={cn(
        'inline-flex h-5 items-center gap-1.5 rounded-sm border px-1.5 text-xs leading-none font-medium whitespace-nowrap',
        'transition-colors duration-150 [&_svg]:size-3 [&_svg]:shrink-0',
        classes.chip,
        dashed && 'border-dashed',
        className,
      )}
    >
      {dot && <span className={cn('size-1.5 shrink-0 rounded-full', tone === 'attention' ? 'bg-current' : classes.dot)} aria-hidden="true" />}
      {children}
    </span>
  )
}
