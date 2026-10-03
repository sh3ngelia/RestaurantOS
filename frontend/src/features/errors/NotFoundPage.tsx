import { Link, useNavigate } from 'react-router'
import { ArrowLeft, Home } from 'lucide-react'

import { Logo } from '@/components/Logo'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/useAuth'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

/** Standalone 404 for unknown top-level URLs (works signed in or out). */
export function NotFoundPage() {
  useDocumentTitle('Page not found')

  return (
    <div className="flex min-h-dvh flex-col px-4 py-4 sm:px-6">
      <div className="flex items-center justify-between">
        <Link to="/" className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="RestaurantOS home">
          <Logo />
        </Link>
        <ThemeToggle />
      </div>
      <main className="flex flex-1 items-center justify-center py-12">
        <NotFoundContent />
      </main>
    </div>
  )
}

/** Plain "page not found" content, also used inside the app shell for unknown module ids. */
export function NotFoundContent() {
  const { status } = useAuth()
  const navigate = useNavigate()
  const signedIn = status === 'authenticated'

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center py-16 text-center">
      <p className="text-sm text-muted-foreground">404</p>
      <h1 className="mt-1 text-xl font-semibold">Page not found</h1>
      <p className="mt-1 text-sm text-muted-foreground">The page you asked for doesn’t exist or has moved.</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Button asChild>
          <Link to={signedIn ? '/' : '/login'}>
            <Home aria-hidden="true" />
            {signedIn ? 'Back to dashboard' : 'Go to sign in'}
          </Link>
        </Button>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft aria-hidden="true" />
          Go back
        </Button>
      </div>
    </div>
  )
}
