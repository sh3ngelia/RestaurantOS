import { HubConnectionBuilder, LogLevel, type HubConnection, type IRetryPolicy } from '@microsoft/signalr'

import { API_BASE_URL } from '@/api/client'
import { readSession } from '@/features/auth/session'

/** Same origin in development (Vite proxies /hubs with WebSockets), VITE_API_URL in production. */
export const HUB_URL = `${API_BASE_URL}/hubs/kitchen`

/** Delays between reconnect attempts. The last one repeats forever: a kitchen tablet should never give up. */
export const RETRY_DELAYS_MS = [0, 2_000, 5_000, 10_000, 30_000] as const

export function retryDelay(attempt: number) {
  return RETRY_DELAYS_MS[Math.min(attempt, RETRY_DELAYS_MS.length - 1)] as number
}

const retryForever: IRetryPolicy = {
  nextRetryDelayInMilliseconds: ({ previousRetryCount }) => retryDelay(previousRetryCount),
}

/**
 * The kitchen hub connection. Browsers can't set headers on a WebSocket, so the JWT goes
 * through accessTokenFactory (the API reads it from the `access_token` query string). It is
 * read fresh on every (re)connect, so a reconnect never uses a stale token.
 */
export function createKitchenConnection(): HubConnection {
  return new HubConnectionBuilder()
    .withUrl(HUB_URL, { accessTokenFactory: () => readSession()?.token ?? '' })
    .withAutomaticReconnect(retryForever)
    .configureLogging(LogLevel.Warning)
    .build()
}

/** Server events. Both are signals to refetch over REST; neither carries state to patch in. */
export interface OrderChangedEvent {
  orderId: string
}

export interface ItemReadyEvent {
  orderId: string
  tableNumber: number | null
  itemName: string
}

/**
 * A hub group: one station, or the pass. Every pass-style screen (a type's pass, all stations)
 * listens on the single pass group; events are only "refetch" signals, so that is enough.
 */
export type HubGroup = { kind: 'station'; stationId: string } | { kind: 'pass' }

export function groupKey(group: HubGroup) {
  return group.kind === 'station' ? `station:${group.stationId}` : 'pass'
}

export function joinGroup(connection: HubConnection, group: HubGroup) {
  return group.kind === 'station' ? connection.invoke('JoinStation', group.stationId) : connection.invoke('JoinPass')
}

export function leaveGroup(connection: HubConnection, group: HubGroup) {
  return group.kind === 'station' ? connection.invoke('LeaveStation', group.stationId) : connection.invoke('LeavePass')
}
