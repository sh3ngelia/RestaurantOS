import { NavLink } from 'react-router'

import { segmentClass, segmentGroupClass } from '@/lib/controls'
import { cn } from '@/lib/utils'

const SECTIONS = [
  { to: '/m/menu', label: 'Items' },
  { to: '/m/menu/stations', label: 'Stations' },
] as const

/** Items / Stations switch at the top of the Menu module. Managers only; others just see the menu. */
export function MenuSectionNav({ className }: { className?: string }) {
  return (
    <nav aria-label="Menu sections" className={cn(segmentGroupClass, 'inline-grid grid-cols-2', className)}>
      {SECTIONS.map((section) => (
        <NavLink
          key={section.to}
          to={section.to}
          end
          className={({ isActive }) => segmentClass(isActive, 'inline-flex items-center justify-center px-4')}
        >
          {section.label}
        </NavLink>
      ))}
    </nav>
  )
}
