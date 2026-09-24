import * as React from 'react'

import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(
        'animate-shimmer rounded-md bg-muted bg-size-[200%_100%] bg-no-repeat',
        'bg-[linear-gradient(90deg,transparent_0%,color-mix(in_oklch,var(--foreground)_7%,transparent)_50%,transparent_100%)]',
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
