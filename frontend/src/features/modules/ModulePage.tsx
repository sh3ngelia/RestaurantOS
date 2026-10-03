import { Link, useParams } from 'react-router'
import { ArrowLeft, Check } from 'lucide-react'

import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getModule } from '@/config/modules'
import { RequireRole } from '@/features/auth/RequireRole'
import { NotFoundContent } from '@/features/errors/NotFoundPage'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

/** Landing page for a module. While a module is in development it previews what's planned. */
export function ModulePage() {
  const { moduleId } = useParams()
  const module = getModule(moduleId)
  useDocumentTitle(module?.title ?? 'Not found')

  if (!module) return <NotFoundContent />

  return (
    <RequireRole roles={module.roles}>
      <div className="space-y-5">
        <Button asChild variant="ghost" size="sm" className="-ml-3 text-muted-foreground">
          <Link to="/">
            <ArrowLeft aria-hidden="true" />
            Dashboard
          </Link>
        </Button>

        <PageHeader
          title={
            <span className="flex items-center gap-2">
              {module.title}
              <Badge variant="outline">Coming soon</Badge>
            </span>
          }
          description={module.description}
        />

        <section aria-labelledby="planned-heading" className="max-w-xl rounded-md border border-border bg-card">
          <h2 id="planned-heading" className="border-b border-border px-4 py-2.5 text-sm font-semibold">
            Planned features
          </h2>
          <ul className="divide-y divide-border">
            {module.highlights.map((item) => (
              <li key={item} className="flex gap-2.5 px-4 py-2.5 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </RequireRole>
  )
}
