import { useState } from 'react'
import { Circle, CircleCheck, Copy, Dices, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

import { FormField } from '@/components/FormField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { PASSWORD_RULES, generatePassword } from '../rules'

interface PasswordFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  onBlur: () => void
  error?: string
}

/**
 * New-password input for an account the manager hands over in person: show/hide,
 * a generator that reveals what it made, copy, and a live checklist of the rules.
 */
export function PasswordField({ id, label, value, onChange, onBlur, error }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)
  const checklistId = `${id}-rules`

  function generate() {
    onChange(generatePassword())
    // Reveal it: a generated password is only useful if the manager can read it out.
    setVisible(true)
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      toast.success('Password copied', { description: 'Share it with them in person, not by message.' })
    } catch {
      toast.error('Couldn’t copy', { description: 'Select the password and copy it manually.' })
    }
  }

  return (
    <FormField id={id} label={label} error={error}>
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Input
            id={id}
            type={visible ? 'text' : 'password'}
            autoComplete="new-password"
            spellCheck={false}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            className={cn('h-11 pr-11', visible && 'font-mono tracking-wide')}
            aria-invalid={!!error}
            aria-describedby={[checklistId, error ? `${id}-error` : null].filter(Boolean).join(' ')}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label="Show password"
            aria-pressed={visible}
            aria-controls={id}
            title={visible ? 'Hide password' : 'Show password'}
            className="absolute inset-y-1.5 right-1.5 grid w-9 place-items-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            {visible ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
          </button>
        </div>
        <Button type="button" variant="outline" className="h-11 shrink-0" onClick={generate}>
          <Dices aria-hidden="true" />
          Generate
        </Button>
        {value && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" variant="outline" size="icon" className="size-11 shrink-0" onClick={copy} aria-label="Copy password">
                <Copy aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy password</TooltipContent>
          </Tooltip>
        )}
      </div>

      <ul id={checklistId} aria-label="Password requirements" className="grid gap-1 pt-0.5 sm:grid-cols-3">
        {PASSWORD_RULES.map((rule) => {
          const met = rule.test(value)
          const Icon = met ? CircleCheck : Circle
          return (
            <li
              key={rule.id}
              className={cn('flex items-center gap-1.5 text-xs transition-colors duration-150', met ? 'text-foreground' : 'text-muted-foreground')}
            >
              <Icon className={cn('size-3.5 shrink-0', met && 'text-primary')} aria-hidden="true" />
              {rule.label}
              <span className="sr-only">{met ? ', met' : ', not met'}</span>
            </li>
          )
        })}
      </ul>
    </FormField>
  )
}
