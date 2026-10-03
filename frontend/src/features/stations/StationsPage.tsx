import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CircleAlert, Plus, RefreshCw, Store } from 'lucide-react'
import { toast } from 'sonner'

import { ApiError, getErrorMessage } from '@/api/errors'
import type { Station } from '@/api/stations'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState'
import { FormAlert } from '@/components/FormField'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { MenuSectionNav } from '@/features/menu/components/MenuSectionNav'
import { useMenuItems } from '@/features/menu/hooks'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { listItemMotion } from '@/lib/motion'
import { StationFormDialog } from './components/StationFormDialog'
import { StationRow, StationRowHeader } from './components/StationRow'
import { notifyStationError, useDeleteStation, useSetStationActive, useStations } from './hooks'

type DialogState = { open: boolean; station: Station | null }
const CLOSED: DialogState = { open: false, station: null }

const isConflict = (error: unknown) => error instanceof ApiError && error.status === 409

/** Stations for the Manager: where menu items' tickets go, and whether they fire straight away. */
export function StationsPage() {
  useDocumentTitle('Stations')
  const query = useStations()
  const itemsQuery = useMenuItems()
  const setActive = useSetStationActive()
  const deleteStation = useDeleteStation()

  // Dialog state keeps its subject while closing so exit animations don't flash empty content.
  const [form, setForm] = useState<DialogState>(CLOSED)
  const [deleting, setDeleting] = useState<DialogState>(CLOSED)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  // A refused deactivation (409) stays on screen until the next action, rather than in a toast that fades.
  const [notice, setNotice] = useState<string | null>(null)

  const stations = useMemo(() => query.data ?? [], [query.data])
  const itemCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const item of itemsQuery.data ?? []) counts.set(item.stationId, (counts.get(item.stationId) ?? 0) + 1)
    return counts
  }, [itemsQuery.data])
  const countFor = (station: Station) => (itemsQuery.isSuccess ? (itemCounts.get(station.id) ?? 0) : null)

  const active = stations.filter((s) => s.isActive).length
  const nextDisplayOrder = stations.reduce((max, s) => Math.max(max, s.displayOrder + 1), 0)
  // Read the live row, so the confirmation reflects the latest item count.
  const deleteTarget = deleting.station ? (stations.find((s) => s.id === deleting.station?.id) ?? deleting.station) : null
  const deleteCount = deleteTarget ? countFor(deleteTarget) : null

  function toggleActive(station: Station) {
    setNotice(null)
    const isActive = !station.isActive
    setActive.mutate(
      { station, isActive },
      {
        onSuccess: (updated) => toast.success(isActive ? `${updated.name} activated` : `${updated.name} deactivated`),
        onError: (error) => {
          if (isConflict(error)) setNotice(getErrorMessage(error))
          else notifyStationError(error, isActive ? `Couldn't activate ${station.name}` : `Couldn't deactivate ${station.name}`)
        },
      },
    )
  }

  function openDelete(station: Station) {
    setNotice(null)
    setDeleteError(null)
    setDeleting({ open: true, station })
  }

  async function runDelete() {
    const station = deleting.station
    if (!station) return
    setDeleteError(null)
    try {
      await deleteStation.mutateAsync(station)
      toast.success(`${station.name} deleted`)
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        notifyStationError(error, `Couldn't delete ${station.name}`)
        return // already gone: let the dialog close
      }
      // "Station 'Grill' has 2 menu item(s)…" stays in the dialog, next to the button that caused it.
      if (isConflict(error)) setDeleteError(getErrorMessage(error))
      else notifyStationError(error, `Couldn't delete ${station.name}`)
      throw error
    }
  }

  return (
    <div className="space-y-5">
      <MenuSectionNav />

      <PageHeader
        title="Stations"
        description={
          query.isSuccess && stations.length > 0
            ? `${stations.length} ${stations.length === 1 ? 'station' : 'stations'} · ${active} active`
            : undefined
        }
        actions={
          query.isSuccess && (
            <Button
              onClick={() => {
                setNotice(null)
                setForm({ open: true, station: null })
              }}
            >
              <Plus aria-hidden="true" />
              New station
            </Button>
          )
        }
      />

      <FormAlert message={notice} />

      {query.isPending ? (
        <div role="status" aria-label="Loading stations" className="divide-y divide-border rounded-md border border-border bg-card">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex items-center gap-4 px-3 py-3">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="ml-auto h-4 w-24" />
            </div>
          ))}
        </div>
      ) : query.isError ? (
        <EmptyState
          icon={CircleAlert}
          title="Couldn’t load stations"
          description={getErrorMessage(query.error)}
          action={
            <Button variant="outline" onClick={() => void query.refetch()}>
              <RefreshCw aria-hidden="true" />
              Try again
            </Button>
          }
        />
      ) : stations.length === 0 ? (
        <EmptyState
          icon={Store}
          title="No stations"
          description="Add a station, such as Grill or Bar, so menu items have somewhere to send their tickets."
          action={
            <Button onClick={() => setForm({ open: true, station: null })}>
              <Plus aria-hidden="true" />
              New station
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-md border border-border bg-card">
          <StationRowHeader />
          <ul aria-label="Stations" className="divide-y divide-border border-border lg:border-t">
            <AnimatePresence initial={false} mode="popLayout">
              {stations.map((station) => (
                <motion.li key={station.id} {...listItemMotion}>
                  <StationRow
                    station={station}
                    itemCount={countFor(station)}
                    busy={setActive.isPending && setActive.variables?.station.id === station.id}
                    onEdit={() => {
                      setNotice(null)
                      setForm({ open: true, station })
                    }}
                    onToggleActive={() => toggleActive(station)}
                    onDelete={() => openDelete(station)}
                  />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </div>
      )}

      <StationFormDialog
        open={form.open}
        onOpenChange={(open) => setForm((s) => ({ ...s, open }))}
        station={form.station}
        nextDisplayOrder={nextDisplayOrder}
      />
      {deleteTarget && (
        <ConfirmDialog
          open={deleting.open}
          onOpenChange={(open) => setDeleting((s) => ({ ...s, open }))}
          title={`Delete ${deleteTarget.name}?`}
          description={
            deleteCount
              ? `${deleteCount} menu ${deleteCount === 1 ? 'item uses' : 'items use'} ${deleteTarget.name}. Move ${deleteCount === 1 ? 'it' : 'them'} to another station first. Only stations without menu items can be deleted.`
              : `${deleteTarget.name} will be removed. This can't be undone.`
          }
          confirmLabel="Delete station"
          confirmDisabled={!!deleteCount}
          error={deleteError}
          onConfirm={runDelete}
        />
      )}
    </div>
  )
}
