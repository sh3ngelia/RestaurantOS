import { Badge } from '@/components/ui/badge'
import type { Role } from '@/config/roles'

export function RoleBadge({ role, size, className }: { role: Role; size?: 'default' | 'sm'; className?: string }) {
  return (
    <Badge size={size} className={className}>
      <span className="sr-only">Role: </span>
      {role}
    </Badge>
  )
}
