import { Link, useNavigate } from 'react-router'
import { ArrowUpRight, Eraser, LoaderCircle, Plus } from 'lucide-react'
import { toast } from 'sonner'

import type { Order } from '@/api/orders'
import { Button } from '@/components/ui/button'
import { formatElapsed } from '@/lib/dates'
import { cn } from '@/lib/utils'
import { useSession } from '@/features/auth/useAuth'
import { notifyTableError, useClearTable } from '@/features/tables/hooks'
import { getTablePermissions } from '@/features/tables/permissions'
import { notifyOrderError, useStartOrder } from '../hooks'
import { summarizeOrder } from '../rules'
import { OrderHeadline, OrderStatusLine } from './OrderSummary'

interface OrderTableCardProps {
  tableNumber: number
  /** The table's id; needed to start an order. Absent when the floor isn't readable. */
  tableId?: string
  order?: Order
  now: Date
}

export function OrderTableCard({ tableNumber, tableId, order, now }: OrderTableCardProps) {
  if (order) return <OpenOrderCard tableNumber={tableNumber} order={order} now={now} />
  return <StartOrderCard tableNumber={tableNumber} tableId={tableId} />
}

function OpenOrderCard({ tableNumber, order, now }: { tableNumber: number; order: Order; now: Date }) {
  const { ready } = summarizeOrder(order)
  return (
    <Link
      to={`/m/orders/${order.id}`}
      aria-label={`Table ${tableNumber}, order ${order.orderNumber}${ready ? `, ${ready} ready to serve` : ''}. Open the ticket`}
      className={cn(
        'group surface-edge relative flex h-full min-h-44 flex-col rounded-2xl border p-4 outline-none sm:p-5',
        'transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        ready
          ? 'border-primary bg-primary-soft shadow-[0_14px_36px_-16px_var(--primary)]'
          : 'border-border bg-card hover:border-primary/30',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-[10.5px] tracking-[0.16em] text-muted-foreground uppercase">Table</p>
          <p className="mt-0.5 font-serif text-4xl leading-none tabular-nums">{tableNumber}</p>
        </div>
        <span className="flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
          {formatElapsed(order.createdAt, now)}
          <ArrowUpRight
            className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            aria-hidden="true"
          />
        </span>
      </div>
      <div className="mt-auto space-y-2.5 pt-5">
        <OrderHeadline order={order} />
        <OrderStatusLine order={order} />
      </div>
    </Link>
  )
}

function StartOrderCard({ tableNumber, tableId }: { tableNumber: number; tableId?: string }) {
  const start = useStartOrder()
  const navigate = useNavigate()
  const clear = useClearTable()
  const { canClear } = getTablePermissions(useSession().role)

  function clearTable() {
    if (!tableId) return
    // mutateAsync: clearing removes this card from the grid, unmounting it before callbacks would run.
    clear.mutateAsync(tableId).then(
      () => toast.success(`Table ${tableNumber} is free again`, { description: 'It no longer appears on this screen.' }),
      (error: unknown) => notifyTableError(error, `Couldn't clear table ${tableNumber}`),
    )
  }

  function startOrder() {
    if (!tableId) return
    // mutateAsync, not mutate callbacks: storing the new order swaps this card for the
    // open-order card, unmounting it, and per-call callbacks don't run after unmount.
    start.mutateAsync(tableId).then(
      (order) => navigate(`/m/orders/${order.id}`),
      (error: unknown) => notifyOrderError(error, `Couldn't start an order for table ${tableNumber}`),
    )
  }

  return (
    <div className="flex h-full min-h-44 flex-col rounded-2xl border border-dashed border-border-strong bg-card/60 p-4 sm:p-5">
      <p className="font-mono text-[10.5px] tracking-[0.16em] text-muted-foreground uppercase">Table</p>
      <p className="mt-0.5 font-serif text-4xl leading-none tabular-nums">{tableNumber}</p>
      <p className="mt-2 text-sm text-muted-foreground">Seated, no order yet</p>
      <div className="mt-auto grid gap-2 pt-4">
        <Button className="h-11 w-full" onClick={startOrder} disabled={!tableId || start.isPending} aria-busy={start.isPending}>
          {start.isPending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Plus aria-hidden="true" />}
          Start order
        </Button>
        {canClear && tableId && (
          <Button
            variant="outline"
            className="h-11 w-full"
            onClick={clearTable}
            disabled={clear.isPending}
            aria-busy={clear.isPending}
          >
            {clear.isPending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Eraser aria-hidden="true" />}
            Clear table
          </Button>
        )}
      </div>
    </div>
  )
}
