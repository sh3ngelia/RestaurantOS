import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { STATUS_TONE_CLASSES, type StatusTone } from '@/lib/status-tones'
import { cn } from '@/lib/utils'
import type { ConnectionStatus as Status } from '@/realtime/realtime-context'
import { useRealtime } from '@/realtime/useRealtime'

const STATES: Record<Status, { label: string; tone: StatusTone; detail: string }> = {
  live: { label: 'Live', tone: 'active', detail: 'Updates arrive as they happen.' },
  connecting: { label: 'Connecting', tone: 'muted', detail: 'Connecting to live updates.' },
  reconnecting: { label: 'Reconnecting', tone: 'attention', detail: 'Connection lost. Reconnecting; screens refresh once it is back.' },
  offline: { label: 'Offline', tone: 'danger', detail: 'No live connection. Retrying; screens still refresh every minute.' },
}

/** The real-time connection state: a dot and a word, with detail on hover or focus. */
export function ConnectionStatus({ className, large = false }: { className?: string; large?: boolean }) {
  const { status } = useRealtime()
  const state = STATES[status]

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          role="status"
          tabIndex={0}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-sm px-1.5 py-1 outline-none focus-visible:ring-2 focus-visible:ring-ring',
            large ? 'text-base font-medium' : 'text-xs',
            status === 'live' ? 'text-muted-foreground' : STATUS_TONE_CLASSES[state.tone].text,
            className,
          )}
        >
          <span
            className={cn('shrink-0 rounded-full', large ? 'size-2.5' : 'size-2', STATUS_TONE_CLASSES[state.tone].dot)}
            aria-hidden="true"
          />
          <span className={cn(!large && status === 'live' && 'max-sm:sr-only')}>{state.label}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent>{state.detail}</TooltipContent>
    </Tooltip>
  )
}
