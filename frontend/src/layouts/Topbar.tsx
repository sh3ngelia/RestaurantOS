import { useLocation } from 'react-router'
import { Menu } from 'lucide-react'

import { ThemeToggle } from '@/components/ThemeToggle'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { getModule } from '@/config/modules'
import { UserMenu } from './UserMenu'

function useSectionTitle() {
  const { pathname } = useLocation()
  const moduleId = pathname.match(/^\/m\/([^/]+)/)?.[1]
  return getModule(moduleId)?.title ?? 'Dashboard'
}

export function Topbar({ onOpenNav, navOpen }: { onOpenNav: () => void; navOpen: boolean }) {
  const title = useSectionTitle()

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md supports-backdrop-filter:bg-background/65 sm:px-6 lg:px-8">
      <Button
        variant="ghost"
        size="icon"
        className="-ml-1.5 lg:hidden"
        onClick={onOpenNav}
        aria-label="Open navigation"
        aria-expanded={navOpen}
        aria-controls="mobile-navigation"
      >
        <Menu aria-hidden="true" />
      </Button>

      <p className="truncate text-sm font-medium text-muted-foreground">
        <span className="hidden sm:inline">RestaurantOS</span>
        <span className="mx-2 hidden text-border-strong sm:inline" aria-hidden="true">
          /
        </span>
        <span className="text-foreground">{title}</span>
      </p>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <ThemeToggle />
        <Separator orientation="vertical" className="mx-1 h-6! hidden sm:block" />
        <UserMenu />
      </div>
    </header>
  )
}
