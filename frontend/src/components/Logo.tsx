import { cn } from '@/lib/utils'

/** The mark: a plate seen from above, with a copper arc tracing service time. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className={cn('size-7', className)}>
      <rect x="0.5" y="0.5" width="31" height="31" rx="5.5" className="fill-card stroke-border-strong" />
      <circle cx="16" cy="16" r="8.5" strokeWidth="1.75" className="stroke-foreground/30" />
      <path d="M7.5 16a8.5 8.5 0 0 1 8.5-8.5" strokeWidth="2.25" strokeLinecap="round" className="stroke-primary" />
      <circle cx="16" cy="16" r="2.25" className="fill-primary" />
    </svg>
  )
}

export function Logo({ className, collapsed = false }: { className?: string; collapsed?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark className="shrink-0" />
      {!collapsed && <span className="text-[15px] leading-none font-semibold">RestaurantOS</span>}
    </span>
  )
}
