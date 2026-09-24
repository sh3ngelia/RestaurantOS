import { Link } from 'react-router'
import { motion } from 'motion/react'
import { ArrowUpRight, Clock } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { modulePath, type ModuleDefinition } from '@/config/modules'
import { cn } from '@/lib/utils'

const moduleCardVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.2, 0.8, 0.2, 1] as const } },
}

export function ModuleCard({ module }: { module: ModuleDefinition }) {
  const { icon: Icon, title, description, status } = module
  const comingSoon = status === 'coming-soon'

  return (
    <motion.li variants={moduleCardVariants} className="list-none">
      <Link
        to={modulePath(module)}
        aria-describedby={`${module.id}-status`}
        className={cn(
          'group surface-edge relative flex h-full flex-col rounded-xl border border-border bg-card p-5 outline-none',
          'transition-[border-color,transform,box-shadow] duration-200 ease-out',
          'hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lifted active:translate-y-0 active:scale-[0.99]',
          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <span
            className={cn(
              'grid size-11 place-items-center rounded-lg border transition-colors duration-200',
              comingSoon
                ? 'border-border bg-muted text-muted-foreground group-hover:text-primary'
                : 'border-primary/25 bg-primary-soft text-primary',
            )}
          >
            <Icon className="size-5" aria-hidden="true" />
          </span>

          {comingSoon ? (
            <Badge id={`${module.id}-status`} variant="outline" size="sm" className="gap-1">
              <Clock aria-hidden="true" />
              Coming soon
            </Badge>
          ) : (
            <span id={`${module.id}-status`} className="sr-only">
              Available
            </span>
          )}
        </div>

        <h3 className="mt-5 text-xl font-normal">{title}</h3>
        <p className={cn('mt-1.5 text-sm leading-relaxed', comingSoon ? 'text-muted-foreground/85' : 'text-muted-foreground')}>
          {description}
        </p>

        <span className="mt-auto flex items-center gap-1 pt-5 text-[13px] font-medium text-muted-foreground transition-colors group-hover:text-primary">
          {comingSoon ? 'See what’s planned' : 'Open'}
          <ArrowUpRight
            className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            aria-hidden="true"
          />
        </span>
      </Link>
    </motion.li>
  )
}
