import { Link, useParams } from 'react-router'
import { motion } from 'motion/react'
import { ArrowLeft, Check, Clock } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
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

  const { icon: Icon } = module

  return (
    <RequireRole roles={module.roles}>
      <div className="space-y-8">
        <Button asChild variant="ghost" size="sm" className="-ml-3 text-muted-foreground">
          <Link to="/">
            <ArrowLeft aria-hidden="true" />
            Dashboard
          </Link>
        </Button>

        <header className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <span className="surface-edge grid size-16 shrink-0 place-items-center rounded-2xl border border-border bg-card text-primary">
            <Icon className="size-7" aria-hidden="true" />
          </span>
          <div>
            <Badge variant="outline" className="gap-1">
              <Clock aria-hidden="true" />
              Coming soon
            </Badge>
            <h1 className="mt-3 text-4xl font-light sm:text-5xl">{module.title}</h1>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground">{module.description}</p>
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <Card className="p-6">
            <h2 className="text-xl font-normal">On the menu</h2>
            <p className="mt-1 text-sm text-muted-foreground">What this module will do when it ships.</p>
            <motion.ul
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } } }}
              className="mt-6 space-y-4"
            >
              {module.highlights.map((item) => (
                <motion.li
                  key={item}
                  variants={{ hidden: { opacity: 0, x: -6 }, show: { opacity: 1, x: 0 } }}
                  transition={{ duration: 0.22 }}
                  className="flex gap-3 text-sm"
                >
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
                    <Check className="size-3" aria-hidden="true" />
                  </span>
                  {item}
                </motion.li>
              ))}
            </motion.ul>
          </Card>

          {/* A quiet wireframe of the future screen */}
          <Card className="relative overflow-hidden p-6" aria-hidden="true">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-32" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="rounded-lg border border-border p-3">
                  <Skeleton className="h-3 w-10" />
                  <Skeleton className="mt-3 h-6 w-full" />
                  <Skeleton className="mt-2 h-2.5 w-2/3" />
                </div>
              ))}
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-card to-transparent" />
            <p className="absolute right-6 bottom-5 font-mono text-[10.5px] tracking-[0.16em] text-muted-foreground uppercase">
              In the kitchen
            </p>
          </Card>
        </div>
      </div>
    </RequireRole>
  )
}
