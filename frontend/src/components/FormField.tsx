import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'

import { Label } from '@/components/ui/label'
import { FAST, collapseMotion } from '@/lib/motion'
import { cn } from '@/lib/utils'

interface FormFieldProps {
  id: string
  label: string
  error?: string
  hint?: ReactNode
  /** Rendered next to the label, e.g. "Optional". */
  aside?: ReactNode
  className?: string
  children: ReactNode
}

export function FormField({ id, label, error, hint, aside, className, children }: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <Label id={`${id}-label`} htmlFor={id}>
          {label}
        </Label>
        {aside && <span className="text-xs text-muted-foreground">{aside}</span>}
      </div>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      <AnimatePresence initial={false}>
        {error && (
          <motion.p
            key={error}
            id={`${id}-error`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={FAST}
            className="text-[13px] text-destructive"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

export function FormAlert({ id, message }: { id?: string; message: string | null }) {
  return (
    <AnimatePresence initial={false}>
      {message && (
        <motion.div key="form-alert" {...collapseMotion} className="overflow-hidden">
          <p
            id={id}
            role="alert"
            className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-foreground"
          >
            {message}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
