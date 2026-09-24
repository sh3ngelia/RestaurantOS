import type { ReactNode } from 'react'
import { Pencil, Timer, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import type { MenuItem } from '@/api/menu'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { notifyMenuError, useSetAvailability } from '../hooks'
import type { MenuPermissions } from '../permissions'
import { STATION_ICONS } from '../stations'
import { PriceEditor } from './PriceEditor'

interface MenuItemCardProps {
  item: MenuItem
  permissions: MenuPermissions
  onEdit: (item: MenuItem) => void
  onDelete: (item: MenuItem) => void
}

export function MenuItemCard({ item, permissions, onEdit, onDelete }: MenuItemCardProps) {
  const StationIcon = STATION_ICONS[item.preparationStation]
  const off = !item.isAvailable
  const nameId = `menu-item-${item.id}`
  const hasFooter = permissions.canToggleAvailability || permissions.canManage

  return (
    <article
      aria-labelledby={nameId}
      className={cn(
        'surface-edge relative flex h-full flex-col rounded-xl border bg-card p-4 transition-[background-color,border-color] duration-200 sm:p-5',
        off ? 'border-dashed border-border-strong bg-card/45 shadow-none' : 'border-border',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h3
          id={nameId}
          className={cn(
            'min-w-0 pt-0.5 text-lg leading-snug font-normal text-balance break-words',
            off && 'text-muted-foreground line-through decoration-primary/70 decoration-2',
          )}
        >
          {item.name}
          {off && <span className="sr-only"> (unavailable)</span>}
        </h3>
        <PriceEditor item={item} editable={permissions.canManage} muted={off} />
      </div>

      {item.description && (
        <p className={cn('mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground', off && 'opacity-70')}>
          {item.description}
        </p>
      )}

      <div className={cn('mt-4 flex flex-wrap items-center gap-2', !hasFooter && 'mt-auto pt-4')}>
        <Badge variant="outline" size="sm">
          <StationIcon aria-hidden="true" />
          {item.preparationStation}
        </Badge>
        <Badge variant="muted" size="sm">
          <Timer aria-hidden="true" />
          {item.preparationTimeInMinutes} min
          <span className="sr-only"> preparation</span>
        </Badge>
        {off && <EightySixStamp />}
      </div>

      {hasFooter && (
        <div className="mt-auto pt-4">
          <div className="flex min-h-8 items-center justify-between gap-2 border-t border-border pt-3">
            {permissions.canToggleAvailability ? <AvailabilityToggle item={item} /> : <span />}
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

/** "86" is kitchen shorthand for "we're out of it". */
function EightySixStamp() {
  return (
    <span
      title="Unavailable right now"
      className="-rotate-3 rounded-[3px] border-2 border-primary/80 px-1.5 font-mono text-[11px] leading-4 font-semibold tracking-wider text-primary"
    >
      86’d
    </span>
  )
}

function AvailabilityToggle({ item }: { item: MenuItem }) {
  const setAvailability = useSetAvailability()

  function change(isAvailable: boolean) {
    setAvailability.mutate(
      { item, isAvailable },
      {
        onSuccess: (updated) =>
          toast(updated.isAvailable ? `${updated.name} is back on` : `${updated.name} is 86’d`, {
            description: updated.isAvailable ? 'Every station can sell it again.' : 'Marked unavailable for every station.',
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
    <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-muted-foreground select-none">
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
