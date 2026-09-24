import { ChevronsUpDown, LogOut, Moon, Sun } from 'lucide-react'

import { RoleBadge } from '@/components/RoleBadge'
import { UserAvatar } from '@/components/UserAvatar'
import { useTheme } from '@/components/theme/useTheme'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ROLE_META } from '@/config/roles'
import { useAuth, useSession } from '@/features/auth/useAuth'

export function UserMenu() {
  const session = useSession()
  const { signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Account menu for ${session.fullName}`}
        className="flex items-center gap-3 rounded-xl py-1 pr-2 pl-1 text-left outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-accent"
      >
        <UserAvatar name={session.fullName} />
        <span className="hidden min-w-0 flex-col md:flex">
          <span className="max-w-40 truncate text-sm leading-tight font-medium">{session.fullName}</span>
          <span className="text-xs leading-tight text-muted-foreground">{ROLE_META[session.role].station}</span>
        </span>
        <RoleBadge role={session.role} size="sm" className="hidden sm:inline-flex" />
        <ChevronsUpDown className="hidden size-3.5 text-muted-foreground md:block" aria-hidden="true" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-3">
          <UserAvatar name={session.fullName} className="size-10" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{session.fullName}</p>
            <RoleBadge role={session.role} size="sm" className="mt-1" />
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={toggleTheme}>
          {theme === 'dark' ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
          {theme === 'dark' ? 'Light theme' : 'Dark theme'}
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onSelect={signOut}>
          <LogOut aria-hidden="true" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
