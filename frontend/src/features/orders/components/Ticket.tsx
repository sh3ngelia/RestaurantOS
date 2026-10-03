import { useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChefHat, Flame, HandPlatter, LoaderCircle, Play, Send, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'

import { COURSES, type ItemAction, type Order, type OrderItem } from '@/api/orders'
import { AllergenBadges } from '@/components/AllergenBadges'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { QuantityStepper } from '@/components/QuantityStepper'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatPrice } from '@/lib/format'
import { collapseMotion } from '@/lib/motion'
import { STATUS_TONE_CLASSES } from '@/lib/status-tones'
import { cn } from '@/lib/utils'
import { notifyOrderError, useOrderAction, type OrderAction } from '../hooks'
import type { OrderPermissions } from '../permissions'
import {
  COURSE_LABELS,
  canCancelItem,
  canMarkReady,
  canServe,
  canStart,
  draftItems,
  isEditable,
  isOpen,
  nextHeldCourse,
} from '../rules'
import { ItemStatusChip } from './ItemStatusChip'

const ITEM_ACTIONS: readonly ItemAction[] = ['serve', 'start', 'ready', 'cancel']

/** In-flight key for actions that wait for the server; null for optimistic ones. */
function busyKey(action: OrderAction): string | null {
  if (action.type === 'send' || action.type === 'fireNext') return action.type
  if (action.type === 'item') return `${action.itemId}:${action.action}`
  return null
}

interface TicketProps {
  order: Order
  permissions: OrderPermissions
  className?: string
}

export function Ticket({ order, permissions, className }: TicketProps) {
  const orderAction = useOrderAction()
  const [cancelling, setCancelling] = useState<{ open: boolean; item: OrderItem | null }>({ open: false, item: null })
  // Status changes wait for the server's answer; these keys mark what's in flight.
  const [busy, setBusy] = useState<ReadonlySet<string>>(() => new Set())
  const editable = isOpen(order)
  const drafts = draftItems(order)
  const nextCourse = nextHeldCourse(order)
  const lineCount = order.items.filter((i) => i.status !== 'Cancelled').length

  function act(action: OrderAction, success?: string, failure = "Couldn't update the ticket") {
    return orderAction.mutateAsync({ order, action }).then(
      () => {
        if (success) toast.success(success)
      },
      (error: unknown) => {
        notifyOrderError(error, failure)
        throw error
      },
    )
  }

  /** Fire-and-forget for taps that report their own errors. */
  const tap = (action: OrderAction, success?: string, failure?: string) => {
    const key = busyKey(action)
    if (key) setBusy((current) => new Set(current).add(key))
    act(action, success, failure)
      .catch(() => {
        // Reported by act(); any optimistic change has been rolled back.
      })
      .finally(() => {
        if (!key) return
        setBusy((current) => {
          const next = new Set(current)
          next.delete(key)
          return next
        })
      })
  }

  // Drinks first (every item on a Bar-type station, whatever its course), then kitchen items by course.
  const sections = [
    { key: 'drinks', label: 'Drinks', course: null, lines: order.items.filter((i) => i.stationType === 'Bar') },
    ...COURSES.map((course) => ({
      key: course,
      label: COURSE_LABELS[course].many,
      course,
      lines: order.items.filter((i) => i.stationType !== 'Bar' && i.course === course),
    })),
  ].filter((section) => section.lines.length > 0)

  return (
    <section
      aria-labelledby="ticket-heading"
      className={cn('flex min-h-0 flex-col rounded-md border border-border bg-card', className)}
    >
      <div className="flex items-baseline justify-between gap-3 border-b border-border px-4 py-2.5">
        <h2 id="ticket-heading" className="text-sm font-semibold">
          Ticket
        </h2>
        <p className="text-sm text-muted-foreground tabular-nums">
          {lineCount} {lineCount === 1 ? 'line' : 'lines'}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4">
        {order.items.length === 0 ? (
          <p className="py-10 text-center text-sm text-balance text-muted-foreground">
            {editable ? 'Tap a dish on the menu to start the ticket.' : 'Nothing was ordered.'}
          </p>
        ) : (
          sections.map(({ key, label, course, lines }) => {
            return (
              <div key={key} className="py-3 [&+&]:border-t [&+&]:border-border">
                <h3 className="mb-1 flex items-center justify-between text-xs font-medium text-muted-foreground">
                  {label}
                  {course !== null && order.currentCourse === course && editable && (
                    <span className="text-status-active">On now</span>
                  )}
                </h3>
                <ul className="divide-y divide-border">
                  <AnimatePresence initial={false}>
                    {lines.map((item) => (
                      <motion.li key={item.id} layout="position" {...collapseMotion} className="overflow-hidden">
                        <TicketLine
                          item={item}
                          editable={editable}
                          permissions={permissions}
                          busyAction={ITEM_ACTIONS.find((a) => busy.has(`${item.id}:${a}`))}
                          onQuantity={(quantity) => tap({ type: 'quantity', itemId: item.id, quantity })}
                          onRemove={() => tap({ type: 'remove', itemId: item.id }, undefined, `Couldn't remove ${item.name}`)}
                          onServe={() => tap({ type: 'item', itemId: item.id, action: 'serve' }, `${item.name} served`)}
                          onStart={() => tap({ type: 'item', itemId: item.id, action: 'start' })}
                          onReady={() => tap({ type: 'item', itemId: item.id, action: 'ready' }, `${item.name} is ready`)}
                          onCancel={() => setCancelling({ open: true, item })}
                        />
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              </div>
            )
          })
        )}
      </div>

      <div className="space-y-2.5 border-t border-border px-4 py-3">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-lg font-semibold tabular-nums">{formatPrice(order.totalAmount)}</span>
        </div>
        {editable && (
          <div className="flex flex-col gap-2 sm:flex-row md:flex-col lg:flex-row">
            {nextCourse && (
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                disabled={busy.has('fireNext')}
                aria-busy={busy.has('fireNext')}
                onClick={() =>
                  tap({ type: 'fireNext' }, `${COURSE_LABELS[nextCourse].many} fired`, "Couldn't fire the next course")
                }
              >
                {busy.has('fireNext') ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Flame aria-hidden="true" />}
                Fire {COURSE_LABELS[nextCourse].many.toLowerCase()}
              </Button>
            )}
            <Button
              size="lg"
              className="flex-1"
              disabled={drafts.length === 0 || busy.has('send')}
              aria-busy={busy.has('send')}
              onClick={() =>
                tap(
                  { type: 'send' },
                  `${drafts.length} ${drafts.length === 1 ? 'item' : 'items'} sent`,
                  "Couldn't send the ticket",
                )
              }
            >
              {busy.has('send') ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Send aria-hidden="true" />}
              {busy.has('send') ? 'Sending…' : drafts.length > 0 ? `Send ${drafts.length}` : 'Nothing to send'}
            </Button>
          </div>
        )}
      </div>

      {cancelling.item && (
        <ConfirmDialog
          open={cancelling.open}
          onOpenChange={(open) => setCancelling((s) => ({ ...s, open }))}
          title={`Cancel ${cancelling.item.quantity} × ${cancelling.item.name}?`}
          description={
            cancelling.item.status === 'Held'
              ? 'It has not been fired yet, so the kitchen will simply never start it.'
              : 'It has already gone to the station. Let them know it is no longer needed.'
          }
          confirmLabel="Cancel item"
          onConfirm={() => {
            const target = cancelling.item as OrderItem
            return act(
              { type: 'item', itemId: target.id, action: 'cancel' },
              `${target.name} cancelled`,
              `Couldn't cancel ${target.name}`,
            )
          }}
        />
      )}
    </section>
  )
}

interface TicketLineProps {
  item: OrderItem
  editable: boolean
  permissions: OrderPermissions
  /** The item action waiting for the server, if any; the line's other actions pause meanwhile. */
  busyAction?: ItemAction
  onQuantity: (quantity: number) => void
  onRemove: () => void
  onServe: () => void
  onStart: () => void
  onReady: () => void
  onCancel: () => void
}

function TicketLine({ item, editable, permissions, busyAction, onQuantity, onRemove, onServe, onStart, onReady, onCancel }: TicketLineProps) {
  const pending = busyAction !== undefined
  const icon = (action: ItemAction, idle: ReactNode) =>
    busyAction === action ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : idle
  const draft = editable && isEditable(item)
  const done = item.status === 'Served' || item.status === 'Cancelled'
  const ready = item.status === 'Ready'

  return (
    <div className={cn('py-2.5', ready && cn('-mx-2 rounded-md border px-2', STATUS_TONE_CLASSES.attention.surface))}>
      <div className="flex items-start gap-2.5">
        <span className={cn('w-7 shrink-0 text-sm font-semibold tabular-nums', done && 'text-muted-foreground')}>
          {item.quantity}×
        </span>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'flex items-center gap-1.5 text-sm leading-snug font-medium',
              done && 'text-muted-foreground',
              item.status === 'Cancelled' && 'line-through',
            )}
          >
            <span className="min-w-0 break-words">{item.name}</span>
          </p>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            <span className="text-xs">
              <span className="sr-only">Station: </span>
              {item.stationName}
            </span>
            {item.seatNumber !== null && (
              <>
                <span aria-hidden="true"> · </span>
                <span className="font-medium text-foreground/80">Seat {item.seatNumber}</span>
              </>
            )}
            {item.notes && (
              <>
                <span aria-hidden="true"> · </span>
                <span>{item.notes}</span>
              </>
            )}
          </p>
          <AllergenBadges allergens={item.allergens} className="mt-1.5" />
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <ItemStatusChip status={item.status} />
          <span className={cn('text-[13px] tabular-nums', done ? 'text-muted-foreground' : 'text-foreground/85')}>
            {formatPrice(item.totalPrice)}
          </span>
        </div>
      </div>

      {editable && !done && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-9.5">
          {draft && (
            <>
              <QuantityStepper label={`Quantity of ${item.name}`} value={item.quantity} onChange={onQuantity} />
              <LineIconButton label={`Remove ${item.name}`} onClick={onRemove} destructive>
                <Trash2 aria-hidden="true" />
              </LineIconButton>
            </>
          )}
          {canServe(item) && (
            <Button size="sm" onClick={onServe} disabled={pending} aria-busy={busyAction === 'serve'}>
              {icon('serve', <HandPlatter aria-hidden="true" />)}
              Serve
            </Button>
          )}
          {permissions.canProduce && canStart(item) && (
            <Button size="sm" variant="outline" onClick={onStart} disabled={pending} aria-busy={busyAction === 'start'}>
              {icon('start', <Play aria-hidden="true" />)}
              Start
            </Button>
          )}
          {permissions.canProduce && canMarkReady(item) && (
            <Button size="sm" variant="outline" onClick={onReady} disabled={pending} aria-busy={busyAction === 'ready'}>
              {icon('ready', <ChefHat aria-hidden="true" />)}
              Mark ready
            </Button>
          )}
          {canCancelItem(item) && (
            <Button
              size="sm"
              variant="ghost"
              className="ml-auto text-muted-foreground hover:text-destructive"
              onClick={onCancel}
              disabled={pending}
            >
              <X aria-hidden="true" />
              Cancel item
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

function LineIconButton({
  label,
  onClick,
  destructive = false,
  children,
}: {
  label: string
  onClick: () => void
  destructive?: boolean
  children: ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('text-muted-foreground', destructive && 'hover:bg-destructive/10 hover:text-destructive')}
          onClick={onClick}
          aria-label={label}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
