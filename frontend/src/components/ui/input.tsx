import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'touch-target flex h-9 w-full min-w-0 rounded-md border border-input bg-sunken px-3 text-sm text-foreground',
        'placeholder:text-muted-foreground/70 transition-[border-color,box-shadow] duration-150 outline-none',
        'hover:border-border-strong',
        'focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring',
        'aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive',
        'disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
