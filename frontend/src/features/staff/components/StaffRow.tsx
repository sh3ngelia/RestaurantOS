import type { ReactNode } from 'react'
import { Ellipsis, KeyRound, Pencil, ShieldCheck, UserCheck, UserX } from 'lucide-react'

import type { StaffMember } from '@/api/staff'
import { RoleBadge } from '@/components/RoleBadge'
import { UserAvatar } from '@/components/UserAvatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

const joinedFormatter = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

interface StaffRowProps {
  member: StaffMember
  isYou: boolean
  /** Why the role can't be changed / the account can't be deactivated, or null. */
  roleBlocker: string | null
  deactivateBlocker: string | null
  onEdit: () => void
  onChangeRole: () => void
  onResetPassword: () => void
  onToggleActive: () => void
}

export function StaffRow({
  member,
  isYou,
  roleBlocker,
  deactivateBlocker,
  onEdit,
  onChangeRole,
  onResetPassword,
  onToggleActive,
}: StaffRowProps) {
  const inactive = !member.isActive
  const nameId = `staff-${member.id}`

  return (
    <article
      aria-labelledby={nameId}
      className={cn(
        'surface-edge flex items-center gap-3 rounded-xl border p-3.5 transition-[background-color,border-color,opacity] duration-300 sm:gap-4 sm:p-4',
        inactive ? 'border-dashed border-border-strong bg-card/40 shadow-none' : 'border-border bg-card',
      )}
    >
      <UserAvatar name={member.fullName} className={cn('size-10', inactive && 'opacity-60 grayscale')} />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h3
            id={nameId}
            className={cn('truncate font-sans text-[15px] font-medium tracking-normal', inactive && 'text-muted-foreground')}
          >
            {member.fullName}
          </h3>
          {isYou && (
            <span className="rounded-full border border-primary/40 px-1.5 py-px text-[11px] leading-4 font-medium text-primary">
              You
            </span>
          )}
        </div>
        <p className="truncate text-sm text-muted-foreground">{member.email}</p>
      </div>

      <p className="hidden shrink-0 text-xs text-muted-foreground tabular-nums lg:block">
        Joined {joinedFormatter.format(new Date(member.createdAt))}
      </p>

      <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center sm:gap-2">
        <RoleBadge role={member.role} size="sm" className={cn(inactive && 'opacity-60')} />
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-2 py-px text-[11px] leading-4 font-medium',
            inactive ? 'border-dashed border-border-strong text-muted-foreground' : 'border-border-strong text-foreground/80',
          )}
        >
          <span className={cn('size-1.5 rounded-full', inactive ? 'bg-muted-foreground/40' : 'bg-foreground/70')} aria-hidden="true" />
          {inactive ? 'Inactive' : 'Active'}
        </span>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-10 shrink-0 text-muted-foreground" aria-label={`Actions for ${member.fullName}`}>
            <Ellipsis aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onSelect={onEdit}>
            <Pencil aria-hidden="true" />
            Edit profile
          </DropdownMenuItem>
          <GuardedItem icon={<ShieldCheck aria-hidden="true" />} label="Change role" blocker={roleBlocker} onSelect={onChangeRole} />
          <DropdownMenuItem onSelect={onResetPassword}>
            <KeyRound aria-hidden="true" />
            Reset password
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {inactive ? (
            <DropdownMenuItem onSelect={onToggleActive}>
              <UserCheck aria-hidden="true" />
              Activate
            </DropdownMenuItem>
          ) : (
            <GuardedItem
              icon={<UserX aria-hidden="true" />}
              label="Deactivate"
              blocker={deactivateBlocker}
              onSelect={onToggleActive}
              destructive
            />
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </article>
  )
}

/**
 * A menu item the API would refuse right now (your own account, the last manager).
 * Soft-disabled rather than `disabled` so it stays focusable and its tooltip can say why.
 */
function GuardedItem({
  icon,
  label,
  blocker,
  onSelect,
  destructive = false,
}: {
  icon: ReactNode
  label: string
  blocker: string | null
  onSelect: () => void
  destructive?: boolean
}) {
  if (!blocker) {
    return (
      <DropdownMenuItem onSelect={onSelect} variant={destructive ? 'destructive' : 'default'}>
        {icon}
        {label}
      </DropdownMenuItem>
    )
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <DropdownMenuItem
          aria-disabled="true"
          onSelect={(event) => event.preventDefault()}
          className="cursor-not-allowed text-muted-foreground opacity-60 focus:bg-transparent"
        >
          {icon}
          {label}
          <span className="sr-only">, unavailable: {blocker}</span>
        </DropdownMenuItem>
      </TooltipTrigger>
      <TooltipContent side="left" className="max-w-60">
        {blocker}
      </TooltipContent>
    </Tooltip>
  )
}
