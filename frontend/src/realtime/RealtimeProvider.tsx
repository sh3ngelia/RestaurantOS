import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { HubConnectionState, type HubConnection } from '@microsoft/signalr'
import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'

import { kitchenKeys } from '@/api/kitchen'
import { orderKeys } from '@/api/orders'
import { tableKeys } from '@/api/tables'
import { useAuth } from '@/features/auth/useAuth'
import { getOrderPermissions } from '@/features/orders/permissions'
import {
  createKitchenConnection,
  groupKey,
  joinGroup,
  leaveGroup,
  retryDelay,
  type HubGroup,
  type ItemReadyEvent,
  type OrderChangedEvent,
} from './connection'
import { RealtimeContext, type ConnectionStatus, type RealtimeContextValue } from './realtime-context'

/** Everything an `OrderChanged` can touch. The event is only a signal: the data comes from REST. */
function invalidateForOrder(queryClient: QueryClient, orderId: string) {
  void queryClient.invalidateQueries({ queryKey: kitchenKeys.all })
  void queryClient.invalidateQueries({ queryKey: orderKeys.open() })
  void queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) })
  void queryClient.invalidateQueries({ queryKey: tableKeys.all })
}

/** After a (re)connect, events may have been missed: refetch everything live screens show. */
function invalidateLive(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: kitchenKeys.all })
  void queryClient.invalidateQueries({ queryKey: orderKeys.all })
  void queryClient.invalidateQueries({ queryKey: tableKeys.all })
}

function warn(message: string) {
  return (error: unknown) => console.warn(`[realtime] ${message}`, error)
}

/**
 * One SignalR connection for the whole app: started once the session is verified, stopped
 * on sign-out, reconnecting on its own. Screens declare the groups they need with
 * useHubGroup(); the provider joins them, and re-joins them after every reconnect.
 */
export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { status: authStatus, session } = useAuth()
  const token = authStatus === 'authenticated' ? (session?.token ?? null) : null
  const role = session?.role
  const queryClient = useQueryClient()

  const navigate = useNavigate()
  const navigateRef = useRef(navigate)
  useEffect(() => {
    navigateRef.current = navigate
  })

  // Status is stored with the token it belongs to, so a new session starts at "connecting".
  const [connection, setConnection] = useState<{ token: string; status: ConnectionStatus } | null>(null)
  const status: ConnectionStatus = connection && connection.token === token ? connection.status : 'connecting'

  const [recentlyReady, setRecentlyReady] = useState<ReadonlyMap<string, number>>(() => new Map())

  const connectionRef = useRef<HubConnection | null>(null)
  const groupsRef = useRef(new Map<string, { group: HubGroup; count: number }>())

  useEffect(() => {
    if (!token) return
    const hub = createKitchenConnection()
    connectionRef.current = hub
    let stopped = false
    let attempt = 0
    let retryTimer: number | undefined
    const report = (next: ConnectionStatus) => {
      if (!stopped) setConnection({ token, status: next })
    }

    async function resync() {
      await Promise.all([...groupsRef.current.values()].map(({ group }) => joinGroup(hub, group).catch(warn('re-join failed'))))
      invalidateLive(queryClient)
    }

    hub.on('OrderChanged', (event: OrderChangedEvent) => invalidateForOrder(queryClient, event.orderId))

    // Sent to the floor group only. Hosts are on the floor too, but only order-takers can act on it.
    hub.on('ItemReady', (event: ItemReadyEvent) => {
      setRecentlyReady((current) => new Map(current).set(event.orderId, Date.now()))
      const where = event.tableNumber !== null ? `Table ${event.tableNumber}` : 'Takeaway'
      const canOpen = role ? getOrderPermissions(role).canTakeOrders : false
      toast(`${where} · ${event.itemName} is ready`, {
        action: canOpen ? { label: 'Open', onClick: () => navigateRef.current(`/m/orders/${event.orderId}`) } : undefined,
      })
    })

    hub.onreconnecting(() => report('reconnecting'))
    hub.onreconnected(() => {
      report('live')
      void resync()
    })
    // With a retry policy that never gives up, close only follows a stop or a fatal error.
    hub.onclose(() => {
      if (stopped) return
      report('offline')
      scheduleStart()
    })

    async function start() {
      try {
        await hub.start()
        attempt = 0
        report('live')
        await resync()
      } catch (error) {
        if (stopped) return
        warn('could not connect')(error)
        report('offline')
        scheduleStart()
      }
    }

    function scheduleStart() {
      window.clearTimeout(retryTimer)
      retryTimer = window.setTimeout(() => void start(), Math.max(retryDelay(attempt++), 1_000))
    }

    // Back online: try straight away instead of waiting out the timer.
    function onOnline() {
      if (hub.state !== HubConnectionState.Disconnected) return
      window.clearTimeout(retryTimer)
      void start()
    }
    window.addEventListener('online', onOnline)

    void start()

    return () => {
      stopped = true
      window.clearTimeout(retryTimer)
      window.removeEventListener('online', onOnline)
      connectionRef.current = null
      void hub.stop()
    }
  }, [token, role, queryClient])

  const acquireGroup = useCallback((group: HubGroup) => {
    const key = groupKey(group)
    const entry = groupsRef.current.get(key)
    if (entry) {
      entry.count += 1
    } else {
      groupsRef.current.set(key, { group, count: 1 })
      const hub = connectionRef.current
      // Not connected yet: the next (re)connect joins every registered group.
      if (hub?.state === HubConnectionState.Connected) void joinGroup(hub, group).catch(warn('join failed'))
    }

    let released = false
    return () => {
      if (released) return
      released = true
      const current = groupsRef.current.get(key)
      if (!current) return
      current.count -= 1
      if (current.count > 0) return
      groupsRef.current.delete(key)
      const hub = connectionRef.current
      if (hub?.state === HubConnectionState.Connected) void leaveGroup(hub, group).catch(warn('leave failed'))
    }
  }, [])

  const acknowledgeReady = useCallback((orderId: string) => {
    setRecentlyReady((current) => {
      if (!current.has(orderId)) return current
      const next = new Map(current)
      next.delete(orderId)
      return next
    })
  }, [])

  const value = useMemo<RealtimeContextValue>(
    () => ({ status, acquireGroup, recentlyReady, acknowledgeReady }),
    [status, acquireGroup, recentlyReady, acknowledgeReady],
  )

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>
}
