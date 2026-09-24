import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'

import { authApi, authKeys, findClaim, type AuthResponse, type Claim } from '@/api/auth'
import { ApiError } from '@/api/errors'
import { setUnauthorizedHandler } from '@/api/client'
import { isRole } from '@/config/roles'
import { AuthContext, type AuthContextValue, type AuthStatus } from './auth-context'
import {
  SESSION_STORAGE_KEY,
  clearSession,
  getTokenExpiry,
  readSession,
  writeSession,
  type Session,
} from './session'

type EndReason = 'signed-out' | 'expired'

/** Keeps the cached display name/role in sync with what the server says the token holds. */
function reconcile(session: Session, claims: Claim[]): Session {
  const role = findClaim(claims, 'role')
  const name = findClaim(claims, 'name')
  return {
    ...session,
    role: isRole(role) ? role : session.role,
    fullName: name?.trim() ? name : session.fullName,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const [session, setSession] = useState<Session | null>(readSession)
  // The token confirmed by the server during this page load. A fresh login counts as confirmed.
  const [verifiedToken, setVerifiedToken] = useState<string | null>(null)

  // Mirrors `session` for callbacks that must not re-subscribe on every change.
  const sessionRef = useRef(session)

  const endSession = useCallback(
    (reason: EndReason, description = 'Please sign in again to continue.') => {
      if (!sessionRef.current) return // already ended (e.g. 401 handler + failed /me both fire)
      sessionRef.current = null
      clearSession()
      setSession(null)
      setVerifiedToken(null)
      queryClient.clear()

      if (reason === 'expired') {
        toast.error('Your session has ended', { description })
      } else {
        toast('Signed out', { description: 'See you next service.' })
        navigate('/login', { replace: true })
      }
    },
    [navigate, queryClient],
  )

  // Any authenticated request answered with 401 ends the session.
  useEffect(() => {
    setUnauthorizedHandler(() => endSession('expired'))
    return () => setUnauthorizedHandler(null)
  }, [endSession])

  // On start-up, confirm a stored token with the server before trusting it.
  useEffect(() => {
    if (!session || verifiedToken === session.token) return
    let cancelled = false
    const token = session.token

    queryClient
      .fetchQuery({ queryKey: authKeys.me(token), queryFn: ({ signal }) => authApi.me(signal), retry: false })
      .then((claims) => {
        if (cancelled) return
        setVerifiedToken(token)
        setSession((current) => {
          if (!current || current.token !== token) return current
          const next = reconcile(current, claims)
          writeSession(next)
          return next
        })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        endSession('expired', error instanceof ApiError && error.isNetworkError ? error.message : undefined)
      })

    return () => {
      cancelled = true
    }
  }, [session, verifiedToken, queryClient, endSession])

  // Sign out automatically the moment the JWT expires.
  useEffect(() => {
    if (!session) return
    const expiry = getTokenExpiry(session.token)
    if (expiry === null) return
    // setTimeout overflows above ~24.8 days; tokens here live minutes to hours.
    const delay = Math.min(Math.max(expiry - Date.now(), 0), 2_147_483_647)
    const timer = window.setTimeout(() => endSession('expired'), delay)
    return () => window.clearTimeout(timer)
  }, [session, endSession])

  // Keep tabs in sync: signing out in one tab signs out everywhere.
  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key !== SESSION_STORAGE_KEY) return
      const next = readSession()
      sessionRef.current = next
      setSession(next)
      if (!next) queryClient.clear()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [queryClient])

  const signIn = useCallback((response: AuthResponse) => {
    if (!isRole(response.role)) {
      throw new Error(`Your account role "${response.role}" isn't supported by this app yet.`)
    }
    const next: Session = { token: response.token, fullName: response.fullName, role: response.role }
    writeSession(next)
    sessionRef.current = next
    setSession(next)
    setVerifiedToken(next.token)
    return next
  }, [])

  const signOut = useCallback(() => endSession('signed-out'), [endSession])

  const status: AuthStatus = !session ? 'anonymous' : verifiedToken === session.token ? 'authenticated' : 'verifying'

  const value = useMemo<AuthContextValue>(
    () => ({ status, session, signIn, signOut }),
    [status, session, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
