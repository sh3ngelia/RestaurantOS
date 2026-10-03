import { LoaderCircle } from 'lucide-react'

export function FullScreenLoader({ label = 'Loading' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="grid min-h-dvh place-items-center bg-background">
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        {label}…
      </p>
    </div>
  )
}
