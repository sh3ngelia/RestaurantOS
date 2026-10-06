import { createContext } from 'react'

import type { HubGroup } from './connection'

/**
 * - `connecting`: first connection after sign-in
 * - `live`: connected; events arrive as they happen
 * - `reconnecting`: the connection dropped and is being re-established
 * - `offline`: not connected; retrying on a timer (screens fall back to slow polling)
 */
export type ConnectionStatus = 'connecting' | 'live' | 'reconnecting' | 'offline'

export interface RealtimeContextValue {
  status: ConnectionStatus
  /** Joins a station or the pass group; call the returned function to leave. Reference-counted. */
  acquireGroup: (group: HubGroup) => () => void
  /** Orders with an item the kitchen marked ready, by order id → when (ms). Floor users only. */
  recentlyReady: ReadonlyMap<string, number>
  /** Forget a "just ready" highlight, e.g. once the waiter opens that order. */
  acknowledgeReady: (orderId: string) => void
}

export const RealtimeContext = createContext<RealtimeContextValue | null>(null)
