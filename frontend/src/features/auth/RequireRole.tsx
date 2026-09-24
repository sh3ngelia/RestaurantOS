import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { ArrowLeft, Lock } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { Role } from '@/config/roles'
import { useSession } from './useAuth'

interface RequireRoleProps {
  roles: readonly Role[]
  children: ReactNode
  /** Rendered instead of the default "not your station" panel. */
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
    <div className="mx-auto flex max-w-md flex-col items-center py-20 text-center">
      <div className="mb-6 grid size-14 place-items-center rounded-2xl border border-border bg-card surface-edge">
        <Lock className="size-6 text-primary" aria-hidden="true" />
      </div>
      <h1 className="text-3xl font-normal">Not your station</h1>
      <p className="mt-3 text-balance text-muted-foreground">
        This area belongs to another part of the team. If you think you should have access, ask your manager to update
        your role.
      </p>
      <Button asChild variant="outline" className="mt-8">
        <Link to="/">
          <ArrowLeft aria-hidden="true" />
          Back to dashboard
        </Link>
      </Button>
    </div>
  )
}
