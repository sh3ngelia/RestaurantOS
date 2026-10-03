import type { ReactNode } from 'react'
import { Ellipsis, LoaderCircle, Pencil, Power, PowerOff, Trash2 } from 'lucide-react'

import type { Station } from '@/api/stations'
import { StatusChip } from '@/components/StatusChip'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { STATION_ICONS } from '../icons'

/** Column template shared by the rows and the header; below desktop a row stacks. */
const ROW_GRID =
  'grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 lg:grid-cols-[minmax(0,1fr)_6rem_9rem_4.5rem_4.5rem_6rem_2.5rem] lg:items-center'

/** Column labels above the list, on desktop where the rows read as a table. */
export function StationRowHeader() {
  return (
    <div aria-hidden="true" className={cn(ROW_GRID, 'hidden px-3 py-2 text-xs text-muted-foreground lg:grid')}>
      <span>Station</span>
      <span>Type</span>
      <span>Fires immediately</span>
      <span>Order</span>
      <span>Items</span>
      <span>Status</span>
      <span />
    </div>
  )
}

interface StationRowProps {
  station: Station
  /** Menu items on this station, or null while the menu is loading. */
  itemCount: number | null
  /** An activate/deactivate request for this station is in flight. */
  busy: boolean
  onEdit: () => void
  onToggleActive: () => void
  onDelete: () => void
}

export function StationRow({ station, itemCount, busy, onEdit, onToggleActive, onDelete }: StationRowProps) {
  const Icon = STATION_ICONS[station.type]
  const inactive = !station.isActive
  const nameId = `station-${station.id}`
  const items = itemCount === null ? '—' : String(itemCount)
  // Mirrors the API's 409: a station that menu items still use can't be deactivated.
  const deactivateBlocker =
    station.isActive && itemCount
      ? `${itemCount} menu ${itemCount === 1 ? 'item uses' : 'items use'} this station. Move ${itemCount === 1 ? 'it' : 'them'} to another station first.`
      : null

  return (
    <article aria-labelledby={nameId} className={cn(ROW_GRID, 'px-3 py-2.5')}>
      <div className="flex min-w-0 items-center gap-2">
        <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <h3 id={nameId} className={cn('truncate text-sm font-medium', inactive && 'text-muted-foreground')}>
          {station.name}
        </h3>
        <StationStatus station={station} className="lg:hidden" />
      </div>

      {/* Below desktop these sit on one line under the name; on desktop they become columns. */}
      <dl className="col-start-1 row-start-2 flex flex-wrap gap-x-3 gap-y-0.5 pl-6 text-[13px] text-muted-foreground lg:contents">
        <div>
          <dt className="sr-only">Type</dt>
          <dd>{station.type}</dd>
        </div>
        <div>
          <dt className="sr-only">Fires immediately</dt>
          <dd className={cn(station.firesImmediately && 'text-foreground')}>
            <span className="hidden lg:inline">{station.firesImmediately ? 'Yes' : 'No'}</span>
            <span className="lg:hidden">{station.firesImmediately ? 'Fires immediately' : 'Fires with its course'}</span>
          </dd>
        </div>
        <div>
          <dt className="sr-only">Display order</dt>
          <dd className="tabular-nums">
            <span className="lg:hidden">Order </span>
            {station.displayOrder}
          </dd>
        </div>
        <div>
          <dt className="sr-only">Menu items</dt>
          <dd className="tabular-nums">
            {items}
            <span className="lg:hidden"> {itemCount === 1 ? 'item' : 'items'}</span>
          </dd>
        </div>
      </dl>

      <div className="hidden lg:flex">
        <StationStatus station={station} />
      </div>

      <div className="col-start-2 row-span-2 row-start-1 flex items-center justify-end lg:col-start-auto lg:row-span-1 lg:row-start-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground"
              disabled={busy}
              aria-busy={busy}
              aria-label={`Actions for ${station.name}`}
            >
              {busy ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Ellipsis aria-hidden="true" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onSelect={onEdit}>
              <Pencil aria-hidden="true" />
              Edit station
            </DropdownMenuItem>
            {inactive ? (
              <DropdownMenuItem onSelect={onToggleActive}>
                <Power aria-hidden="true" />
                Activate
              </DropdownMenuItem>
            ) : (
              <GuardedItem icon={<PowerOff aria-hidden="true" />} label="Deactivate" blocker={deactivateBlocker} onSelect={onToggleActive} />
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={onDelete}>
              <Trash2 aria-hidden="true" />
              Delete station
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </article>
  )
}

function StationStatus({ station, className }: { station: Station; className?: string }) {
  return station.isActive ? (
    <StatusChip tone="active" dot className={className}>
      Active
    </StatusChip>
  ) : (
    <StatusChip tone="muted" dashed dot className={className}>
      Inactive
    </StatusChip>
  )
}

/** Soft-disabled rather than `disabled`, so it stays focusable and its tooltip can say why. */
function GuardedItem({
  icon,
  label,
  blocker,
  onSelect,
}: {
  icon: ReactNode
  label: string
  blocker: string | null
  onSelect: () => void
}) {
  if (!blocker) {
    return (
      <DropdownMenuItem onSelect={onSelect}>
        {icon}
        {label}
      </DropdownMenuItem>
    )
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <DropdownMenuItem
          aria-disabled="true"
          onSelect={(event) => event.preventDefault()}
          className="cursor-not-allowed text-muted-foreground opacity-60 focus:bg-transparent"
        >
          {icon}
          {label}
          <span className="sr-only">, unavailable: {blocker}</span>
        </DropdownMenuItem>
      </TooltipTrigger>
      <TooltipContent side="left" className="max-w-60">
        {blocker}
      </TooltipContent>
    </Tooltip>
  )
}
