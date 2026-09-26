import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { Armchair, CircleAlert, Plus, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

import { ApiError, getErrorMessage } from '@/api/errors'
import type { DiningTable } from '@/api/tables'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { OccupancyBar } from './components/OccupancyBar'
import { StatusFilter } from './components/StatusFilter'
import { TableCard } from './components/TableCard'
import { TableFormDialog } from './components/TableFormDialog'
import { TablesSkeleton } from './components/TablesSkeleton'
import { countFloor } from './floor'
import { notifyTableError, useDeleteTable, useTables } from './hooks'
import { useTablePermissions } from './permissions'
import { STATUS_FILTERS, STATUS_LABELS, parseStatusFilter } from './status'

const EASE = [0.2, 0.8, 0.2, 1] as const

export function TablesPage() {
  useDocumentTitle('Tables')
  const permissions = useTablePermissions()
  const tablesQuery = useTables()
  const [searchParams] = useSearchParams()
  const filterId = parseStatusFilter(searchParams.get('status'))
  const filter = STATUS_FILTERS.find((f) => f.id === filterId) ?? STATUS_FILTERS[0]

  // Dialog state keeps its subject while closing so exit animations don't flash empty content.
  const [formState, setFormState] = useState<{ open: boolean; table: DiningTable | null }>({ open: false, table: null })
  const [pendingDelete, setPendingDelete] = useState<DiningTable | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const deleteTable = useDeleteTable()

  const tables = useMemo(() => tablesQuery.data ?? [], [tablesQuery.data])
  const counts = useMemo(() => countFloor(tables), [tables])
  const visible = filter.status ? tables.filter((t) => t.status === filter.status) : tables
  const nextTableNumber = tables.reduce((max, t) => Math.max(max, t.tableNumber), 0) + 1
  // Read the live row: the table may be seated or cleared while the dialog is open.
  const deleteTarget = pendingDelete ? (tables.find((t) => t.id === pendingDelete.id) ?? pendingDelete) : null

  async function runDelete() {
    if (!pendingDelete) return
    try {
      await deleteTable.mutateAsync(pendingDelete)
      toast.success(`Table ${pendingDelete.tableNumber} removed`, { description: 'It’s no longer on the floor.' })
    } catch (error) {
      notifyTableError(error, `Couldn't delete table ${pendingDelete.tableNumber}`)
      if (!(error instanceof ApiError && error.status === 404)) throw error
    }
  }

  const loading = tablesQuery.isPending
  const failed = tablesQuery.error

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[11px] tracking-[0.18em] text-primary uppercase">Service</p>
          <h1 className="mt-3 text-4xl leading-[1.05] font-light sm:text-5xl">Tables</h1>
          <p className="mt-3 text-[15px] text-muted-foreground" aria-live="polite">
            {loading || failed || counts.total === 0 ? (
              'Seat, reserve and clear tables as the night moves.'
            ) : (
              <>
                <span className="text-primary">{counts.byStatus.Occupied} seated</span>
                {' · '}
                <span className="text-reserved">{counts.byStatus.Reserved} reserved</span>
                {' · '}
                {counts.byStatus.Available} free
              </>
            )}
          </p>
          {!loading && !failed && <OccupancyBar counts={counts} className="mt-4 max-w-md" />}
        </div>

        {!loading && !failed && counts.total > 0 && (
          <div className="flex items-end gap-6">
            <div className="sm:text-right">
              <p className="font-serif text-4xl leading-none font-light tabular-nums">
                {counts.coversSeated}
                <span className="text-lg text-muted-foreground"> / {counts.totalSeats}</span>
              </p>
              <p className="mt-1.5 text-xs text-muted-foreground">covers seated</p>
            </div>
            {permissions.canManage && (
              <Button size="lg" onClick={() => setFormState({ open: true, table: null })}>
                <Plus aria-hidden="true" />
                Add table
              </Button>
            )}
          </div>
        )}
      </header>

      {loading ? (
        <TablesSkeleton />
      ) : failed ? (
        <EmptyState
          icon={CircleAlert}
          title="The floor didn’t load"
          description={getErrorMessage(failed)}
          action={
            <Button variant="outline" onClick={() => void tablesQuery.refetch()}>
              <RefreshCw aria-hidden="true" />
              Try again
            </Button>
          }
        />
      ) : counts.total === 0 ? (
        <EmptyState
          icon={Armchair}
          title={permissions.canManage ? 'No tables yet' : 'No tables have been set up yet'}
          description={
            permissions.canManage
              ? 'Add your first table to start building the floor.'
              : 'Once a manager adds tables, you can seat and reserve them here.'
          }
          action={
            permissions.canManage && (
              <Button size="lg" onClick={() => setFormState({ open: true, table: null })}>
                <Plus aria-hidden="true" />
                Add your first table
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-6">
          <StatusFilter activeId={filterId} counts={counts.byStatus} total={counts.total} />

          {visible.length === 0 && filter.status ? (
            <EmptyState
              icon={Armchair}
              title={`No ${STATUS_LABELS[filter.status].toLowerCase()} tables right now`}
              description="Tables move between states all night; check back or look at the whole floor."
              action={
                <Button asChild variant="outline">
                  <Link to={{ search: '' }} replace preventScrollReset>
                    Show all tables
                  </Link>
                </Button>
              }
            />
          ) : (
            <LayoutGroup>
              <ul
                aria-label={filter.status ? `${STATUS_LABELS[filter.status]} tables` : 'All tables'}
                className="grid grid-flow-dense grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 2xl:grid-cols-5"
              >
                <AnimatePresence mode="popLayout" initial={false}>
                  {visible.map((table) => (
                    <motion.li
                      key={table.id}
                      layout
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                      transition={{ duration: 0.24, ease: EASE }}
                      // Banquet tables get the room they need.
                      className={table.capacity > 8 ? 'col-span-2' : undefined}
                    >
                      <TableCard
                        table={table}
                        permissions={permissions}
                        onEdit={(t) => setFormState({ open: true, table: t })}
                        onDelete={(t) => {
                          setPendingDelete(t)
                          setDeleteOpen(true)
                        }}
                      />
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </LayoutGroup>
          )}
        </div>
      )}

      {permissions.canManage && (
        <>
          <TableFormDialog
            open={formState.open}
            onOpenChange={(open) => setFormState((s) => ({ ...s, open }))}
            table={formState.table}
            nextTableNumber={nextTableNumber}
          />
          {deleteTarget && (
            <ConfirmDialog
              open={deleteOpen}
              onOpenChange={setDeleteOpen}
              title={`Delete table ${deleteTarget.tableNumber}?`}
              description={
                deleteTarget.status === 'Available'
                  ? 'It will be removed from the floor plan.'
                  : `Table ${deleteTarget.tableNumber} is ${STATUS_LABELS[deleteTarget.status].toLowerCase()} right now. Clear it before deleting. Only free tables can be removed.`
              }
              confirmLabel="Delete table"
              confirmDisabled={deleteTarget.status !== 'Available'}
              onConfirm={runDelete}
            />
          )}
        </>
      )}
    </div>
  )
}
