import * as React from 'react'

import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex min-h-24 w-full rounded-lg border border-input bg-sunken px-3.5 py-2.5 text-[15px] leading-relaxed text-foreground',
        'placeholder:text-muted-foreground/70 transition-[border-color,box-shadow] duration-150 outline-none',
        'hover:border-border-strong focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/25',
        'aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/25',
        'disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
