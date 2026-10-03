import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn, getInitials } from '@/lib/utils'

export function UserAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <Avatar className={cn('size-8 border border-border-strong', className)}>
      <AvatarFallback delayMs={0} className="bg-secondary text-xs font-semibold text-foreground/85" aria-hidden="true">
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  )
}
