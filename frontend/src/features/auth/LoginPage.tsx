import { motion } from 'motion/react'
import { Copyright } from 'lucide-react'

import { Logo } from '@/components/Logo'
import { ThemeToggle } from '@/components/ThemeToggle'
import { KitchenPass } from './components/KitchenPass'
import { LoginForm } from './components/LoginForm'

const EASE = [0.2, 0.8, 0.2, 1] as const

export function LoginPage() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <KitchenPass className="hidden border-r border-border lg:flex" />

      <main className="relative flex min-h-dvh flex-col px-6 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Logo className="lg:invisible" />
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.06 } } }}
            className="w-full max-w-[22rem]"
          >
            <motion.p
              variants={fadeUp}
              className="font-mono text-[11px] tracking-[0.18em] text-primary uppercase"
            >
              Staff sign-in
            </motion.p>
            <motion.h1 variants={fadeUp} className="mt-3 text-4xl leading-[1.05] font-light">
              Welcome back.
            </motion.h1>
            <motion.p variants={fadeUp} className="mt-3 text-[15px] text-muted-foreground">
              Sign in with your work account to start your service.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-9">
              <LoginForm />
            </motion.div>

            <motion.p variants={fadeUp} className="mt-8 text-[13px] leading-relaxed text-muted-foreground">
              Trouble signing in? Your manager can reset your access from the Staff module.
            </motion.p>
          </motion.div>
        </div>

        <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground/70 lg:justify-start">
          <Copyright className="size-3" aria-label="Copyright" role="img" />
          {new Date().getFullYear()} RestaurantOS
        </p>
      </main>
    </div>
  )
}

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE } },
}
