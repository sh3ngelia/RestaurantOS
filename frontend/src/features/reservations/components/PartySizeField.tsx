import { Minus, Plus } from 'lucide-react'

import { FormField } from '@/components/FormField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { fieldDescribedBy } from '@/lib/forms'
import { RESERVATION_LIMITS } from '../validation'

interface PartySizeFieldProps {
  id: string
  value: string
  onChange: (value: string) => void
  onBlur: () => void
  error?: string
}

/** Guest count with large -/+ buttons for tablets; typing still works. */
export function PartySizeField({ id, value, onChange, onBlur, error }: PartySizeFieldProps) {
  const n = Number(value)
  const valid = Number.isInteger(n) && n >= RESERVATION_LIMITS.guestsMin && n <= RESERVATION_LIMITS.guestsMax

  function step(delta: number) {
    const current = valid ? n : 2
    onChange(String(Math.min(RESERVATION_LIMITS.guestsMax, Math.max(RESERVATION_LIMITS.guestsMin, current + delta))))
  }

  return (
    <FormField id={id} label="Party size" error={error}>
      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0"
          onClick={() => step(-1)}
          disabled={valid && n <= RESERVATION_LIMITS.guestsMin}
          aria-label="One guest fewer"
        >
          <Minus aria-hidden="true" />
        </Button>
        <Input
          id={id}
          inputMode="numeric"
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          className="min-w-0 text-center tabular-nums"
          aria-invalid={!!error}
          aria-describedby={fieldDescribedBy(id, { error })}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0"
          onClick={() => step(1)}
          disabled={valid && n >= RESERVATION_LIMITS.guestsMax}
          aria-label="One guest more"
        >
          <Plus aria-hidden="true" />
        </Button>
      </div>
    </FormField>
  )
}
