import { motion } from 'motion/react'

import { RoleBadge } from '@/components/RoleBadge'
import { getModulesForRole } from '@/config/modules'
import { ROLE_META } from '@/config/roles'
import { useSession } from '@/features/auth/useAuth'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { getFirstName } from '@/lib/utils'
import { ModuleCard } from './ModuleCard'
import { StatsRow } from './StatsRow'
import { formatServiceDate, getGreeting } from './greeting'

export function DashboardPage() {
  const session = useSession()
  useDocumentTitle('Dashboard')

  const modules = getModulesForRole(session.role)
  const now = new Date()

  return (
    <div className="space-y-10 lg:space-y-12">
      <header>
        <p className="font-mono text-[11px] tracking-[0.18em] text-primary uppercase">{formatServiceDate(now)}</p>
        <h1 className="mt-3 text-4xl leading-[1.05] font-light text-balance sm:text-5xl">
          {getGreeting(now)}, <span className="italic">{getFirstName(session.fullName)}</span>.
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
          <RoleBadge role={session.role} />
          <p className="text-[15px] text-muted-foreground">{ROLE_META[session.role].tagline}</p>
        </div>
      </header>

      <StatsRow role={session.role} />

      <section aria-labelledby="modules-heading">
        <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
          <h2 id="modules-heading" className="text-2xl font-normal">
            Your modules
          </h2>
          <p className="text-sm text-muted-foreground">
            {modules.length} {modules.length === 1 ? 'module' : 'modules'} for {ROLE_META[session.role].station.toLowerCase()}
          </p>
        </div>

        {modules.length > 0 ? (
          <motion.ul
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.045, delayChildren: 0.1 } } }}
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
          >
            {modules.map((module) => (
              <ModuleCard key={module.id} module={module} />
            ))}
          </motion.ul>
        ) : (
          <p className="rounded-xl border border-dashed border-border-strong p-8 text-center text-sm text-muted-foreground">
            No modules are assigned to your role yet.
          </p>
        )}
      </section>
    </div>
  )
}
