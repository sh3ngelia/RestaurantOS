import { motion } from 'motion/react'

import { LogoMark } from '@/components/Logo'

export function FullScreenLoader({ label = 'Loading' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="grid min-h-dvh place-items-center bg-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, delay: 0.15 }}
        className="flex flex-col items-center gap-5"
      >
        <div className="relative">
          <LogoMark className="size-12" />
          <span className="absolute -inset-2 animate-spin rounded-[18px] border border-transparent border-t-primary/60 [animation-duration:1.2s]" />
        </div>
        <p className="text-sm text-muted-foreground">{label}…</p>
      </motion.div>
    </div>
  )
}
