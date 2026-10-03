import { PageHeader } from '@/components/PageHeader'
import { getModulesForRole } from '@/config/modules'
import { useSession } from '@/features/auth/useAuth'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { ModuleCard } from './ModuleCard'
import { StatsRow } from './StatsRow'
import { formatServiceDate } from './greeting'

export function DashboardPage() {
  const session = useSession()
  useDocumentTitle('Dashboard')

  const modules = getModulesForRole(session.role)

  return (
    <div className="space-y-6">
      <PageHeader title={formatServiceDate(new Date())} description={session.fullName} />

      <StatsRow role={session.role} />

      <section aria-labelledby="modules-heading">
        <h2 id="modules-heading" className="mb-2 text-sm font-semibold">
          Modules
        </h2>

        {modules.length > 0 ? (
          <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {modules.map((module) => (
              <ModuleCard key={module.id} module={module} />
            ))}
          </ul>
        ) : (
          <p className="rounded-md border border-dashed border-border-strong p-6 text-center text-sm text-muted-foreground">
            No modules are assigned to your role yet.
          </p>
        )}
      </section>
    </div>
  )
}
