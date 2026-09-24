import { motion } from 'motion/react'

import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { Role } from '@/config/roles'

interface StatDefinition {
  label: string
  source: string
  roles: readonly Role[]
}

/** Placeholder KPIs, per role. Each will be wired to its module's endpoint as it ships. */
const STATS: readonly StatDefinition[] = [
  { label: 'Covers tonight', source: 'Reservations', roles: ['Host', 'Waiter', 'Manager'] },
  { label: 'Tables seated', source: 'Tables', roles: ['Host', 'Waiter', 'Manager'] },
  { label: 'Open tickets', source: 'Orders', roles: ['Waiter', 'Kitchen', 'Bar', 'Manager'] },
  { label: 'Avg. ticket time', source: 'Kitchen Display', roles: ['Kitchen', 'Bar', 'Manager'] },
  { label: "Items 86'd", source: 'Menu', roles: ['Kitchen', 'Bar'] },
  { label: 'Checks settled', source: 'Payments', roles: ['Waiter', 'Accountant'] },
  { label: 'Net sales', source: 'Payments', roles: ['Manager', 'Accountant'] },
  { label: 'Avg. check', source: 'Reports', roles: ['Accountant'] },
]

const MAX_STATS = 4
const BAR_HEIGHTS = [40, 65, 50, 80, 60, 90, 72]

export function StatsRow({ role }: { role: Role }) {
  const stats = STATS.filter((s) => s.roles.includes(role)).slice(0, MAX_STATS)

  return (
    <section aria-labelledby="stats-heading" aria-busy="true">
      <h2 id="stats-heading" className="sr-only">
        Today at a glance
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.05 + index * 0.04, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <Card className="relative h-full overflow-hidden p-4 sm:p-5">
              <p className="text-[13px] text-muted-foreground">{stat.label}</p>
              <div className="mt-3 flex items-end justify-between gap-3">
                <Skeleton className="h-7 w-16 sm:w-20" />
                <div className="hidden h-7 items-end gap-[3px] sm:flex" aria-hidden="true">
                  {BAR_HEIGHTS.map((h, i) => (
                    <Skeleton key={i} className="w-1.5 rounded-sm" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
              <p className="mt-3 truncate font-mono text-[10.5px] tracking-wide text-muted-foreground/70 uppercase">
                Awaiting {stat.source}
              </p>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
