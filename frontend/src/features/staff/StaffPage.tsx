import { useDeferredValue, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { CircleAlert, RefreshCw, Search, SearchX, UserPlus, Users, X } from 'lucide-react'
import { toast } from 'sonner'

import { getErrorMessage } from '@/api/errors'
import type { StaffMember } from '@/api/staff'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { ROLES, isRole, type Role } from '@/config/roles'
import { getTokenSubject } from '@/features/auth/session'
import { useSession } from '@/features/auth/useAuth'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { cn } from '@/lib/utils'
import { StaffRow } from './components/StaffRow'
import { AddStaffDialog, ChangeRoleDialog, EditProfileDialog, ResetPasswordDialog } from './components/StaffDialogs'
import { notifyStaffError, useQuickStaffChange, useStaff } from './hooks'
import { deactivateBlocker, isSelf, roleChangeBlocker } from './rules'

const EASE = [0.2, 0.8, 0.2, 1] as const
type StatusFilter = 'all' | 'active' | 'inactive'
type DialogState = { open: boolean; member: StaffMember | null }
const CLOSED: DialogState = { open: false, member: null }

/** Accent- and case-insensitive. */
const normalize = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase()

export function StaffPage() {
  useDocumentTitle('Staff')
  const session = useSession()
  const currentUserId = getTokenSubject(session.token)
  const query = useStaff()
  const quickChange = useQuickStaffChange()
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const needle = normalize(useDeferredValue(search).trim())

  const roleParam = searchParams.get('role')
  const roleFilter: Role | 'all' = isRole(roleParam) ? roleParam : 'all'
  const statusParam = searchParams.get('status')
  const statusFilter: StatusFilter = statusParam === 'active' || statusParam === 'inactive' ? statusParam : 'all'

  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<DialogState>(CLOSED)
  const [changingRole, setChangingRole] = useState<DialogState>(CLOSED)
  const [resetting, setResetting] = useState<DialogState>(CLOSED)
  const [toggling, setToggling] = useState<DialogState>(CLOSED)

  const team = useMemo(() => query.data ?? [], [query.data])
  const counts = useMemo(() => {
    const byRole = Object.fromEntries(ROLES.map((r) => [r, 0])) as Record<Role, number>
    let active = 0
    for (const m of team) {
      byRole[m.role] += 1
      if (m.isActive) active += 1
    }
    return { byRole, active, inactive: team.length - active }
  }, [team])

  const visible = useMemo(
    () =>
      team
        .filter((m) => roleFilter === 'all' || m.role === roleFilter)
        .filter((m) => statusFilter === 'all' || (statusFilter === 'active') === m.isActive)
        .filter((m) => !needle || normalize(m.fullName).includes(needle) || normalize(m.email).includes(needle))
        // Active before inactive, then by name.
        .sort((a, b) => Number(b.isActive) - Number(a.isActive) || a.fullName.localeCompare(b.fullName)),
    [team, roleFilter, statusFilter, needle],
  )
  const groups = ROLES.map((role) => ({ role, members: visible.filter((m) => m.role === role) })).filter((g) => g.members.length)

  function setFilter(key: 'role' | 'status', value: string) {
    const next = new URLSearchParams(searchParams)
    if (value === 'all') next.delete(key)
    else next.set(key, value)
    setSearchParams(next, { replace: true, preventScrollReset: true })
  }

  // The live row, so a confirmation always reflects the latest state.
  const toggleTarget = toggling.member ? (team.find((m) => m.id === toggling.member?.id) ?? toggling.member) : null

  async function confirmToggle() {
    if (!toggleTarget) return
    const activate = !toggleTarget.isActive
    try {
      const updated = await quickChange.mutateAsync({ member: toggleTarget, change: { kind: 'active', isActive: activate } })
      toast.success(activate ? `${updated.fullName} can sign in again` : `${updated.fullName} deactivated`, {
        description: activate ? `${updated.role} · ${updated.email}` : 'They can no longer sign in.',
      })
    } catch (error) {
      notifyStaffError(error, activate ? "Couldn't activate the account" : "Couldn't deactivate the account")
      throw error
    }
  }

  const loading = query.isPending

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[11px] tracking-[0.18em] text-primary uppercase">Business</p>
          <h1 className="mt-3 text-4xl leading-[1.05] font-light sm:text-5xl">Staff</h1>
          <p className="mt-3 text-[15px] text-muted-foreground" aria-live="polite">
            {loading || query.isError
              ? 'Accounts, roles and access for the whole team.'
              : `${team.length} ${team.length === 1 ? 'person' : 'people'} · ${counts.active} active${
                  counts.inactive ? ` · ${counts.inactive} inactive` : ''
                }`}
          </p>
        </div>
        <Button size="lg" onClick={() => setAdding(true)}>
          <UserPlus aria-hidden="true" />
          Add staff member
        </Button>
      </header>

      {!loading && !query.isError && (
        <div className="space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-sm">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <label htmlFor="staff-search" className="sr-only">
                Search by name or email
              </label>
              <Input
                id="staff-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape' && search) {
                    e.preventDefault()
                    setSearch('')
                  }
                }}
                placeholder="Search by name or email"
                autoComplete="off"
                className="h-11 pr-11 pl-10 [&::-webkit-search-cancel-button]:hidden"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                  className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              )}
            </div>

            <div role="group" aria-label="Status" className="grid grid-cols-3 gap-1 rounded-xl border border-border bg-card p-1 lg:w-80">
              {(
                [
                  ['all', `All ${team.length}`],
                  ['active', `Active ${counts.active}`],
                  ['inactive', `Inactive ${counts.inactive}`],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={statusFilter === value}
                  onClick={() => setFilter('status', value)}
                  className={cn(
                    'h-9 rounded-lg text-sm text-muted-foreground tabular-nums outline-none transition-colors',
                    'focus-visible:ring-2 focus-visible:ring-ring',
                    statusFilter === value && 'bg-accent font-medium text-foreground',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <nav aria-label="Filter by role">
            <ul className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {(['all', ...ROLES] as const).map((role) => {
                const active = roleFilter === role
                const count = role === 'all' ? team.length : counts.byRole[role]
                return (
                  <li key={role} className="shrink-0">
                    <Link
                      to={{ search: roleSearch(searchParams, role) }}
                      replace
                      preventScrollReset
                      aria-current={active ? 'true' : undefined}
                      className={cn(
                        'flex h-10 items-center gap-2 rounded-full border px-4 text-sm whitespace-nowrap outline-none',
                        'transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring',
                        active
                          ? 'border-foreground/80 bg-foreground font-medium text-background'
                          : 'border-border text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                      )}
                    >
                      {role === 'all' ? 'All roles' : role}
                      <span className={cn('font-mono text-[11px] tabular-nums', active ? 'text-background/70' : 'text-muted-foreground/80')}>
                        {count}
                        <span className="sr-only"> {count === 1 ? 'person' : 'people'}</span>
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>
      )}

      {loading ? (
        <div className="space-y-3" role="status" aria-label="Loading the team">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
              <Skeleton className="size-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3.5 w-56 max-w-full" />
              </div>
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          ))}
        </div>
      ) : query.isError ? (
        <EmptyState
          icon={CircleAlert}
          title="The team didn’t load"
          description={getErrorMessage(query.error)}
          action={
            <Button variant="outline" onClick={() => void query.refetch()}>
              <RefreshCw aria-hidden="true" />
              Try again
            </Button>
          }
        />
      ) : team.length <= 1 && !needle && roleFilter === 'all' && statusFilter === 'all' ? (
        <EmptyState
          icon={Users}
          title="It’s just you so far"
          description="Add your hosts, waiters, kitchen and bar staff so everyone signs in with their own account."
          action={
            <Button size="lg" onClick={() => setAdding(true)}>
              <UserPlus aria-hidden="true" />
              Add staff member
            </Button>
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No one matches"
          description="Try another name, or clear the filters."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setSearch('')
                setSearchParams({}, { replace: true, preventScrollReset: true })
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.role} aria-labelledby={`staff-group-${group.role}`}>
              <h2
                id={`staff-group-${group.role}`}
                className="mb-3 flex items-baseline justify-between border-b border-border pb-2 text-xl font-normal"
              >
                {group.role === 'Host' ? 'Hosts' : group.role === 'Kitchen' ? 'Kitchen' : group.role === 'Bar' ? 'Bar' : `${group.role}s`}
                <span className="font-mono text-[11px] tracking-wide text-muted-foreground tabular-nums">
                  {group.members.length}
                </span>
              </h2>
              <ul className="space-y-2.5">
                <AnimatePresence initial={false} mode="popLayout">
                  {group.members.map((member) => (
                    <motion.li
                      key={member.id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, transition: { duration: 0.15 } }}
                      transition={{ duration: 0.22, ease: EASE }}
                    >
                      <StaffRow
                        member={member}
                        isYou={isSelf(member, currentUserId)}
                        roleBlocker={roleChangeBlocker(member, currentUserId)}
                        deactivateBlocker={deactivateBlocker(member, team, currentUserId)}
                        onEdit={() => setEditing({ open: true, member })}
                        onChangeRole={() => setChangingRole({ open: true, member })}
                        onResetPassword={() => setResetting({ open: true, member })}
                        onToggleActive={() => setToggling({ open: true, member })}
                      />
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </section>
          ))}
        </div>
      )}

      <AddStaffDialog open={adding} onOpenChange={setAdding} />
      <EditProfileDialog
        open={editing.open}
        onOpenChange={(open) => setEditing((s) => ({ ...s, open }))}
        member={editing.member}
      />
      <ChangeRoleDialog
        open={changingRole.open}
        onOpenChange={(open) => setChangingRole((s) => ({ ...s, open }))}
        member={changingRole.member}
        team={team}
      />
      <ResetPasswordDialog
        open={resetting.open}
        onOpenChange={(open) => setResetting((s) => ({ ...s, open }))}
        member={resetting.member}
      />
      {toggleTarget && (
        <ConfirmDialog
          open={toggling.open}
          onOpenChange={(open) => setToggling((s) => ({ ...s, open }))}
          title={toggleTarget.isActive ? `Deactivate ${toggleTarget.fullName}?` : `Activate ${toggleTarget.fullName}?`}
          description={
            toggleTarget.isActive
              ? 'They won’t be able to sign in until the account is activated again.'
              : `They can sign in again with their current password, keeping the ${toggleTarget.role} role.`
          }
          confirmLabel={toggleTarget.isActive ? 'Deactivate' : 'Activate'}
          confirmVariant={toggleTarget.isActive ? 'destructive' : 'default'}
          onConfirm={confirmToggle}
        />
      )}
    </div>
  )
}

/** Keeps ?status= while switching ?role=. */
function roleSearch(params: URLSearchParams, role: Role | 'all') {
  const next = new URLSearchParams(params)
  if (role === 'all') next.delete('role')
  else next.set('role', role)
  const query = next.toString()
  return query ? `?${query}` : ''
}
