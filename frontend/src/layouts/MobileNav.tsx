import { Logo } from '@/components/Logo'
import { RoleBadge } from '@/components/RoleBadge'
import { UserAvatar } from '@/components/UserAvatar'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { useSession } from '@/features/auth/useAuth'
import { SidebarNav } from './SidebarNav'

interface MobileNavProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MobileNav({ open, onOpenChange }: MobileNavProps) {
  const session = useSession()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" closeLabel="Close navigation" id="mobile-navigation">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <SheetDescription className="sr-only">Move between RestaurantOS modules.</SheetDescription>

        <div className="flex h-16 items-center px-5">
          <Logo />
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <SidebarNav instanceId="drawer" onNavigate={() => onOpenChange(false)} />
        </div>

        <div className="flex items-center gap-3 border-t border-border p-4">
          <UserAvatar name={session.fullName} className="size-9" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{session.fullName}</p>
            <RoleBadge role={session.role} size="sm" className="mt-1" />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
