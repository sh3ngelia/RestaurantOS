import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { ArrowLeft, Lock } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { Role } from '@/config/roles'
import { useSession } from './useAuth'

interface RequireRoleProps {
  roles: readonly Role[]
  children: ReactNode
  /** Rendered instead of the default "no access" panel. */
  fallback?: ReactNode
}

/**
 * Role-based guard for UI and routes. This is a UX affordance only — the API
 * enforces authorization on every request regardless of what the client shows.
 */
export function RequireRole({ roles, children, fallback }: RequireRoleProps) {
  const session = useSession()
  if (roles.includes(session.role)) return <>{children}</>
  return <>{fallback ?? <NoAccess />}</>
}

function NoAccess() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
      <Lock className="mb-3 size-5 text-muted-foreground" aria-hidden="true" />
      <h1 className="text-xl font-semibold">No access</h1>
      <p className="mt-1 text-sm text-balance text-muted-foreground">
        Your role doesn't include this page. Ask a manager if you need access.
      </p>
      <Button asChild variant="outline" className="mt-5">
        <Link to="/">
          <ArrowLeft aria-hidden="true" />
          Back to dashboard
        </Link>
      </Button>
    </div>
  )
}
