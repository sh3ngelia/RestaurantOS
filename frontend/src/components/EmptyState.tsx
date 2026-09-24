import type { ReactNode } from 'react'
import { motion } from 'motion/react'
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
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        'flex flex-col items-center rounded-2xl border border-dashed border-border-strong px-6 py-14 text-center',
        className,
      )}
    >
      <span className="surface-edge mb-5 grid size-12 place-items-center rounded-xl border border-border bg-card text-primary">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <h2 className="text-2xl font-normal text-balance">{title}</h2>
      {description && <p className="mt-2 max-w-sm text-sm leading-relaxed text-balance text-muted-foreground">{description}</p>}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-2">{action}</div>}
    </motion.div>
  )
}
