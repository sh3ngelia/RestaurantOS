import { Link, useNavigate } from 'react-router'
import { ClipboardList, LoaderCircle, Plus } from 'lucide-react'

import type { Order } from '@/api/orders'
import type { DiningTable } from '@/api/tables'
import { notifyOrderError, useStartOrder } from '@/features/orders/hooks'
import { summarizeOrder } from '@/features/orders/rules'
import { cn } from '@/lib/utils'

const actionClass = cn(
  'flex min-h-12 w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left outline-none',
  'transition-colors duration-150 hover:bg-accent focus-visible:bg-accent focus-visible:ring-2 focus-visible:ring-ring',
)

/** "Open order" (or "Start order" on a seated table without one) at the top of the card's actions. */
export function TableOrderLink({ table, order, onNavigate }: { table: DiningTable; order?: Order; onNavigate: () => void }) {
  const start = useStartOrder()
  const navigate = useNavigate()

  if (order) {
    const { ready, items } = summarizeOrder(order)
    return (
      <Link to={`/m/orders/${order.id}`} onClick={onNavigate} className={actionClass}>
        <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-primary/30 bg-primary/15 text-primary">
          <ClipboardList className="size-4" aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-medium">Open order</span>
          <span className="block text-xs text-muted-foreground">
            #{order.orderNumber} · {items} {items === 1 ? 'item' : 'items'}
            {ready > 0 && <span className="font-medium text-primary"> · {ready} ready</span>}
          </span>
        </span>
      </Link>
    )
  }

  function startOrder() {
    // mutateAsync so navigation happens even if the cache update re-renders this away.
    start.mutateAsync(table.id).then(
      (created) => {
        onNavigate()
        navigate(`/m/orders/${created.id}`)
      },
      (error: unknown) => notifyOrderError(error, `Couldn't start an order for table ${table.tableNumber}`),
    )
  }

  return (
    <button type="button" onClick={startOrder} disabled={start.isPending} aria-busy={start.isPending} className={actionClass}>
      <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-primary/30 bg-primary/15 text-primary">
        {start.isPending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium">Start order</span>
        <span className="block text-xs text-muted-foreground">Open a ticket for this table.</span>
      </span>
    </button>
  )
}
