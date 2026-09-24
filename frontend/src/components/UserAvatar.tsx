import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn, getInitials } from '@/lib/utils'

export function UserAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <Avatar className={cn('size-8 ring-1 ring-border-strong', className)}>
      <AvatarFallback
        delayMs={0}
        className="bg-[linear-gradient(145deg,var(--primary-soft),transparent)] bg-secondary font-sans text-xs font-semibold tracking-wide text-primary"
        aria-hidden="true"
      >
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  )
}
