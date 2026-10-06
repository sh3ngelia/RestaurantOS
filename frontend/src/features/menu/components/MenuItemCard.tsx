import type { ReactNode } from 'react'
import { Pencil, Timer, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import type { MenuItem } from '@/api/menu'
import { AllergenBadges } from '@/components/AllergenBadges'
import { StatusChip } from '@/components/StatusChip'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { notifyMenuError, useSetAvailability } from '../hooks'
import { canToggleItem, type MenuPermissions } from '../permissions'
import { STATION_ICONS } from '@/features/stations/icons'
import { PriceEditor } from './PriceEditor'

interface MenuItemCardProps {
  item: MenuItem
  permissions: MenuPermissions
  onEdit: (item: MenuItem) => void
  onDelete: (item: MenuItem) => void
}

export function MenuItemCard({ item, permissions, onEdit, onDelete }: MenuItemCardProps) {
  const StationIcon = STATION_ICONS[item.stationType]
  const off = !item.isAvailable
  const nameId = `menu-item-${item.id}`
  const hasFooter = permissions.canToggleAvailability || permissions.canManage

  return (
    <article
      aria-labelledby={nameId}
      className={cn(
        'relative flex h-full flex-col rounded-md border p-3 transition-[background-color,border-color] duration-150',
        off ? 'border-dashed border-border-strong bg-transparent' : 'border-border bg-card',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h3
          id={nameId}
          className={cn(
            'min-w-0 pt-1 text-sm leading-snug font-medium break-words',
            off && 'text-muted-foreground line-through',
          )}
        >
          {item.name}
          {off && <span className="sr-only"> (unavailable)</span>}
        </h3>
        <PriceEditor item={item} editable={permissions.canManage} muted={off} />
      </div>

      {item.description && (
        <p className={cn('mt-1 line-clamp-2 text-[13px] text-muted-foreground', off && 'opacity-70')}>
          {item.description}
        </p>
      )}

      <div className={cn('mt-2.5 flex flex-wrap items-center gap-1.5', !hasFooter && 'mt-auto pt-2.5')}>
        <Badge variant="outline" size="sm">
          <StationIcon aria-hidden="true" />
          <span className="sr-only">Station: </span>
          {item.stationName}
        </Badge>
        <Badge variant="muted" size="sm">
          <Timer aria-hidden="true" />
          {item.preparationTimeInMinutes} min
          <span className="sr-only"> preparation</span>
        </Badge>
        {off && (
          <StatusChip tone="muted" dashed>
            86’d
          </StatusChip>
        )}
      </div>

      <AllergenBadges allergens={item.allergens} className="mt-2" />

      {hasFooter && (
        <div className="mt-auto pt-3">
          <div className="flex min-h-8 items-center justify-between gap-2 border-t border-border pt-2">
            {canToggleItem(permissions, item) ? (
              <AvailabilityToggle item={item} />
            ) : permissions.canToggleAvailability ? (
              // The other side's item (a drink for the kitchen, a dish for the bar): state only.
              <AvailabilityState item={item} />
            ) : (
              <span />
            )}
            {permissions.canManage && (
              <div className="flex items-center gap-0.5">
                <IconAction label={`Edit ${item.name}`} onClick={() => onEdit(item)}>
                  <Pencil aria-hidden="true" />
                </IconAction>
                <IconAction label={`Delete ${item.name}`} onClick={() => onDelete(item)} destructive>
                  <Trash2 aria-hidden="true" />
                </IconAction>
              </div>
            )}
          </div>
        </div>
      )}
    </article>
  )
}

/** Availability without the switch, for items another station owns. */
function AvailabilityState({ item }: { item: MenuItem }) {
  return (
    <span className="touch-target flex items-center gap-2 text-[13px] text-muted-foreground">
      <span
        className={cn('size-1.5 rounded-full', item.isAvailable ? 'bg-status-active' : 'bg-muted-foreground/50')}
        aria-hidden="true"
      />
      <span className={cn(item.isAvailable && 'text-foreground')}>{item.isAvailable ? 'Available' : 'Unavailable'}</span>
      <span className="sr-only">. Only {item.stationType === 'Bar' ? 'the bar' : 'the kitchen'} can change this.</span>
    </span>
  )
}

/** The 86 switch. Optimistic; a refusal (403 for another station's item, or anything else) rolls back and shows why. */
function AvailabilityToggle({ item }: { item: MenuItem }) {
  const setAvailability = useSetAvailability()

  function change(isAvailable: boolean) {
    setAvailability.mutate(
      { item, isAvailable },
      {
        onSuccess: (updated) =>
          toast(updated.isAvailable ? `${updated.name} is available` : `${updated.name} is 86’d`, {
            description: updated.isAvailable ? 'Available at every station.' : 'Unavailable at every station.',
            action: {
              label: 'Undo',
              onClick: () =>
                setAvailability.mutate(
                  { item: updated, isAvailable: !updated.isAvailable },
                  { onError: (err) => notifyMenuError(err, `Couldn't update ${updated.name}`) },
                ),
            },
          }),
        onError: (err) => notifyMenuError(err, `Couldn't update ${item.name}`),
      },
    )
  }

  return (
    <label className="touch-target flex cursor-pointer items-center gap-2 text-[13px] text-muted-foreground select-none">
      <Switch checked={item.isAvailable} onCheckedChange={change} aria-label={`${item.name} available`} />
      <span aria-hidden="true" className={cn(item.isAvailable && 'text-foreground')}>
        Available
      </span>
    </label>
  )
}

function IconAction({
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
          size="icon-sm"
          onClick={onClick}
          aria-label={label}
          className={cn('text-muted-foreground', destructive ? 'hover:bg-destructive/10 hover:text-destructive' : 'hover:text-foreground')}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
