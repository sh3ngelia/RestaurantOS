import { Link } from 'react-router'
import { motion } from 'motion/react'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'

import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { FAST } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { SidebarNav } from './SidebarNav'

const EXPANDED_WIDTH = 232
const COLLAPSED_WIDTH = 64

interface DesktopSidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function DesktopSidebar({ collapsed, onToggle }: DesktopSidebarProps) {
  const toggleLabel = collapsed ? 'Expand sidebar' : 'Collapse sidebar'

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH }}
      transition={FAST}
      className="sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-border bg-sunken lg:flex"
    >
      <div className={cn('flex h-14 shrink-0 items-center border-b border-border', collapsed ? 'justify-center px-2' : 'px-4')}>
        <Link
          to="/"
          aria-label="RestaurantOS home"
          className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Logo collapsed={collapsed} />
        </Link>
      </div>

      <div className="flex-1 overflow-x-hidden overflow-y-auto px-2 py-3">
        <SidebarNav collapsed={collapsed} instanceId="desktop" />
      </div>

      <div className={cn('border-t border-border p-2', collapsed && 'flex justify-center')}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size={collapsed ? 'icon' : 'sm'}
              onClick={onToggle}
              aria-label={toggleLabel}
              aria-expanded={!collapsed}
              className={cn('text-muted-foreground hover:text-foreground', !collapsed && 'w-full justify-start gap-3 px-2.5')}
            >
              {collapsed ? <PanelLeftOpen aria-hidden="true" /> : <PanelLeftClose aria-hidden="true" />}
              {!collapsed && <span>Collapse</span>}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {toggleLabel} <kbd className="ml-1.5 text-muted-foreground">[</kbd>
          </TooltipContent>
        </Tooltip>
      </div>
    </motion.aside>
  )
}
