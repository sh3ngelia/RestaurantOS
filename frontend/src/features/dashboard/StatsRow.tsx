import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { motion } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { Role } from '@/config/roles'
import { OccupancyBar } from '@/features/tables/components/OccupancyBar'
import { countFloor } from '@/features/tables/floor'
import { useTables } from '@/features/tables/hooks'
import { getTablePermissions } from '@/features/tables/permissions'

type LiveSource = 'tablesSeated'

interface StatDefinition {
  label: string
  source: string
  roles: readonly Role[]
  /** Shown with real data when the viewer can reach the backing module; a placeholder otherwise. */
  live?: LiveSource
}

/** KPIs per role. Placeholders are wired to their module's endpoint as each module ships. */
const STATS: readonly StatDefinition[] = [
  { label: 'Covers tonight', source: 'Reservations', roles: ['Host', 'Waiter', 'Manager'] },
  { label: 'Tables seated', source: 'Tables', roles: ['Host', 'Waiter', 'Manager'], live: 'tablesSeated' },
  { label: 'Open tickets', source: 'Orders', roles: ['Waiter', 'Kitchen', 'Bar', 'Manager'] },
  { label: 'Avg. ticket time', source: 'Kitchen Display', roles: ['Kitchen', 'Bar', 'Manager'] },
  { label: "Items 86'd", source: 'Menu', roles: ['Kitchen', 'Bar'] },
  { label: 'Checks settled', source: 'Payments', roles: ['Waiter', 'Accountant'] },
  { label: 'Net sales', source: 'Payments', roles: ['Manager', 'Accountant'] },
  { label: 'Avg. check', source: 'Reports', roles: ['Accountant'] },
]

const LIVE_ACCESS: Record<LiveSource, (role: Role) => boolean> = {
  tablesSeated: (role) => getTablePermissions(role).canUseFloor,
}

const MAX_STATS = 4
const BAR_HEIGHTS = [40, 65, 50, 80, 60, 90, 72]

export function StatsRow({ role }: { role: Role }) {
  const stats = STATS.filter((s) => s.roles.includes(role)).slice(0, MAX_STATS)

  return (
    <section aria-labelledby="stats-heading">
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
            {stat.live === 'tablesSeated' && LIVE_ACCESS.tablesSeated(role) ? (
              <TablesSeatedStat label={stat.label} />
            ) : (
              <PlaceholderStat stat={stat} />
            )}
          </motion.div>
        ))}
      </div>
    </section>
  )
}

function PlaceholderStat({ stat }: { stat: StatDefinition }) {
  return (
    <Card className="relative h-full overflow-hidden p-4 sm:p-5" aria-busy="true">
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
  )
}

function TablesSeatedStat({ label }: { label: string }) {
  const tables = useTables()
  const counts = countFloor(tables.data ?? [])

  let body: ReactNode
  if (tables.isPending) {
    body = (
      <>
        <Skeleton className="mt-3 h-7 w-16 sm:w-20" />
        <Skeleton className="mt-4 h-1.5 w-full rounded-full" />
      </>
    )
  } else if (tables.isError) {
    body = <p className="mt-3 text-sm text-muted-foreground">Couldn’t load the floor.</p>
  } else {
    body = (
      <>
        <p className="mt-2 font-serif text-3xl leading-none font-light tabular-nums">
          {counts.byStatus.Occupied}
          <span className="text-base text-muted-foreground"> / {counts.total}</span>
        </p>
        <OccupancyBar counts={counts} className="mt-4" />
        <p className="mt-3 truncate font-mono text-[10.5px] tracking-wide text-muted-foreground uppercase">
          {counts.coversSeated} covers seated
        </p>
      </>
    )
  }

  return (
    <Link
      to="/m/tables"
      aria-busy={tables.isPending}
      aria-label={
        tables.isSuccess ? `${label}: ${counts.byStatus.Occupied} of ${counts.total}. Open the floor.` : `${label}. Open the floor.`
      }
      className="group block h-full rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Card className="relative h-full overflow-hidden p-4 transition-[border-color] duration-200 group-hover:border-primary/30 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[13px] text-muted-foreground">{label}</p>
          <ArrowUpRight
            className="size-3.5 text-muted-foreground transition-[color,transform] duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary"
            aria-hidden="true"
          />
        </div>
        {body}
      </Card>
    </Link>
  )
}
