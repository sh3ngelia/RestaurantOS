import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'

import { Label } from '@/components/ui/label'
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
    <div className={cn('space-y-2', className)}>
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
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
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
        <motion.div
          key="form-alert"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="overflow-hidden"
        >
          <p
            id={id}
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-3 text-sm text-foreground"
          >
            {message}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
