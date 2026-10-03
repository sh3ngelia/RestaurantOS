import type { StaffMember } from '@/api/staff'
import type { Role } from '@/config/roles'

/*
 * Client rules mirroring the staff validators and the User column limits
 * (first/last name 100, email 256, unique). The server stays authoritative.
 */
export const STAFF_LIMITS = { name: 100, email: 256 } as const

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// ── Password rules (also drive the live checklist) ───────────────────────────

export interface PasswordRule {
  id: string
  label: string
  test: (password: string) => boolean
}

export const PASSWORD_RULES: readonly PasswordRule[] = [
  { id: 'length', label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { id: 'letter', label: 'At least one letter', test: (p) => /\p{L}/u.test(p) },
  { id: 'digit', label: 'At least one digit', test: (p) => /\d/.test(p) },
]

export function validatePassword(password: string): string | undefined {
  if (!password) return 'Enter a password.'
  const failed = PASSWORD_RULES.find((rule) => !rule.test(password))
  return failed ? `Password needs ${failed.label.toLowerCase()}.` : undefined
}

/** A uniform integer in [0, n) from the browser's CSPRNG (rejection sampling avoids modulo bias). */
function randomInt(n: number): number {
  const buffer = new Uint32Array(1)
  const limit = Math.floor(0x1_0000_0000 / n) * n
  let value: number
  do {
    crypto.getRandomValues(buffer)
    value = buffer[0] as number
  } while (value >= limit)
  return value % n
}

/**
 * A readable 14-character password that always satisfies PASSWORD_RULES. Characters
 * that are easy to misread when handed over in person (0/O, 1/l/I) are left out.
 */
export function generatePassword(length = 14): string {
  const letters = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ'
  const digits = '23456789'
  const all = letters + digits
  const pick = (alphabet: string) => alphabet[randomInt(alphabet.length)] as string
  // Guarantee a letter and a digit, then shuffle (Fisher-Yates) so their positions vary.
  const chars = [pick(letters), pick(digits), ...Array.from({ length: length - 2 }, () => pick(all))]
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    const tmp = chars[i] as string
    chars[i] = chars[j] as string
    chars[j] = tmp
  }
  return chars.join('')
}

// ── Profile fields ───────────────────────────────────────────────────────────

type Errors<F extends string> = Partial<Record<F, string>>

function validateProfile(values: { firstName: string; lastName: string; email: string }) {
  const errors: Errors<'firstName' | 'lastName' | 'email'> = {}
  const first = values.firstName.trim()
  const last = values.lastName.trim()
  const email = values.email.trim()
  if (!first) errors.firstName = 'First name is required.'
  else if (first.length > STAFF_LIMITS.name) errors.firstName = `Keep it under ${STAFF_LIMITS.name} characters.`
  if (!last) errors.lastName = 'Last name is required.'
  else if (last.length > STAFF_LIMITS.name) errors.lastName = `Keep it under ${STAFF_LIMITS.name} characters.`
  if (!email) errors.email = 'Email is required.'
  else if (email.length > STAFF_LIMITS.email) errors.email = `Keep it under ${STAFF_LIMITS.email} characters.`
  else if (!EMAIL_PATTERN.test(email)) errors.email = "That doesn't look like an email address."
  return errors
}

export const CREATE_FIELDS = ['firstName', 'lastName', 'email', 'password', 'role'] as const
export type CreateField = (typeof CREATE_FIELDS)[number]
export type CreateValues = Record<CreateField, string>

export function validateCreate(values: CreateValues): Errors<CreateField> {
  const errors: Errors<CreateField> = validateProfile(values)
  const password = validatePassword(values.password)
  if (password) errors.password = password
  if (!values.role) errors.role = 'Choose a role.'
  return errors
}

export const PROFILE_FIELDS = ['firstName', 'lastName', 'email'] as const
export type ProfileField = (typeof PROFILE_FIELDS)[number]
export type ProfileValues = Record<ProfileField, string>

export const validateProfileForm = (values: ProfileValues): Errors<ProfileField> => validateProfile(values)

export const RESET_FIELDS = ['newPassword'] as const
export type ResetField = (typeof RESET_FIELDS)[number]

export function validateReset(values: Record<ResetField, string>): Errors<ResetField> {
  const message = validatePassword(values.newPassword)
  return message ? { newPassword: message } : {}
}

// ── Guards (mirror the API's 409s so the UI can explain before it fails) ─────

export const isSelf = (member: StaffMember, currentUserId: string | null) =>
  !!currentUserId && member.id.toLowerCase() === currentUserId.toLowerCase()

/** True when this member is the only active manager left. */
export function isLastActiveManager(member: StaffMember, team: StaffMember[]) {
  if (member.role !== 'Manager' || !member.isActive) return false
  return team.filter((m) => m.role === 'Manager' && m.isActive).length === 1
}

/** Why the role can't be changed, or null if it can. */
export function roleChangeBlocker(member: StaffMember, currentUserId: string | null) {
  if (isSelf(member, currentUserId)) return 'You can’t change your own role.'
  if (!member.isActive) return 'Activate this account before changing its role.'
  return null
}

/** Why moving the member to `role` would be refused, or null if it's fine. */
export function roleTargetBlocker(member: StaffMember, role: Role, team: StaffMember[]) {
  if (role !== 'Manager' && isLastActiveManager(member, team)) {
    return 'The restaurant must always have at least one active manager.'
  }
  return null
}

/** Why the account can't be deactivated, or null if it can. */
export function deactivateBlocker(member: StaffMember, team: StaffMember[], currentUserId: string | null) {
  if (isSelf(member, currentUserId)) return 'You can’t deactivate your own account.'
  if (isLastActiveManager(member, team)) return 'The restaurant must always have at least one active manager.'
  return null
}
