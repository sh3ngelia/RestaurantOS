import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { motion } from 'motion/react'
import { ChevronRight } from 'lucide-react'

import { StatusChip } from '@/components/StatusChip'
import { Skeleton } from '@/components/ui/skeleton'
import type { Role } from '@/config/roles'
import { OccupancyBar } from '@/features/tables/components/OccupancyBar'
import { countFloor } from '@/features/tables/floor'
import { useTables } from '@/features/tables/hooks'
import { getTablePermissions } from '@/features/tables/permissions'
import { useDayReservations } from '@/features/reservations/hooks'
import { canUseReservations } from '@/features/reservations/permissions'
import { summarizeDay } from '@/features/reservations/summary'
import { todayKey } from '@/lib/dates'
import { FAST } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { useOpenOrders } from '@/features/orders/hooks'
import { getOrderPermissions } from '@/features/orders/permissions'
import { summarizeOrder } from '@/features/orders/rules'

type LiveSource = 'tablesSeated' | 'coversTonight' | 'openTickets'

interface StatDefinition {
  label: string
  source: string
  roles: readonly Role[]
  /** Shown with real data when the viewer can reach the backing module; a placeholder otherwise. */
  live?: LiveSource
}

/** KPIs per role. Placeholders are wired to their module's endpoint as each module ships. */
const STATS: readonly StatDefinition[] = [
  { label: 'Covers tonight', source: 'Reservations', roles: ['Host', 'Waiter', 'Manager'], live: 'coversTonight' },
  { label: 'Tables seated', source: 'Tables', roles: ['Host', 'Waiter', 'Manager'], live: 'tablesSeated' },
  { label: 'Open tickets', source: 'Orders', roles: ['Waiter', 'Kitchen', 'Bar', 'Manager'], live: 'openTickets' },
  { label: 'Avg. ticket time', source: 'Kitchen Display', roles: ['Kitchen', 'Bar', 'Manager'] },
  { label: "Items 86'd", source: 'Menu', roles: ['Kitchen', 'Bar'] },
  { label: 'Checks settled', source: 'Payments', roles: ['Waiter', 'Accountant'] },
  { label: 'Net sales', source: 'Payments', roles: ['Manager', 'Accountant'] },
  { label: 'Avg. check', source: 'Reports', roles: ['Accountant'] },
]

const LIVE_ACCESS: Record<LiveSource, (role: Role) => boolean> = {
  tablesSeated: (role) => getTablePermissions(role).canUseFloor,
  coversTonight: canUseReservations,
  openTickets: (role) => getOrderPermissions(role).canTakeOrders,
}

const MAX_STATS = 4

export function StatsRow({ role }: { role: Role }) {
  const stats = STATS.filter((s) => s.roles.includes(role)).slice(0, MAX_STATS)

  return (
    <section aria-labelledby="stats-heading">
      <h2 id="stats-heading" className="sr-only">
        Today
      </h2>
      <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
        {stats.map((stat) =>
          stat.live === 'tablesSeated' && LIVE_ACCESS.tablesSeated(role) ? (
            <TablesSeatedStat key={stat.label} label={stat.label} />
          ) : stat.live === 'coversTonight' && LIVE_ACCESS.coversTonight(role) ? (
            <CoversTonightStat key={stat.label} label={stat.label} />
          ) : stat.live === 'openTickets' && LIVE_ACCESS.openTickets(role) ? (
            <OpenTicketsStat key={stat.label} label={stat.label} />
          ) : (
            <PlaceholderStat key={stat.label} stat={stat} />
          ),
        )}
      </div>
    </section>
  )
}

const statFrame = 'flex h-full min-h-24 flex-col rounded-md border bg-card p-3'
const statValue = 'mt-1 text-2xl leading-none font-semibold tabular-nums'
const statCaption = 'mt-auto truncate pt-2 text-xs text-muted-foreground'

/** A stat whose module hasn't shipped: a dash, not a fake chart. */
function PlaceholderStat({ stat }: { stat: StatDefinition }) {
  return (
    <div className={cn(statFrame, 'border-border')}>
      <p className="text-[13px] text-muted-foreground">{stat.label}</p>
      <p className={cn(statValue, 'text-muted-foreground')}>
        <span aria-hidden="true">—</span>
        <span className="sr-only">No data yet</span>
      </p>
    </div>
  )
}

/** A live stat that links to its module. */
function StatLink({
  to,
  label,
  ariaLabel,
  busy,
  highlight = false,
  children,
}: {
  to: string
  label: string
  ariaLabel: string
  busy: boolean
  highlight?: boolean
  children: ReactNode
}) {
  return (
    <Link
      to={to}
      aria-busy={busy}
      aria-label={ariaLabel}
      className={cn(
        statFrame,
        'group outline-none transition-colors duration-150 hover:border-border-strong focus-visible:ring-2 focus-visible:ring-ring',
        highlight ? 'border-status-attention' : 'border-border',
      )}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="text-[13px] text-muted-foreground">{label}</span>
        <ChevronRight className="size-3.5 text-muted-foreground group-hover:text-foreground" aria-hidden="true" />
      </span>
      {children}
    </Link>
  )
}

function StatLoading() {
  return (
    <>
      <Skeleton className="mt-1 h-6 w-14" />
      <Skeleton className="mt-auto h-3 w-24" />
    </>
  )
}

function TablesSeatedStat({ label }: { label: string }) {
  const tables = useTables()
  const counts = countFloor(tables.data ?? [])

  let body: ReactNode
  if (tables.isPending) {
    body = <StatLoading />
  } else if (tables.isError) {
    body = <p className="mt-1 text-sm text-muted-foreground">Couldn’t load tables.</p>
  } else {
    body = (
      <>
        <p className={statValue}>
          {counts.byStatus.Occupied}
          <span className="text-sm font-normal text-muted-foreground"> / {counts.total}</span>
        </p>
        <OccupancyBar counts={counts} className="mt-2" />
        <p className={statCaption}>{counts.coversSeated} covers seated</p>
      </>
    )
  }

  return (
    <StatLink
      to="/m/tables"
      label={label}
      busy={tables.isPending}
      ariaLabel={
        tables.isSuccess ? `${label}: ${counts.byStatus.Occupied} of ${counts.total}. Open tables.` : `${label}. Open tables.`
      }
    >
      {body}
    </StatLink>
  )
}

function CoversTonightStat({ label }: { label: string }) {
  const reservations = useDayReservations(todayKey())
  const summary = summarizeDay(reservations.data ?? [])
  const arrivedShare = summary.coversExpected > 0 ? (summary.coversArrived / summary.coversExpected) * 100 : 0

  let body: ReactNode
  if (reservations.isPending) {
    body = <StatLoading />
  } else if (reservations.isError) {
    body = <p className="mt-1 text-sm text-muted-foreground">Couldn’t load reservations.</p>
  } else {
    body = (
      <>
        <p className={statValue}>{summary.coversExpected}</p>
        <div className="mt-2 h-1 w-full overflow-hidden rounded-sm bg-border-strong" aria-hidden="true">
          <motion.div
            className="h-full bg-status-active"
            initial={false}
            animate={{ width: `${arrivedShare}%` }}
            transition={FAST}
          />
        </div>
        <p className={statCaption}>
          {summary.active} {summary.active === 1 ? 'booking' : 'bookings'} · {summary.coversArrived} arrived
        </p>
      </>
    )
  }

  return (
    <StatLink
      to="/m/reservations"
      label={label}
      busy={reservations.isPending}
      ariaLabel={
        reservations.isSuccess
          ? `${label}: ${summary.coversExpected} covers expected, ${summary.coversArrived} guests arrived. Open reservations.`
          : `${label}. Open reservations.`
      }
    >
      {body}
    </StatLink>
  )
}

function OpenTicketsStat({ label }: { label: string }) {
  const orders = useOpenOrders()
  const list = orders.data ?? []
  const readyTables = list.filter((o) => summarizeOrder(o).ready > 0).length
  const inKitchen = list.reduce((sum, o) => {
    const s = summarizeOrder(o)
    return sum + s.sent + s.preparing
  }, 0)

  let body: ReactNode
  if (orders.isPending) {
    body = <StatLoading />
  } else if (orders.isError) {
    body = <p className="mt-1 text-sm text-muted-foreground">Couldn’t load orders.</p>
  } else {
    body = (
      <>
        <p className={statValue}>{list.length}</p>
        <p className="mt-auto pt-2">
          {readyTables > 0 ? (
            <StatusChip tone="attention">
              {readyTables} {readyTables === 1 ? 'table' : 'tables'} ready
            </StatusChip>
          ) : (
            <span className="text-xs text-muted-foreground">
              {inKitchen} {inKitchen === 1 ? 'item' : 'items'} in progress
            </span>
          )}
        </p>
      </>
    )
  }

  return (
    <StatLink
      to="/m/orders"
      label={label}
      busy={orders.isPending}
      highlight={readyTables > 0}
      ariaLabel={
        orders.isSuccess ? `${label}: ${list.length} open, ${readyTables} with food ready. Open orders.` : `${label}. Open orders.`
      }
    >
      {body}
    </StatLink>
  )
}
