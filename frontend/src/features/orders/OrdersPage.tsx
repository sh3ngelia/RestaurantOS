import { useMemo } from 'react'
import { Link } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { BellRing, CircleAlert, ClipboardList, RefreshCw } from 'lucide-react'

import { getErrorMessage } from '@/api/errors'
import type { Order } from '@/api/orders'
import type { DiningTable } from '@/api/tables'
import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { TABLE_GRID } from '@/features/tables/floor'
import { isForbidden, useTables } from '@/features/tables/hooks'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useNow } from '@/hooks/useNow'
import { collapseMotion, listItemMotion } from '@/lib/motion'
import { STATUS_TONE_CLASSES } from '@/lib/status-tones'
import { cn } from '@/lib/utils'
import { useRealtime } from '@/realtime/useRealtime'
import { OrderTableCard } from './components/OrderTableCard'
import { useOpenOrders } from './hooks'
import { summarizeOrder } from './rules'

/** How long a table stays highlighted after the kitchen marks one of its items ready. */
const JUST_READY_MS = 2 * 60_000

interface FloorEntry {
  key: string
  tableNumber: number
  tableId?: string
  order?: Order
}

/** The waiter's overview: every seated table, with its open order or a way to start one. */
export function OrdersPage() {
  useDocumentTitle('Orders')
  const now = useNow(30_000)
  const ordersQuery = useOpenOrders()
  // The floor plan lists seated tables without an order. Should a role ever lose read
  // access (403), the page quietly falls back to open orders alone.
  const tablesQuery = useTables()
  const floorForbidden = isForbidden(tablesQuery.error)
  const { recentlyReady } = useRealtime()
  const isJustReady = (order: Order | undefined) => {
    if (!order) return false
    const at = recentlyReady.get(order.id)
    return at !== undefined && now.getTime() - at < JUST_READY_MS && summarizeOrder(order).ready > 0
  }

  const orders = useMemo(() => ordersQuery.data ?? [], [ordersQuery.data])
  const entries = useMemo(() => buildEntries(tablesQuery.data, orders), [tablesQuery.data, orders])
  const readyOrders = orders
    .map((order) => ({ order, ready: summarizeOrder(order).ready }))
    .filter((r) => r.ready > 0)
    .sort((a, b) => (a.order.tableNumber ?? 0) - (b.order.tableNumber ?? 0))

  const loading = ordersQuery.isPending || (tablesQuery.isPending && !floorForbidden)
  const failed = ordersQuery.error ?? (tablesQuery.error && !floorForbidden ? tablesQuery.error : null)

  return (
    <div className="space-y-5">
      <PageHeader
        title="Orders"
        description={
          loading || failed
            ? undefined
            : `${orders.length} open ${orders.length === 1 ? 'order' : 'orders'}${
                readyOrders.length
                  ? ` · ${readyOrders.length} ${readyOrders.length === 1 ? 'table has' : 'tables have'} food ready`
                  : ''
              }`
        }
      />

      <AnimatePresence initial={false}>
        {readyOrders.length > 0 && (
          <motion.section key="pass" aria-labelledby="pass-heading" {...collapseMotion} className="overflow-hidden">
            <div className={cn('flex flex-wrap items-center gap-3 rounded-md border px-3 py-2', STATUS_TONE_CLASSES.attention.surface)}>
              <h2 id="pass-heading" className="flex items-center gap-2 text-sm font-semibold text-status-attention">
                <BellRing className="size-4" aria-hidden="true" />
                At the pass
              </h2>
              <ul className="flex flex-wrap gap-1.5">
                {readyOrders.map(({ order, ready }) => (
                  <li key={order.id}>
                    <Button asChild size="sm">
                      <Link to={`/m/orders/${order.id}`}>
                        Table {order.tableNumber} · {ready} ready
                      </Link>
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {loading ? (
        <div className={TABLE_GRID} role="status" aria-label="Loading orders">
          {Array.from({ length: 10 }, (_, i) => (
            <Skeleton key={i} className="h-36 rounded-md" />
          ))}
        </div>
      ) : failed ? (
        <EmptyState
          icon={CircleAlert}
          title="Couldn’t load orders"
          description={getErrorMessage(failed)}
          action={
            <Button
              variant="outline"
              onClick={() => {
                void ordersQuery.refetch()
                void tablesQuery.refetch()
              }}
            >
              <RefreshCw aria-hidden="true" />
              Try again
            </Button>
          }
        />
      ) : entries.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={floorForbidden ? 'No open orders' : 'No seated tables'}
          description={
            floorForbidden
              ? 'Orders started for your tables will appear here.'
              : 'Seated tables appear here.'
          }
        />
      ) : (
        <ul aria-label="Seated tables" className={TABLE_GRID}>
          <AnimatePresence initial={false} mode="popLayout">
            {entries.map((entry) => (
              <motion.li key={entry.key} {...listItemMotion}>
                <OrderTableCard
                  tableNumber={entry.tableNumber}
                  tableId={entry.tableId}
                  order={entry.order}
                  now={now}
                  justReady={isJustReady(entry.order)}
                />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  )
}

/** Seated tables plus any table with an open order; orders alone when the floor isn't readable. */
function buildEntries(tables: DiningTable[] | undefined, orders: Order[]): FloorEntry[] {
  const byTable = new Map(orders.filter((o) => o.tableId).map((o) => [o.tableId as string, o]))
  if (tables) {
    return tables
      .filter((t) => t.status === 'Occupied' || byTable.has(t.id))
      .map((t) => ({ key: t.id, tableNumber: t.tableNumber, tableId: t.id, order: byTable.get(t.id) }))
  }
  return orders
    .filter((o) => o.tableNumber !== null)
    .sort((a, b) => (a.tableNumber ?? 0) - (b.tableNumber ?? 0))
    .map((o) => ({ key: o.id, tableNumber: o.tableNumber as number, tableId: o.tableId ?? undefined, order: o }))
}
