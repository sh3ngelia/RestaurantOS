import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: ReactNode
  /** One functional line under the title: counts, a date, a status summary. */
  description?: ReactNode
  /** Extra content under the description, such as a progress bar. */
  children?: ReactNode
  /** Buttons or figures on the right. */
  actions?: ReactNode
  className?: string
}

/** The header every page starts with: a plain title, an optional summary line and actions. */
export function PageHeader({ title, description, children, actions, className }: PageHeaderProps) {
  return (
    <header className={cn('flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6', className)}>
      <div className="min-w-0 flex-1">
        <h1 className="text-xl leading-tight font-semibold">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground" aria-live="polite">
            {description}
          </p>
        )}
        {children}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 sm:justify-end">{actions}</div>}
    </header>
  )
}
