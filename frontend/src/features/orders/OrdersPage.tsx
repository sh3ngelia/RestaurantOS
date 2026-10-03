import { useMemo } from 'react'
import { Link } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { BellRing, CircleAlert, ClipboardList, RefreshCw } from 'lucide-react'

import { getErrorMessage } from '@/api/errors'
import type { Order } from '@/api/orders'
import type { DiningTable } from '@/api/tables'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { isForbidden, useTables } from '@/features/tables/hooks'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useNow } from '@/hooks/useNow'
import { OrderTableCard } from './components/OrderTableCard'
import { useOpenOrders } from './hooks'
import { summarizeOrder } from './rules'

const EASE = [0.2, 0.8, 0.2, 1] as const

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

  const orders = useMemo(() => ordersQuery.data ?? [], [ordersQuery.data])
  const entries = useMemo(() => buildEntries(tablesQuery.data, orders), [tablesQuery.data, orders])
  const readyOrders = orders
    .map((order) => ({ order, ready: summarizeOrder(order).ready }))
    .filter((r) => r.ready > 0)
    .sort((a, b) => (a.order.tableNumber ?? 0) - (b.order.tableNumber ?? 0))

  const loading = ordersQuery.isPending || (tablesQuery.isPending && !floorForbidden)
  const failed = ordersQuery.error ?? (tablesQuery.error && !floorForbidden ? tablesQuery.error : null)

  return (
    <div className="space-y-8">
      <header>
        <p className="font-mono text-[11px] tracking-[0.18em] text-primary uppercase">Service</p>
        <h1 className="mt-3 text-4xl leading-[1.05] font-light sm:text-5xl">Orders</h1>
        <p className="mt-3 text-[15px] text-muted-foreground" aria-live="polite">
          {loading || failed
            ? 'Every seated table and what it has ordered.'
            : `${orders.length} open ${orders.length === 1 ? 'order' : 'orders'}${
                readyOrders.length
                  ? ` · ${readyOrders.length} ${readyOrders.length === 1 ? 'table has' : 'tables have'} food ready`
                  : ''
              }`}
        </p>
      </header>

      <AnimatePresence initial={false}>
        {readyOrders.length > 0 && (
          <motion.section
            key="pass"
            aria-labelledby="pass-heading"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-primary/40 bg-primary-soft px-4 py-3 sm:px-5">
              <h2 id="pass-heading" className="flex items-center gap-2 font-sans text-sm font-semibold tracking-normal text-primary">
                <BellRing className="size-4" aria-hidden="true" />
                At the pass
              </h2>
              <ul className="flex flex-wrap gap-2">
                {readyOrders.map(({ order, ready }) => (
                  <li key={order.id}>
                    <Button asChild size="sm" className="h-9">
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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4" role="status" aria-label="Loading orders">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : failed ? (
        <EmptyState
          icon={CircleAlert}
          title="Orders didn’t load"
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
              : 'Once a host seats guests, their tables appear here so you can start the order.'
          }
        />
      ) : (
        <ul aria-label="Seated tables" className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 2xl:grid-cols-5">
          <AnimatePresence initial={false} mode="popLayout">
            {entries.map((entry) => (
              <motion.li
                key={entry.key}
                layout
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.15 } }}
                transition={{ duration: 0.22, ease: EASE }}
              >
                <OrderTableCard tableNumber={entry.tableNumber} tableId={entry.tableId} order={entry.order} now={now} />
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
