import { ApiError, NETWORK_ERROR_STATUS, toApiError } from './errors'
import { readSession } from '@/features/auth/session'

/**
 * In development requests stay same-origin and Vite proxies `/api` to VITE_API_URL
 * (the API has no CORS policy). Production builds call VITE_API_URL directly.
 */
const API_BASE_URL = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')

type UnauthorizedHandler = () => void
let unauthorizedHandler: UnauthorizedHandler | null = null

/** Registers the callback fired when an authenticated request comes back 401. */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  unauthorizedHandler = handler
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  signal?: AbortSignal
  /** Attach the stored bearer token. Defaults to true. */
  auth?: boolean
}

async function parseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined
  const text = await response.text()
  if (!text) return undefined
  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('json')) {
    try {
      return JSON.parse(text) as unknown
    } catch {
      return text
    }
  }
  return text
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, signal, auth = true } = options

  const headers = new Headers({ Accept: 'application/json, application/problem+json' })
  if (body !== undefined) headers.set('Content-Type', 'application/json')

  const token = auth ? readSession()?.token : undefined
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(
      NETWORK_ERROR_STATUS,
      'Network error',
      "Can't reach the RestaurantOS server. Check your connection and that the API is running.",
    )
  }

  const data = await parseBody(response)

  if (!response.ok) {
    // Only an authenticated request can mean "session no longer valid";
    // a 401 from the login endpoint is just wrong credentials.
    if (response.status === 401 && token) unauthorizedHandler?.()
    throw toApiError(response.status, data)
  }

  return data as T
}
