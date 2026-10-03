import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: ReactNode
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center rounded-md border border-dashed border-border-strong px-6 py-10 text-center', className)}>
      <Icon className="mb-3 size-5 text-muted-foreground" aria-hidden="true" />
      <h2 className="text-sm font-semibold text-balance">{title}</h2>
      {description && <p className="mt-1 max-w-sm text-sm text-balance text-muted-foreground">{description}</p>}
      {action && <div className="mt-4 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  )
}
