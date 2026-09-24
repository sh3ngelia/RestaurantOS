import { Badge } from '@/components/ui/badge'
import type { Role } from '@/config/roles'
import { cn } from '@/lib/utils'

export function RoleBadge({ role, size, className }: { role: Role; size?: 'default' | 'sm'; className?: string }) {
  return (
    <Badge size={size} className={cn('tracking-wide', className)}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      <span className="sr-only">Role: </span>
      {role}
    </Badge>
  )
}
