import { useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Pencil } from 'lucide-react'
import { toast } from 'sonner'

import type { MenuItem } from '@/api/menu'
import { formatPrice, parsePrice, priceInputValue } from '@/lib/format'
import { cn } from '@/lib/utils'
import { notifyMenuError, useChangePrice } from '../hooks'
import { validatePrice } from '../validation'

interface PriceEditorProps {
  item: MenuItem
  editable: boolean
  muted?: boolean
}

/** The price on an item card. For managers it's a button that turns into an inline input. */
export function PriceEditor({ item, editable, muted = false }: PriceEditorProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string>()
  const buttonRef = useRef<HTMLButtonElement>(null)
  // Set once an edit is committed or cancelled, so a blur fired as the input unmounts can't commit twice.
  const settledRef = useRef(false)
  const inputId = useId()
  const changePrice = useChangePrice()

  const priceClassName = cn('text-[15px] font-medium tabular-nums', muted && 'text-muted-foreground')

  if (!editable) return <span className={priceClassName}>{formatPrice(item.price)}</span>

  function startEditing() {
    setDraft(priceInputValue(item.price))
    setError(undefined)
    settledRef.current = false
    setEditing(true)
  }

  function stopEditing(restoreFocus: boolean) {
    settledRef.current = true
    setEditing(false)
    if (restoreFocus) requestAnimationFrame(() => buttonRef.current?.focus())
  }

  /** Enter keeps the editor open on invalid input; blurring away simply discards it. */
  function commit(fromKeyboard: boolean) {
    if (settledRef.current) return
    const message = validatePrice(draft)
    if (message) {
      if (fromKeyboard) setError(message)
      else stopEditing(false)
      return
    }
    const price = parsePrice(draft) as number
    stopEditing(fromKeyboard)
    if (price === item.price) return

    const previous = item.price
    changePrice.mutate(
      { item, price },
      {
        onSuccess: (updated) =>
          toast.success(`${updated.name} is now ${formatPrice(updated.price)}`, {
            description: `Was ${formatPrice(previous)}.`,
          }),
        onError: (err) => notifyMenuError(err, `Couldn't change the price of ${item.name}`),
      },
    )
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    commit(true)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      stopEditing(true)
    }
  }

  if (editing) {
    return (
      <form onSubmit={handleSubmit} className="relative shrink-0">
        <label htmlFor={inputId} className="sr-only">
          Price for {item.name}
        </label>
        <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-sm text-muted-foreground" aria-hidden="true">
          €
        </span>
        <input
          id={inputId}
          autoFocus
          inputMode="decimal"
          autoComplete="off"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value)
            setError(undefined)
          }}
          onFocus={(e) => e.currentTarget.select()}
          onBlur={() => commit(false)}
          onKeyDown={handleKeyDown}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : `${inputId}-hint`}
          className={cn(
            'h-8 w-28 rounded-md border border-ring bg-sunken pr-2 pl-6 text-right text-[15px] font-medium tabular-nums outline-none',
            'ring-[3px] ring-ring/25 aria-invalid:border-destructive aria-invalid:ring-destructive/25',
          )}
        />
        <span id={`${inputId}-hint`} className="sr-only">
          Press Enter to save or Escape to cancel.
        </span>
        {error && (
          <p
            id={`${inputId}-error`}
            role="alert"
            className="absolute top-full right-0 z-10 mt-1.5 w-max max-w-48 rounded-md border border-destructive/30 bg-popover px-2 py-1 text-xs text-destructive shadow-soft"
          >
            {error}
          </p>
        )}
      </form>
    )
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={startEditing}
      aria-label={`Change price of ${item.name}, currently ${formatPrice(item.price)}`}
      className={cn(
        'group/price -mr-1.5 flex h-8 shrink-0 items-center gap-1.5 rounded-md px-1.5 outline-none transition-colors',
        'hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring',
        priceClassName,
      )}
    >
      <Pencil
        className="size-3 text-muted-foreground opacity-0 transition-opacity group-hover/price:opacity-100 group-focus-visible/price:opacity-100"
        aria-hidden="true"
      />
      {formatPrice(item.price)}
    </button>
  )
}
