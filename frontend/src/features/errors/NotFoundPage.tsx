import { Link, useNavigate } from 'react-router'
import { motion } from 'motion/react'
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
    <div className="flex min-h-dvh flex-col px-6 py-6 sm:px-10">
      <div className="flex items-center justify-between">
        <Link to="/" className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="RestaurantOS home">
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

/** The 86'd ticket and copy — also used inside the app shell for unknown module ids. */
export function NotFoundContent() {
  const { status } = useAuth()
  const navigate = useNavigate()
  const signedIn = status === 'authenticated'

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-12 py-8 md:flex-row md:gap-16">
      <motion.div
        initial={{ opacity: 0, y: -24, rotate: -8 }}
        animate={{ opacity: 1, y: 0, rotate: -4 }}
        transition={{ type: 'spring', stiffness: 220, damping: 20 }}
        aria-hidden="true"
        className="relative w-52 shrink-0"
      >
        <div className="rounded-md bg-[oklch(0.93_0.012_80)] px-4 pt-5 pb-4 font-mono text-[11px] leading-relaxed text-[oklch(0.25_0.01_60)] shadow-[0_24px_40px_-16px_oklch(0_0_0/0.55)]">
          <div className="flex justify-between border-b border-dashed border-[oklch(0.7_0.01_60)] pb-2">
            <span className="font-medium">#0404</span>
            <span className="font-semibold">T—</span>
          </div>
          <ul className="mt-3 space-y-1">
            <li className="line-through decoration-[oklch(0.62_0.13_52)] decoration-2">1× The page you wanted</li>
            <li className="text-[oklch(0.5_0.01_60)]">1× Directions home</li>
          </ul>
          <div className="mt-4 border-t border-dashed border-[oklch(0.7_0.01_60)] pt-2 text-[oklch(0.45_0.01_60)]">
            Server: the internet
          </div>
        </div>
        <motion.span
          initial={{ opacity: 0, scale: 1.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35, duration: 0.2, ease: 'easeOut' }}
          className="absolute -top-10 -right-10 grid size-20 rotate-12 place-items-center rounded-full border-[3px] border-primary bg-background/70 font-serif text-3xl font-semibold text-primary backdrop-blur-[1px]"
        >
          86
        </motion.span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="text-center md:text-left"
      >
        <p className="font-mono text-[11px] tracking-[0.18em] text-primary uppercase">Error 404</p>
        <h1 className="mt-3 text-4xl leading-[1.05] font-light text-balance sm:text-5xl">This page has been 86’d.</h1>
        <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground">
          In the kitchen, “86” means it’s off the menu. The page you asked for doesn’t exist or has moved.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3 md:justify-start">
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
      </motion.div>
    </div>
  )
}
