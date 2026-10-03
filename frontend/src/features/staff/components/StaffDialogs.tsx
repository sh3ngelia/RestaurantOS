import { useId, useState, type ComponentProps, type FormEvent } from 'react'
import { RadioGroup } from 'radix-ui'
import { LoaderCircle } from 'lucide-react'
import { toast } from 'sonner'

import { ApiError, getErrorMessage } from '@/api/errors'
import type { StaffMember } from '@/api/staff'
import { FormAlert, FormField } from '@/components/FormField'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ROLES, ROLE_META, isRole, type Role } from '@/config/roles'
import { useFormState } from '@/hooks/useFormState'
import { fieldDescribedBy, focusById } from '@/lib/forms'
import { cn } from '@/lib/utils'
import { notifyStaffError, useCreateStaff, useQuickStaffChange, useResetPassword, useUpdateProfile } from '../hooks'
import {
  CREATE_FIELDS,
  PROFILE_FIELDS,
  RESET_FIELDS,
  roleTargetBlocker,
  validateCreate,
  validateProfileForm,
  validateReset,
  type CreateField,
  type CreateValues,
  type ProfileField,
  type ProfileValues,
  type ResetField,
} from '../rules'
import { PasswordField } from './PasswordField'

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// ── Shared name + email fields ───────────────────────────────────────────────

type NameEmailField = 'firstName' | 'lastName' | 'email'

interface NameEmailForm {
  values: Record<NameEmailField, string>
  setValue: (field: NameEmailField, value: string) => void
  touch: (field: NameEmailField) => void
  errorFor: (field: NameEmailField) => string | undefined
}

function NameEmailFields({ id, form, autoFocus }: { id: (field: NameEmailField) => string; form: NameEmailForm; autoFocus?: boolean }) {
  const field = (name: NameEmailField, label: string, extra: ComponentProps<typeof Input> = {}) => (
    <FormField id={id(name)} label={label} error={form.errorFor(name)}>
      <Input
        id={id(name)}
        value={form.values[name]}
        onChange={(e) => form.setValue(name, e.target.value)}
        onBlur={() => form.touch(name)}
        className="h-11"
        aria-invalid={!!form.errorFor(name)}
        aria-describedby={fieldDescribedBy(id(name), { error: form.errorFor(name) })}
        {...extra}
      />
    </FormField>
  )
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {field('firstName', 'First name', { autoComplete: 'off', autoFocus })}
        {field('lastName', 'Last name', { autoComplete: 'off' })}
      </div>
      {field('email', 'Work email', {
        type: 'email',
        inputMode: 'email',
        autoComplete: 'off',
        autoCapitalize: 'none',
        spellCheck: false,
        placeholder: 'name@restaurant.com',
      })}
    </>
  )
}

// ── Add staff member ─────────────────────────────────────────────────────────

export function AddStaffDialog({ open, onOpenChange }: DialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel="Close" className="max-w-xl">
        <AddStaffForm onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function AddStaffForm({ onDone }: { onDone: () => void }) {
  const baseId = useId()
  const id = (field: CreateField) => `${baseId}-${field}`
  const formErrorId = `${baseId}-form-error`
  const create = useCreateStaff()
  const form = useFormState<CreateField, CreateValues>({
    initialValues: { firstName: '', lastName: '', email: '', password: '', role: 'Waiter' },
    fields: CREATE_FIELDS,
    validate: validateCreate,
  })
  const { values } = form

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (create.isPending) return
    const invalid = form.beginSubmit()
    if (invalid) {
      focusById(id(invalid))
      return
    }
    create.mutate(
      {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        password: values.password,
        role: values.role as Role,
      },
      {
        onSuccess: (member) => {
          toast.success(`${member.fullName} added`, { description: `${member.role} · ${member.email}` })
          onDone()
        },
        onError: (error) => {
          // A 409 "A staff member with email '…' already exists." lands in the form alert.
          const field = form.applyServerError(error)
          focusById(field ? id(field) : formErrorId)
        },
      },
    )
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="grid gap-5" aria-busy={create.isPending}>
      <DialogHeader>
        <DialogTitle>Add staff member</DialogTitle>
        <DialogDescription>They sign in with this email and password. Share the password in person.</DialogDescription>
      </DialogHeader>

      <div tabIndex={-1} id={formErrorId} className="outline-none">
        <FormAlert message={form.formError} />
      </div>

      <NameEmailFields id={id} form={form} autoFocus />

      <PasswordField
        id={id('password')}
        label="Password"
        value={values.password}
        onChange={(value) => form.setValue('password', value)}
        onBlur={() => form.touch('password')}
        error={form.errorFor('password')}
      />

      <FormField id={id('role')} label="Role" error={form.errorFor('role')}>
        <Select value={values.role} onValueChange={(value) => form.setValue('role', value)}>
          <SelectTrigger
            id={id('role')}
            className="h-11"
            aria-invalid={!!form.errorFor('role')}
            aria-describedby={fieldDescribedBy(id('role'), { error: form.errorFor('role') })}
          >
            <SelectValue placeholder="Choose a role" />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((role) => (
              <SelectItem key={role} value={role}>
                {role}
                <span className="ml-2 text-muted-foreground">{ROLE_META[role].station}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={create.isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={create.isPending} aria-busy={create.isPending}>
          {create.isPending && <LoaderCircle className="animate-spin" aria-hidden="true" />}
          Add staff member
        </Button>
      </DialogFooter>
    </form>
  )
}

// ── Edit profile ─────────────────────────────────────────────────────────────

export function EditProfileDialog({ open, onOpenChange, member }: DialogProps & { member: StaffMember | null }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel="Close" className="max-w-xl">
        {member && <EditProfileForm key={member.id} member={member} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}

function EditProfileForm({ member, onDone }: { member: StaffMember; onDone: () => void }) {
  const baseId = useId()
  const id = (field: ProfileField) => `${baseId}-${field}`
  const formErrorId = `${baseId}-form-error`
  const update = useUpdateProfile()
  const form = useFormState<ProfileField, ProfileValues>({
    initialValues: { firstName: member.firstName, lastName: member.lastName, email: member.email },
    fields: PROFILE_FIELDS,
    validate: validateProfileForm,
  })
  const { values } = form

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (update.isPending) return
    const invalid = form.beginSubmit()
    if (invalid) {
      focusById(id(invalid))
      return
    }
    update.mutate(
      { id: member.id, input: { firstName: values.firstName.trim(), lastName: values.lastName.trim(), email: values.email.trim() } },
      {
        onSuccess: (saved) => {
          toast.success('Profile updated', { description: `${saved.fullName} · ${saved.email}` })
          onDone()
        },
        onError: (error) => {
          if (error instanceof ApiError && error.status === 404) {
            notifyStaffError(error, "Couldn't update the profile")
            onDone()
            return
          }
          const field = form.applyServerError(error)
          focusById(field ? id(field) : formErrorId)
        },
      },
    )
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="grid gap-5" aria-busy={update.isPending}>
      <DialogHeader>
        <DialogTitle>Edit profile</DialogTitle>
        <DialogDescription>Changing the email changes how {member.firstName} signs in.</DialogDescription>
      </DialogHeader>

      <div tabIndex={-1} id={formErrorId} className="outline-none">
        <FormAlert message={form.formError} />
      </div>

      <NameEmailFields id={id} form={form} autoFocus />

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={update.isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={update.isPending} aria-busy={update.isPending}>
          {update.isPending && <LoaderCircle className="animate-spin" aria-hidden="true" />}
          Save changes
        </Button>
      </DialogFooter>
    </form>
  )
}

// ── Change role ──────────────────────────────────────────────────────────────

export function ChangeRoleDialog({
  open,
  onOpenChange,
  member,
  team,
}: DialogProps & { member: StaffMember | null; team: StaffMember[] }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel="Close" className="max-w-lg">
        {member && <ChangeRoleForm key={member.id} member={member} team={team} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}

function ChangeRoleForm({ member, team, onDone }: { member: StaffMember; team: StaffMember[]; onDone: () => void }) {
  const labelId = useId()
  const [role, setRole] = useState<Role>(member.role)
  const [error, setError] = useState<string | null>(null)
  const change = useQuickStaffChange()
  const blocker = roleTargetBlocker(member, role, team)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (change.isPending || role === member.role || blocker) return
    setError(null)
    try {
      const updated = await change.mutateAsync({ member, change: { kind: 'role', role } })
      toast.success(`${updated.fullName}'s role is now ${updated.role}`, {
        description: 'The new role applies the next time they sign in.',
      })
      onDone()
    } catch (err) {
      // 409s such as "You cannot change your own role." stay visible in the dialog.
      setError(getErrorMessage(err))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5" aria-busy={change.isPending}>
      <DialogHeader>
        <DialogTitle>Change role</DialogTitle>
        <DialogDescription>
          {member.fullName} currently has the {member.role} role, which decides the modules they see.
        </DialogDescription>
      </DialogHeader>

      <FormAlert message={error} />

      <RadioGroup.Root
        aria-labelledby={labelId}
        value={role}
        onValueChange={(value) => {
          if (isRole(value)) setRole(value)
          setError(null)
        }}
        className="grid gap-2 sm:grid-cols-2"
      >
        <span id={labelId} className="sr-only">
          Role
        </span>
        {ROLES.map((option) => {
          const current = option === member.role
          return (
            <RadioGroup.Item
              key={option}
              value={option}
              className={cn(
                'flex min-h-16 flex-col items-start gap-1 rounded-xl border border-border bg-card px-3.5 py-3 text-left outline-none',
                'transition-[border-color,background-color] duration-150 hover:border-border-strong',
                'focus-visible:ring-2 focus-visible:ring-ring',
                'data-[state=checked]:border-primary data-[state=checked]:bg-primary-soft',
              )}
            >
              <span className="flex w-full items-center justify-between gap-2">
                <span className="text-sm font-medium">{option}</span>
                {current && <span className="text-[11px] text-muted-foreground">Current</span>}
              </span>
              <span className="text-xs text-muted-foreground">{ROLE_META[option].station}</span>
            </RadioGroup.Item>
          )
        })}
      </RadioGroup.Root>

      {blocker && <p className="text-sm text-destructive">{blocker}</p>}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={change.isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={change.isPending || role === member.role || !!blocker} aria-busy={change.isPending}>
          {change.isPending && <LoaderCircle className="animate-spin" aria-hidden="true" />}
          {role === member.role ? 'Choose a new role' : `Change to ${role}`}
        </Button>
      </DialogFooter>
    </form>
  )
}

// ── Reset password ───────────────────────────────────────────────────────────

export function ResetPasswordDialog({ open, onOpenChange, member }: DialogProps & { member: StaffMember | null }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel="Close" className="max-w-lg">
        {member && <ResetPasswordForm key={member.id} member={member} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}

function ResetPasswordForm({ member, onDone }: { member: StaffMember; onDone: () => void }) {
  const baseId = useId()
  const id = (field: ResetField) => `${baseId}-${field}`
  const formErrorId = `${baseId}-form-error`
  const reset = useResetPassword()
  const form = useFormState<ResetField, Record<ResetField, string>>({
    initialValues: { newPassword: '' },
    fields: RESET_FIELDS,
    validate: validateReset,
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (reset.isPending) return
    const invalid = form.beginSubmit()
    if (invalid) {
      focusById(id(invalid))
      return
    }
    reset.mutate(
      { id: member.id, newPassword: form.values.newPassword },
      {
        onSuccess: () => {
          toast.success(`Password reset for ${member.fullName}`, { description: 'Give them the new password in person.' })
          onDone()
        },
        onError: (error) => {
          if (error instanceof ApiError && error.status === 404) {
            notifyStaffError(error, "Couldn't reset the password")
            onDone()
            return
          }
          const field = form.applyServerError(error)
          focusById(field ? id(field) : formErrorId)
        },
      },
    )
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="grid gap-5" aria-busy={reset.isPending}>
      <DialogHeader>
        <DialogTitle>Reset password</DialogTitle>
        <DialogDescription>
          Set a new password for {member.fullName}. Their current password stops working straight away.
        </DialogDescription>
      </DialogHeader>

      <div tabIndex={-1} id={formErrorId} className="outline-none">
        <FormAlert message={form.formError} />
      </div>

      <PasswordField
        id={id('newPassword')}
        label="New password"
        value={form.values.newPassword}
        onChange={(value) => form.setValue('newPassword', value)}
        onBlur={() => form.touch('newPassword')}
        error={form.errorFor('newPassword')}
      />

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={reset.isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={reset.isPending} aria-busy={reset.isPending}>
          {reset.isPending && <LoaderCircle className="animate-spin" aria-hidden="true" />}
          Reset password
        </Button>
      </DialogFooter>
    </form>
  )
}
