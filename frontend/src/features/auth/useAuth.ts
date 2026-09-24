import { useContext } from 'react'

import { AuthContext } from './auth-context'

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}

/** For components rendered behind <ProtectedRoute>, where a session is guaranteed. */
export function useSession() {
  const { session } = useAuth()
  if (!session) throw new Error('useSession must be used inside a protected route')
  return session
}
