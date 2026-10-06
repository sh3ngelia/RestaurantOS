import { Link, useNavigate } from 'react-router'
import { Eraser, LoaderCircle, Plus } from 'lucide-react'
import { toast } from 'sonner'

import type { Order } from '@/api/orders'
import { StatusChip } from '@/components/StatusChip'
import { Button } from '@/components/ui/button'
import { formatElapsed } from '@/lib/dates'
import { STATUS_TONE_CLASSES } from '@/lib/status-tones'
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
  /** The kitchen has just marked an item ready (live event): highlight until it's seen. */
  justReady?: boolean
}

export function OrderTableCard({ tableNumber, tableId, order, now, justReady = false }: OrderTableCardProps) {
  if (order) return <OpenOrderCard tableNumber={tableNumber} order={order} now={now} justReady={justReady} />
  return <StartOrderCard tableNumber={tableNumber} tableId={tableId} />
}

function OpenOrderCard({ tableNumber, order, now, justReady }: { tableNumber: number; order: Order; now: Date; justReady: boolean }) {
  const { ready } = summarizeOrder(order)
  return (
    <Link
      to={`/m/orders/${order.id}`}
      aria-label={`Table ${tableNumber}, order ${order.orderNumber}${ready ? `, ${ready} ready to serve` : ''}. Open the ticket`}
      className={cn(
        'flex h-full min-h-36 flex-col rounded-md border p-3 outline-none transition-colors duration-150',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        ready ? STATUS_TONE_CLASSES.attention.surface : 'border-border bg-card hover:border-border-strong',
        justReady && 'ring-2 ring-status-attention',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-base leading-tight font-semibold tabular-nums">Table {tableNumber}</p>
        {justReady ? (
          <StatusChip tone="attention">Just ready</StatusChip>
        ) : (
          <span className="text-xs text-muted-foreground tabular-nums">{formatElapsed(order.createdAt, now)}</span>
        )}
      </div>
      <div className="mt-auto space-y-2 pt-4">
        <OrderHeadline order={order} />
        <OrderStatusLine order={order} now={now} />
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
      () => toast.success(`Table ${tableNumber} is free again`),
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
    <div className="flex h-full min-h-36 flex-col rounded-md border border-dashed border-border-strong bg-card p-3">
      <p className="text-base leading-tight font-semibold tabular-nums">Table {tableNumber}</p>
      <p className="mt-1 text-[13px] text-muted-foreground">Seated, no order yet</p>
      <div className="mt-auto grid gap-1.5 pt-3">
        <Button className="w-full" onClick={startOrder} disabled={!tableId || start.isPending} aria-busy={start.isPending}>
          {start.isPending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Plus aria-hidden="true" />}
          Start order
        </Button>
        {canClear && tableId && (
          <Button
            variant="outline"
            className="w-full"
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
