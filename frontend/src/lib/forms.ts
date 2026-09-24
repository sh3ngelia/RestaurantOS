/** aria-describedby for a control rendered inside <FormField id={id}>. */
export function fieldDescribedBy(id: string, { error, hint }: { error?: string; hint?: unknown }) {
  return [hint && !error ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') || undefined
}

/** Moves focus to a form control by id (used to jump to the first invalid field). */
export function focusById(id: string) {
  document.getElementById(id)?.focus()
}
