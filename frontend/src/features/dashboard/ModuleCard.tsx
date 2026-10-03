import { Link } from 'react-router'
import { ChevronRight } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { modulePath, type ModuleDefinition } from '@/config/modules'

export function ModuleCard({ module }: { module: ModuleDefinition }) {
  const { icon: Icon, title, description, status } = module
  const comingSoon = status === 'coming-soon'

  return (
    <li className="list-none">
      <Link
        to={modulePath(module)}
        aria-describedby={`${module.id}-status`}
        className="group flex h-full items-start gap-3 rounded-md border border-border bg-card p-3 outline-none transition-colors duration-150 hover:border-border-strong hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="text-sm font-medium">{title}</span>
            {comingSoon ? (
              <Badge id={`${module.id}-status`} variant="outline" size="sm">
                Coming soon
              </Badge>
            ) : (
              <span id={`${module.id}-status`} className="sr-only">
                Available
              </span>
            )}
          </span>
          <span className="mt-0.5 block text-[13px] text-muted-foreground">{description}</span>
        </span>
        <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground group-hover:text-foreground" aria-hidden="true" />
      </Link>
    </li>
  )
}
