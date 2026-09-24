import { createContext } from 'react'

import type { AuthResponse } from '@/api/auth'
import type { Session } from './session'

/**
 * - `verifying`: a stored token exists and is being checked against /api/auth/me
 * - `authenticated`: the token has been confirmed by the server this page load
 * - `anonymous`: no usable session
 */
export type AuthStatus = 'verifying' | 'authenticated' | 'anonymous'

export interface AuthContextValue {
  status: AuthStatus
  session: Session | null
  /** Stores a fresh login response. Throws if the role is not one the app knows. */
  signIn: (response: AuthResponse) => Session
  signOut: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
