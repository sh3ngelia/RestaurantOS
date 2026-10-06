import { useContext, useEffect } from 'react'

import type { KitchenView } from '@/api/kitchen'
import type { HubGroup } from './connection'
import { RealtimeContext } from './realtime-context'

export function useRealtime() {
  const context = useContext(RealtimeContext)
  if (!context) throw new Error('useRealtime must be used inside <RealtimeProvider>')
  return context
}

/**
 * Keeps this screen in the hub group its view needs while it is mounted: the station's group,
 * or the pass group for any pass view. Switches groups when `view` changes; the provider
 * re-joins it after every reconnect.
 */
export function useHubGroup(view: KitchenView | null) {
  const { acquireGroup } = useRealtime()
  const kind = view?.kind
  const stationId = view?.kind === 'station' ? view.stationId : undefined

  useEffect(() => {
    const group: HubGroup | null =
      kind === 'pass' ? { kind: 'pass' } : kind === 'station' && stationId ? { kind: 'station', stationId } : null
    if (!group) return
    return acquireGroup(group)
  }, [acquireGroup, kind, stationId])
}
