import { isRole, type Role } from '@/config/roles'

export interface Session {
  token: string
  fullName: string
  role: Role
}

const STORAGE_KEY = 'restaurantos.session'
export const SESSION_STORAGE_KEY = STORAGE_KEY

function isSession(value: unknown): value is Session {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return typeof v.token === 'string' && v.token.length > 0 && typeof v.fullName === 'string' && isRole(v.role)
}

/** Reads the persisted session; malformed or expired sessions are discarded. */
export function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isSession(parsed) || isTokenExpired(parsed.token)) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function writeSession(session: Session) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  } catch {
    // Storage can be unavailable (private mode, quota). The session still lives in memory.
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

/** Returns the JWT `exp` claim in milliseconds, or null if it can't be read. */
export function getTokenExpiry(token: string): number | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const json = JSON.parse(atob(base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '='))) as {
      exp?: unknown
    }
    return typeof json.exp === 'number' ? json.exp * 1000 : null
  } catch {
    return null
  }
}

export function isTokenExpired(token: string, now = Date.now()) {
  const expiry = getTokenExpiry(token)
  return expiry !== null && expiry <= now
}
