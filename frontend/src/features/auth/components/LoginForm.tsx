import { useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'motion/react'
import { CircleAlert, Eye, EyeOff, LoaderCircle } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router'
import { toast } from 'sonner'

import { authApi, type LoginRequest } from '@/api/auth'
import { getErrorMessage } from '@/api/errors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FAST, collapseMotion } from '@/lib/motion'
import type { LoginLocationState } from '../ProtectedRoute'
import { useAuth } from '../useAuth'

type Field = keyof LoginRequest
type FieldErrors = Partial<Record<Field, string>>

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate(values: LoginRequest): FieldErrors {
  const errors: FieldErrors = {}
  const email = values.email.trim()
  if (!email) errors.email = 'Enter your work email.'
  else if (!EMAIL_PATTERN.test(email)) errors.email = "That doesn't look like an email address."
  if (!values.password) errors.password = 'Enter your password.'
  return errors
}

/** Only follow redirects back into this app. */
function safeRedirect(from: unknown) {
  return typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') && from !== '/login' ? from : '/'
}

export function LoginForm() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const ids = { email: useId(), password: useId(), error: useId() }
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  const [values, setValues] = useState<LoginRequest>({ email: '', password: '' })
  const [touched, setTouched] = useState<Record<Field, boolean>>({ email: false, password: false })
  const [submitted, setSubmitted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [capsLock, setCapsLock] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const login = useMutation({ mutationFn: authApi.login })

  const errors = validate(values)
  const visibleError = (field: Field) => ((touched[field] || submitted) && errors[field]) || undefined
  const serverError = formError ?? (login.error ? getErrorMessage(login.error) : null)

  function update(field: Field, value: string) {
    setValues((v) => ({ ...v, [field]: value }))
    if (login.error) login.reset()
    if (formError) setFormError(null)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (login.isPending) return
    setSubmitted(true)

    const firstInvalid = (['email', 'password'] as const).find((field) => errors[field])
    if (firstInvalid) {
      const target = firstInvalid === 'email' ? emailRef : passwordRef
      target.current?.focus()
      return
    }

    login.mutate(
      { email: values.email.trim(), password: values.password },
      {
        onSuccess: (response) => {
          try {
            const session = signIn(response)
            toast.success(`Signed in as ${session.fullName}`)
            navigate(safeRedirect((location.state as LoginLocationState | null)?.from), { replace: true })
          } catch (error) {
            setFormError(getErrorMessage(error))
          }
        },
        onError: () => {
          passwordRef.current?.select()
        },
      },
    )
  }

  function trackCapsLock(event: KeyboardEvent<HTMLInputElement>) {
    setCapsLock(event.getModifierState('CapsLock'))
  }

  const emailError = visibleError('email')
  const passwordError = visibleError('password')

  return (
    <form noValidate onSubmit={handleSubmit} aria-describedby={serverError ? ids.error : undefined} className="space-y-4">
      <AnimatePresence initial={false}>
        {serverError && (
          <motion.div key="server-error" {...collapseMotion} className="overflow-hidden">
            <div
              id={ids.error}
              role="alert"
              className="flex gap-2.5 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-foreground"
            >
              <CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
              <p>{serverError}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-1.5">
        <Label htmlFor={ids.email}>Work email</Label>
        <Input
          ref={emailRef}
          id={ids.email}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          autoFocus
          placeholder="you@restaurant.com"
          value={values.email}
          readOnly={login.isPending}
          onChange={(e) => update('email', e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, email: true }))}
          aria-invalid={!!emailError}
          aria-describedby={emailError ? `${ids.email}-error` : undefined}
        />
        <FieldError id={`${ids.email}-error`} message={emailError} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={ids.password}>Password</Label>
        <div className="relative">
          <Input
            ref={passwordRef}
            id={ids.password}
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Your password"
            value={values.password}
            readOnly={login.isPending}
            onChange={(e) => update('password', e.target.value)}
            onBlur={() => {
              setTouched((t) => ({ ...t, password: true }))
              setCapsLock(false)
            }}
            onKeyDown={trackCapsLock}
            onKeyUp={trackCapsLock}
            aria-invalid={!!passwordError}
            aria-describedby={
              [passwordError && `${ids.password}-error`, capsLock && `${ids.password}-caps`].filter(Boolean).join(' ') ||
              undefined
            }
            className="pr-11"
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-label="Show password"
            aria-pressed={showPassword}
            title={showPassword ? 'Hide password' : 'Show password'}
            aria-controls={ids.password}
            className="absolute inset-y-1 right-1 grid w-8 place-items-center rounded-sm text-muted-foreground transition-colors duration-150 outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            {showPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
          </button>
        </div>
        <FieldError id={`${ids.password}-error`} message={passwordError} />
        {capsLock && (
          <p id={`${ids.password}-caps`} className="text-[13px] text-muted-foreground">
            Caps Lock is on.
          </p>
        )}
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={login.isPending} aria-busy={login.isPending}>
        {login.isPending && <LoaderCircle className="animate-spin" aria-hidden="true" />}
        {login.isPending ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  )
}

function FieldError({ id, message }: { id: string; message: string | undefined }) {
  return (
    <AnimatePresence initial={false}>
      {message && (
        <motion.p
          key={message}
          id={id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={FAST}
          className="flex items-center gap-1.5 text-[13px] text-destructive"
        >
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  )
}
