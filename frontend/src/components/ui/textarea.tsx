import * as React from 'react'

import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex min-h-20 w-full rounded-md border border-input bg-sunken px-3 py-2 text-sm leading-relaxed text-foreground',
        'placeholder:text-muted-foreground/70 transition-[border-color,box-shadow] duration-150 outline-none',
        'hover:border-border-strong focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring',
        'aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive',
        'disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
