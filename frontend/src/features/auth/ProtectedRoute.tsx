import { Navigate, Outlet, useLocation } from 'react-router'

import { FullScreenLoader } from '@/components/FullScreenLoader'
import { useAuth } from './useAuth'

export interface LoginLocationState {
  from?: string
}

/** Renders child routes only for a verified session; otherwise sends the user to /login. */
export function ProtectedRoute() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'verifying') return <FullScreenLoader label="Checking your session" />

  if (status === 'anonymous') {
    const state: LoginLocationState = { from: location.pathname + location.search }
    return <Navigate to="/login" replace state={state} />
  }

  return <Outlet />
}

/** The inverse: signed-in users visiting /login go straight to the app. */
export function PublicOnlyRoute() {
  const { status } = useAuth()

  if (status === 'verifying') return <FullScreenLoader label="Checking your session" />
  if (status === 'authenticated') return <Navigate to="/" replace />

  return <Outlet />
}
