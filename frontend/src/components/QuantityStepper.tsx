import { Minus, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface QuantityStepperProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  /** What is being counted, for screen readers: "Quantity of Khinkali". */
  label: string
  size?: 'sm' | 'lg'
  disabled?: boolean
  className?: string
}

/** -/+ buttons around a live value; big enough to hit on a tablet at a table. */
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 50,
  label,
  size = 'sm',
  disabled = false,
  className,
}: QuantityStepperProps) {
  const button = size === 'lg' ? 'size-12' : 'size-9'
  return (
    <div role="group" aria-label={label} className={cn('flex items-center gap-1', className)}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className={cn(button, 'shrink-0')}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={disabled || value <= min}
        aria-label="One fewer"
      >
        <Minus aria-hidden="true" />
      </Button>
      <output
        aria-live="polite"
        className={cn(
          'grid place-items-center font-medium tabular-nums',
          size === 'lg' ? 'h-12 min-w-14 text-xl' : 'h-9 min-w-8 text-[15px]',
        )}
      >
        {value}
      </output>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className={cn(button, 'shrink-0')}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={disabled || value >= max}
        aria-label="One more"
      >
        <Plus aria-hidden="true" />
      </Button>
    </div>
  )
}
