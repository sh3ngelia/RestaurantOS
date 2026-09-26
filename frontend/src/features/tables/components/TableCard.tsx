import { useState } from 'react'
import { Ellipsis, Pencil, Trash2, Users } from 'lucide-react'
import { toast } from 'sonner'

import type { DiningTable, TableAction } from '@/api/tables'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { notifyTableError, useChangeTableStatus } from '../hooks'
import type { TablePermissions } from '../permissions'
import { STATUS_LABELS, STATUS_TONES, TABLE_ACTIONS, actionsFor } from '../status'
import { StatusBadge } from './StatusBadge'
import { TableShape } from './TableShape'

interface TableCardProps {
  table: DiningTable
  permissions: TablePermissions
  onEdit: (table: DiningTable) => void
  onDelete: (table: DiningTable) => void
}

export function TableCard({ table, permissions, onEdit, onDelete }: TableCardProps) {
  const [open, setOpen] = useState(false)
  const changeStatus = useChangeTableStatus()
  const actions = actionsFor(table.status)
  const seats = `${table.capacity} ${table.capacity === 1 ? 'seat' : 'seats'}`

  function run(action: TableAction) {
    setOpen(false)
    changeStatus.mutate(
      { table, action },
      {
        onSuccess: (updated) =>
          toast.success(TABLE_ACTIONS[action].successTitle(updated.tableNumber), {
            description: `${seats} · now ${STATUS_LABELS[updated.status].toLowerCase()}`,
          }),
        onError: (error) => notifyTableError(error, `Couldn't update table ${table.tableNumber}`),
      },
    )
  }

  return (
    <div className={cn('relative h-full rounded-2xl border transition-[background-color,border-color,box-shadow] duration-300', STATUS_TONES[table.status].card)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={`Table ${table.tableNumber}, ${seats}, ${STATUS_LABELS[table.status].toLowerCase()}. Show actions`}
            className={cn(
              'flex h-full min-h-48 w-full flex-col rounded-2xl p-4 text-left outline-none sm:p-5',
              'transition-transform duration-150 active:scale-[0.98]',
              'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-mono text-[10.5px] tracking-[0.16em] text-muted-foreground uppercase">Table</p>
                <p className="mt-0.5 font-serif text-4xl leading-none font-normal tabular-nums">{table.tableNumber}</p>
              </div>
              <StatusBadge status={table.status} />
            </div>

            <TableShape capacity={table.capacity} status={table.status} className="my-4 h-24 w-full" />

            <p className={cn('mt-auto flex items-center gap-1.5 text-sm text-muted-foreground', permissions.canManage && 'pr-10')}>
              <Users className="size-4" aria-hidden="true" />
              {seats}
            </p>
          </button>
        </PopoverTrigger>

        <PopoverContent className="w-68 p-2">
          <div className="flex items-center justify-between gap-3 px-2.5 pt-1.5 pb-2.5">
            <div>
              <p className="font-serif text-xl leading-tight">Table {table.tableNumber}</p>
              <p className="text-xs text-muted-foreground">{seats}</p>
            </div>
            <StatusBadge status={table.status} />
          </div>
          <div className="grid gap-1 border-t border-border pt-2">
            {actions.map((action) => {
              const { icon: Icon, label, description } = TABLE_ACTIONS[action]
              return (
                <button
                  key={action}
                  type="button"
                  onClick={() => run(action)}
                  className={cn(
                    'flex min-h-12 w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left outline-none',
                    'transition-colors duration-150 hover:bg-accent focus-visible:bg-accent focus-visible:ring-2 focus-visible:ring-ring',
                  )}
                >
                  <span
                    className={cn(
                      'grid size-9 shrink-0 place-items-center rounded-lg border',
                      STATUS_TONES[TABLE_ACTIONS[action].to].badge,
                    )}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{label}</span>
                    <span className="block text-xs text-muted-foreground">{description}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </PopoverContent>
      </Popover>

      {permissions.canManage && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2.5 bottom-2.5 size-10 text-muted-foreground hover:text-foreground"
              aria-label={`Manage table ${table.tableNumber}`}
            >
              <Ellipsis aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => onEdit(table)}>
              <Pencil aria-hidden="true" />
              Edit table
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => onDelete(table)}>
              <Trash2 aria-hidden="true" />
              Delete table
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
