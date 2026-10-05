import { Outlet } from 'react-router'

import { AuthProvider } from '@/features/auth/AuthProvider'
import { RealtimeProvider } from '@/realtime/RealtimeProvider'

/**
 * AuthProvider lives inside the router so it can navigate on sign-out. The real-time
 * connection sits inside it: it starts once the session is verified and stops on sign-out.
 */
export function RootLayout() {
  return (
    <AuthProvider>
      <RealtimeProvider>
        <Outlet />
      </RealtimeProvider>
    </AuthProvider>
  )
}
