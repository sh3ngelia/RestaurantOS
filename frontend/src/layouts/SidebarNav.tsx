import type { ReactNode } from 'react'
import { NavLink } from 'react-router'
import { motion } from 'motion/react'
import { LayoutDashboard, type LucideIcon } from 'lucide-react'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { MODULE_GROUPS, getModulesForRole, modulePath } from '@/config/modules'
import { useSession } from '@/features/auth/useAuth'
import { cn } from '@/lib/utils'

interface SidebarNavProps {
  collapsed?: boolean
  /** Distinguishes the desktop and drawer instances so their active indicators animate independently. */
  instanceId: string
  onNavigate?: () => void
}

export function SidebarNav({ collapsed = false, instanceId, onNavigate }: SidebarNavProps) {
  const { role } = useSession()
  const modules = getModulesForRole(role)

  return (
    <nav aria-label="Main" className="flex flex-col gap-6">
      <ul className="flex flex-col gap-0.5">
        <li>
          <NavItem
            to="/"
            end
            icon={LayoutDashboard}
            label="Dashboard"
            collapsed={collapsed}
            instanceId={instanceId}
            onNavigate={onNavigate}
          />
        </li>
      </ul>

      {MODULE_GROUPS.map((group) => {
        const items = modules.filter((m) => m.group === group)
        if (items.length === 0) return null
        const headingId = `${instanceId}-nav-${group}`
        return (
          <div key={group}>
            {collapsed ? (
              <div className="mx-auto mb-2 h-px w-6 bg-border" role="presentation" />
            ) : (
              <p id={headingId} className="mb-2 px-3 font-mono text-[10.5px] tracking-[0.16em] text-muted-foreground/80 uppercase">
                {group}
              </p>
            )}
            <ul className="flex flex-col gap-0.5" aria-labelledby={collapsed ? undefined : headingId} aria-label={collapsed ? group : undefined}>
              {items.map((module) => (
                <li key={module.id}>
                  <NavItem
                    to={modulePath(module)}
                    icon={module.icon}
                    label={module.title}
                    collapsed={collapsed}
                    instanceId={instanceId}
                    onNavigate={onNavigate}
                    trailing={
                      module.status === 'coming-soon' ? (
                        <span className="rounded-sm border border-border px-1.5 py-px font-mono text-[9.5px] tracking-wider text-muted-foreground/80 uppercase">
                          Soon
                        </span>
                      ) : undefined
                    }
                  />
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </nav>
  )
}

interface NavItemProps {
  to: string
  end?: boolean
  icon: LucideIcon
  label: string
  collapsed: boolean
  instanceId: string
  trailing?: ReactNode
  onNavigate?: () => void
}

function NavItem({ to, end, icon: Icon, label, collapsed, instanceId, trailing, onNavigate }: NavItemProps) {
  const link = (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      aria-label={collapsed ? label : undefined}
      className={({ isActive }) =>
        cn(
          'group relative flex h-9 items-center gap-3 rounded-lg px-3 text-sm outline-none',
          'transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring',
          collapsed && 'justify-center px-0',
          isActive ? 'bg-accent font-medium text-foreground' : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId={`${instanceId}-nav-indicator`}
              className="absolute top-2 bottom-2 -left-px w-[3px] rounded-full bg-primary"
              transition={{ type: 'spring', stiffness: 500, damping: 40 }}
            />
          )}
          <Icon
            className={cn('size-[18px] shrink-0 transition-colors', isActive ? 'text-primary' : 'group-hover:text-foreground')}
            aria-hidden="true"
          />
          {!collapsed && (
            <>
              <span className="truncate">{label}</span>
              {trailing && <span className="ml-auto">{trailing}</span>}
            </>
          )}
        </>
      )}
    </NavLink>
  )

  if (!collapsed) return link

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  )
}
