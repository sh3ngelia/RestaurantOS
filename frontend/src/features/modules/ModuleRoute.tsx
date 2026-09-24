import type { ReactNode } from 'react'

import { getModule } from '@/config/modules'
import { RequireRole } from '@/features/auth/RequireRole'
import { NotFoundContent } from '@/features/errors/NotFoundPage'

/**
 * Wraps a shipped module's page in the role guard declared for it in
 * config/modules.ts, so route access and navigation never drift apart.
 */
export function ModuleRoute({ id, children }: { id: string; children: ReactNode }) {
  const module = getModule(id)
  if (!module) return <NotFoundContent />
  return <RequireRole roles={module.roles}>{children}</RequireRole>
}
