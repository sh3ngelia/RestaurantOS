import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ArrowLeft, CircleAlert, CircleCheck, Lock, RefreshCw, X } from 'lucide-react'
import { toast } from 'sonner'

import { ApiError, getErrorMessage } from '@/api/errors'
import type { MenuItem } from '@/api/menu'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/components/PageHeader'
import { StatusChip } from '@/components/StatusChip'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useNow } from '@/hooks/useNow'
import { formatElapsed, formatTime } from '@/lib/dates'
import { segmentClass, segmentGroupClass } from '@/lib/controls'
import { formatPrice } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useRealtime } from '@/realtime/useRealtime'
import { AddItemSheet } from './components/AddItemSheet'
import { MenuBrowser } from './components/MenuBrowser'
import { Ticket } from './components/Ticket'
import { notifyOrderError, useOrder, useOrderAction } from './hooks'
import { useOrderPermissions } from './permissions'
import { canCancelOrder, closeBlocker, draftItems, isOpen, summarizeOrder } from './rules'

type Pane = 'menu' | 'ticket'

/** The waiter's order screen: menu on the left, the live ticket on the right. */
export function OrderPage() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const now = useNow(30_000)
  const permissions = useOrderPermissions()
  const query = useOrder(orderId)
  const order = query.data
  const { acknowledgeReady } = useRealtime()
  // Opening the order counts as having seen its "just ready" highlight on the overview.
  useEffect(() => {
    if (orderId) acknowledgeReady(orderId)
  }, [orderId, acknowledgeReady])
  useDocumentTitle(order?.tableNumber ? `Table ${order.tableNumber}` : 'Order')

  const orderAction = useOrderAction()
  const [picked, setPicked] = useState<{ open: boolean; item: MenuItem | null; pickId: number }>({
    open: false,
    item: null,
    pickId: 0,
  })
  const [cancelOpen, setCancelOpen] = useState(false)
  const [pane, setPane] = useState<Pane>('menu')

  if (query.isPending) {
    return (
      <div className="space-y-5" role="status" aria-label="Loading the order">
        <Skeleton className="h-10 w-56" />
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_22rem]">
          <Skeleton className="h-96 rounded-md" />
          <Skeleton className="h-96 rounded-md" />
        </div>
      </div>
    )
  }

  if (query.isError || !order) {
    const missing = query.error instanceof ApiError && query.error.status === 404
    return (
      <EmptyState
        icon={CircleAlert}
        title={missing ? 'Order not found' : 'Couldn’t load the order'}
        description={missing ? 'It may have been cancelled or closed elsewhere.' : getErrorMessage(query.error)}
        action={
          <>
            <Button asChild variant="outline">
              <Link to="/m/orders">
                <ArrowLeft aria-hidden="true" />
                All orders
              </Link>
            </Button>
            {!missing && (
              <Button variant="outline" onClick={() => void query.refetch()}>
                <RefreshCw aria-hidden="true" />
                Try again
              </Button>
            )}
          </>
        }
      />
    )
  }

  const open = isOpen(order)
  const blocker = closeBlocker(order)
  const drafts = draftItems(order).length
  const { ready } = summarizeOrder(order)

  function closeOrder() {
    if (!order || blocker) return
    orderAction.mutate(
      { order, action: { type: 'close' } },
      {
        onSuccess: (closed) => {
          toast.success(`Order #${closed.orderNumber} closed`, { description: `Table ${closed.tableNumber} · ${formatPrice(closed.totalAmount)}` })
          navigate('/m/orders')
        },
        onError: (error) => notifyOrderError(error, "Couldn't close the order"),
      },
    )
  }

  async function cancelOrder() {
    if (!order) return
    try {
      const cancelled = await orderAction.mutateAsync({ order, action: { type: 'cancel' } })
      toast.success(`Order #${cancelled.orderNumber} cancelled`)
      navigate('/m/orders')
    } catch (error) {
      notifyOrderError(error, "Couldn't cancel the order")
      throw error
    }
  }

  return (
    <div className="space-y-4">
      <Button asChild variant="ghost" size="sm" className="-ml-3 text-muted-foreground">
        <Link to="/m/orders">
          <ArrowLeft aria-hidden="true" />
          All orders
        </Link>
      </Button>

      <PageHeader
        title={order.tableNumber !== null ? `Table ${order.tableNumber}` : 'Order'}
        description={
          <>
            Order #{order.orderNumber} · opened {formatTime(new Date(order.createdAt))}
            {open && ` · ${formatElapsed(order.createdAt, now)}`}
          </>
        }
        actions={
          open && (
            <>
              {canCancelOrder(order) && (
                <Button variant="outline" onClick={() => setCancelOpen(true)}>
                  <X aria-hidden="true" />
                  Cancel order
                </Button>
              )}
              {blocker ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    {/* A disabled button can't show a tooltip, so the wrapper takes focus and hover. */}
                    <span tabIndex={0} className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <Button disabled aria-describedby="close-blocker" className="pointer-events-none">
                        <Lock aria-hidden="true" />
                        Close order
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-60">{blocker}</TooltipContent>
                </Tooltip>
              ) : (
                <Button onClick={closeOrder} disabled={orderAction.isPending}>
                  <CircleCheck aria-hidden="true" />
                  Close order
                </Button>
              )}
              {blocker && (
                <span id="close-blocker" className="sr-only">
                  {blocker}
                </span>
              )}
            </>
          )
        }
      />

      {!open && (
        <p className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2.5 text-sm text-muted-foreground">
          <Lock className="size-4" aria-hidden="true" />
          This order is {order.status === 'Closed' ? 'closed' : 'cancelled'}. The ticket is read-only.
        </p>
      )}

      {/* Phones: one pane at a time. */}
      {open && (
        <div role="group" aria-label="Show" className={cn(segmentGroupClass, 'grid-cols-2 md:hidden')}>
          {(['menu', 'ticket'] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={pane === value}
              onClick={() => setPane(value)}
              className={segmentClass(pane === value, 'inline-flex items-center justify-center gap-1.5')}
            >
              {value === 'menu' ? 'Menu' : `Ticket · ${formatPrice(order.totalAmount)}`}
              {value === 'ticket' && (drafts > 0 || ready > 0) && (
                <StatusChip tone={ready ? 'attention' : 'neutral'}>{ready ? `${ready} ready` : `${drafts} new`}</StatusChip>
              )}
            </button>
          ))}
        </div>
      )}

      <div className={cn('gap-4', open ? 'md:grid md:grid-cols-[minmax(0,1fr)_22rem] lg:grid-cols-[minmax(0,1fr)_26rem]' : 'mx-auto max-w-xl')}>
        {open && (
          <div className={cn(pane !== 'menu' && 'hidden md:block')}>
            <MenuBrowser onPick={(item) => setPicked((s) => ({ open: true, item, pickId: s.pickId + 1 }))} />
          </div>
        )}
        <Ticket
          order={order}
          permissions={permissions}
          className={cn(
            'md:sticky md:top-[4.5rem] md:max-h-[calc(100dvh-5.5rem)]',
            open && pane !== 'ticket' && 'hidden md:flex',
          )}
        />
      </div>

      <AddItemSheet
        order={order}
        item={picked.item}
        pickId={picked.pickId}
        open={picked.open}
        onOpenChange={(next) => setPicked((s) => ({ ...s, open: next }))}
      />
      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title={`Cancel order #${order.orderNumber}?`}
        description="Nothing has been sent to the kitchen or bar yet, so the whole ticket is discarded."
        confirmLabel="Cancel order"
        onConfirm={cancelOrder}
      />
    </div>
  )
}
