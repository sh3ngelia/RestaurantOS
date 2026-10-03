import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-sm border font-medium whitespace-nowrap [&_svg]:size-3 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        // Neutral by default: the accent is reserved for actions and urgent states.
        default: 'border-border-strong text-foreground/85',
        outline: 'border-border-strong text-muted-foreground',
        muted: 'border-transparent bg-muted text-muted-foreground',
      },
      size: {
        default: 'h-5 px-1.5 text-xs',
        sm: 'h-5 px-1.5 text-[11px]',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

function Badge({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant, size }), className)} {...props} />
}

export { Badge, badgeVariants }
