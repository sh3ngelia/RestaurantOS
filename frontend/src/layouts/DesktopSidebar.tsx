import { Link } from 'react-router'
import { motion } from 'motion/react'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'

import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { SidebarNav } from './SidebarNav'

const EXPANDED_WIDTH = 256
const COLLAPSED_WIDTH = 72

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
      transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
      className="sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-border bg-sunken/60 lg:flex"
    >
      <div className={cn('flex h-16 items-center', collapsed ? 'justify-center px-2' : 'px-5')}>
        <Link
          to="/"
          aria-label="RestaurantOS home"
          className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Logo collapsed={collapsed} />
        </Link>
      </div>

      <div className={cn('flex-1 overflow-x-hidden overflow-y-auto py-4', collapsed ? 'px-3' : 'px-3')}>
        <SidebarNav collapsed={collapsed} instanceId="desktop" />
      </div>

      <div className={cn('border-t border-border p-3', collapsed && 'flex justify-center')}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size={collapsed ? 'icon' : 'sm'}
              onClick={onToggle}
              aria-label={toggleLabel}
              aria-expanded={!collapsed}
              className={cn('text-muted-foreground hover:text-foreground', !collapsed && 'w-full justify-start gap-3 px-3')}
            >
              {collapsed ? <PanelLeftOpen aria-hidden="true" /> : <PanelLeftClose aria-hidden="true" />}
              {!collapsed && <span>Collapse</span>}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {toggleLabel} <kbd className="ml-1.5 font-mono text-muted-foreground">[</kbd>
          </TooltipContent>
        </Tooltip>
      </div>
    </motion.aside>
  )
}
