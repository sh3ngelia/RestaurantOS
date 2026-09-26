import { useCallback, useState } from 'react'

import { ApiError, getErrorMessage, mapValidationErrors } from '@/api/errors'

type Errors<F extends string> = Partial<Record<F, string>>

interface Options<F extends string, V extends Record<F, string>> {
  initialValues: V
  fields: readonly F[]
  validate: (values: V) => Errors<F>
  /** Server property names that differ from form field names, e.g. { NewPrice: 'price' }. */
  aliases?: Record<string, F>
}

/**
 * Form state for the app's forms: client validation shown after blur/submit,
 * server validation errors mapped onto fields, and a form-level message for
 * everything else (409 conflicts, network errors, unmapped validation keys).
 */
export function useFormState<F extends string, V extends Record<F, string>>({
  initialValues,
  fields,
  validate,
  aliases,
}: Options<F, V>) {
  const [values, setValues] = useState<V>(initialValues)
  const [touched, setTouched] = useState<Partial<Record<F, boolean>>>({})
  const [submitted, setSubmitted] = useState(false)
  const [serverErrors, setServerErrors] = useState<Errors<F>>({})
  const [formError, setFormError] = useState<string | null>(null)

  const clientErrors = validate(values)

  const setValue = useCallback((field: F, value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
    // Editing retires the server's complaint about that field, and any form-level message
    // (e.g. a 409 "already exists"), which no longer describes what's in the form.
    setServerErrors((current) => (current[field] ? { ...current, [field]: undefined } : current))
    setFormError(null)
  }, [])

  const touch = useCallback((field: F) => setTouched((current) => ({ ...current, [field]: true })), [])

  function errorFor(field: F): string | undefined {
    return ((touched[field] || submitted) && clientErrors[field]) || serverErrors[field] || undefined
  }

  /** Marks the form submitted; returns the first invalid field, or null when it can be sent. */
  function beginSubmit(): F | null {
    setSubmitted(true)
    setFormError(null)
    return fields.find((field) => clientErrors[field]) ?? null
  }

  /** Routes a failed request's error to the right place. Returns the first field that received an error. */
  function applyServerError(error: unknown): F | null {
    const mapped = mapValidationErrors(error, fields, aliases)
    setServerErrors(mapped.fields)
    const firstField = fields.find((field) => mapped.fields[field]) ?? null

    if (mapped.unmatched.length > 0) setFormError(mapped.unmatched.join(' '))
    else if (!firstField) setFormError(getErrorMessage(error))
    else setFormError(error instanceof ApiError && error.status !== 400 ? getErrorMessage(error) : null)

    return firstField
  }

  return { values, setValue, touch, errorFor, formError, beginSubmit, applyServerError }
}
