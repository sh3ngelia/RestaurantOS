import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ArrowLeft, CircleAlert, CircleCheck, Lock, RefreshCw, X } from 'lucide-react'
import { toast } from 'sonner'

import { ApiError, getErrorMessage } from '@/api/errors'
import type { MenuItem } from '@/api/menu'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useNow } from '@/hooks/useNow'
import { formatElapsed, formatTime } from '@/lib/dates'
import { formatPrice } from '@/lib/format'
import { cn } from '@/lib/utils'
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
      <div className="space-y-6" role="status" aria-label="Loading the order">
        <Skeleton className="h-14 w-64" />
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_22rem]">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (query.isError || !order) {
    const missing = query.error instanceof ApiError && query.error.status === 404
    return (
      <EmptyState
        icon={CircleAlert}
        title={missing ? 'Order not found' : 'The order didn’t load'}
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
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-3 text-muted-foreground">
        <Link to="/m/orders">
          <ArrowLeft aria-hidden="true" />
          All orders
        </Link>
      </Button>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[11px] tracking-[0.16em] text-primary uppercase tabular-nums">
            Order #{order.orderNumber} · opened {formatTime(new Date(order.createdAt))}
            {open && ` · ${formatElapsed(order.createdAt, now)}`}
          </p>
          <h1 className="mt-2 text-4xl leading-[1.05] font-light sm:text-5xl">
            {order.tableNumber !== null ? `Table ${order.tableNumber}` : 'Order'}
          </h1>
        </div>

        {open && (
          <div className="flex flex-wrap gap-2">
            {canCancelOrder(order) && (
              <Button variant="outline" size="lg" onClick={() => setCancelOpen(true)}>
                <X aria-hidden="true" />
                Cancel order
              </Button>
            )}
            {blocker ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  {/* A disabled button can't show a tooltip, so the wrapper takes focus and hover. */}
                  <span tabIndex={0} className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <Button size="lg" disabled aria-describedby="close-blocker" className="pointer-events-none">
                      <Lock aria-hidden="true" />
                      Close order
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-60">{blocker}</TooltipContent>
              </Tooltip>
            ) : (
              <Button size="lg" onClick={closeOrder} disabled={orderAction.isPending}>
                <CircleCheck aria-hidden="true" />
                Close order
              </Button>
            )}
            {blocker && (
              <span id="close-blocker" className="sr-only">
                {blocker}
              </span>
            )}
          </div>
        )}
      </header>

      {!open && (
        <p className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          <Lock className="size-4" aria-hidden="true" />
          This order is {order.status === 'Closed' ? 'closed' : 'cancelled'}. The ticket is read-only.
        </p>
      )}

      {/* Phones: one pane at a time. */}
      {open && (
        <div role="group" aria-label="Show" className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-card p-1 md:hidden">
          {(['menu', 'ticket'] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={pane === value}
              onClick={() => setPane(value)}
              className={cn(
                'h-11 rounded-lg text-sm font-medium text-muted-foreground outline-none transition-colors',
                'focus-visible:ring-2 focus-visible:ring-ring',
                pane === value && 'bg-accent text-foreground',
              )}
            >
              {value === 'menu' ? 'Menu' : `Ticket · ${formatPrice(order.totalAmount)}`}
              {value === 'ticket' && (drafts > 0 || ready > 0) && (
                <span className={cn('ml-1.5 rounded-full px-1.5 text-xs', ready ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                  {ready ? `${ready} ready` : `${drafts} new`}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      <div className={cn('gap-6', open ? 'md:grid md:grid-cols-[minmax(0,1fr)_22rem] lg:grid-cols-[minmax(0,1fr)_26rem]' : 'mx-auto max-w-xl')}>
        {open && (
          <div className={cn(pane !== 'menu' && 'hidden md:block')}>
            <MenuBrowser onPick={(item) => setPicked((s) => ({ open: true, item, pickId: s.pickId + 1 }))} />
          </div>
        )}
        <Ticket
          order={order}
          permissions={permissions}
          className={cn(
            'md:sticky md:top-20 md:max-h-[calc(100dvh-6rem)]',
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
