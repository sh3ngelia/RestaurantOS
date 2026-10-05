import { useContext, useEffect } from 'react'

import type { KitchenView } from '@/api/kitchen'
import { RealtimeContext } from './realtime-context'

export function useRealtime() {
  const context = useContext(RealtimeContext)
  if (!context) throw new Error('useRealtime must be used inside <RealtimeProvider>')
  return context
}

/**
 * Keeps this screen in a hub group (a station, or the pass) while it is mounted, and
 * switches groups when `view` changes. The provider re-joins it after every reconnect.
 */
export function useHubGroup(view: KitchenView | null) {
  const { acquireGroup } = useRealtime()
  const kind = view?.kind
  const stationId = view?.kind === 'station' ? view.stationId : undefined

  useEffect(() => {
    const group: KitchenView | null =
      kind === 'pass' ? { kind: 'pass' } : kind === 'station' && stationId ? { kind: 'station', stationId } : null
    if (!group) return
    return acquireGroup(group)
  }, [acquireGroup, kind, stationId])
}
