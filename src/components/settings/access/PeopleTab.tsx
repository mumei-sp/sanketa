/**
 * PeopleTab — who holds which role, and which classes they cover.
 *
 * The role editor next door could define "Librarian" and never make anyone
 * one: roles were data, but the only thing that ever set a person's role was
 * the login. This is the other half, which is why the two are one screen.
 *
 * Class assignment lives here rather than on the teacher form, because a
 * class-scoped role is useless without it — assign someone "Teacher" with no
 * classes and they can read the school and write nothing. Role and scope are
 * one decision, so they are one control.
 *
 * Saves as you go, like the role editor and for the same reason: users are a
 * shared table behind a service, and holding them in the settings panel's
 * draft would risk overwriting another admin's edit on Save. Every write is
 * logged; see `record`.
 *
 * Changes take effect at the person's next sign-in. The session carries the
 * role and the class list the way a token would, so an admin editing someone
 * else does not reach into a session they do not own.
 */

import * as React from 'react'
import { Info, AlertTriangle, Layers, UserPlus } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppToast } from '@/hooks/use-app-toast'
import { border, text } from '@/theme/colors'
import { cn } from '@/lib/utils'
import { getInitials } from '@/utils/format'
import { useCurrentUser } from '@/hooks/use-current-user'
import { usePermissions } from '@/features/auth/PermissionContext'
import type { SchoolUser } from '@/api/services/user-service'
import type { Role } from '@/config/permissions'
import type { RecordAccessEvent } from './AccessSettingsSection'
import { SearchField } from './parts'

/** Would anybody still be able to reach this screen after the change? */
function stillHasAnAdmin(
  users: SchoolUser[],
  roles: Role[],
  changing: { id: string; roleId: string },
): boolean {
  const canManage = (roleId: string) =>
    roles.find(role => role.id === roleId)?.permissions.includes('settings.manage') === true

  return users.some(user => canManage(user.id === changing.id ? changing.roleId : user.roleId))
}

/** What changed about someone's classes, in words, for the log. */
function describeClasses(before: string[], after: string[]): string | undefined {
  const added = after.filter(label => !before.includes(label))
  const removed = before.filter(label => !after.includes(label))
  if (added.length === 0 && removed.length === 0) return undefined

  const parts: string[] = []
  const push = (labels: string[], sign: string) => {
    if (labels.length === 0) return
    if (labels.length > 5) parts.push(`${sign} ${labels.length} classes`)
    else labels.forEach(label => parts.push(`${sign} ${label}`))
  }
  push(added, '+')
  push(removed, '−')
  return parts.join(', ')
}

/**
 * Enough of an email to be a plausible login.
 *
 * Deliberately loose. The directory's real check is uniqueness, which only the
 * store can make; validating the local part harder than this rejects addresses
 * that work.
 */
function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

const ALL_ROLES = '__all__'

interface PeopleTabProps {
  users: SchoolUser[] | null
  classLabels: string[]
  savingId: string | null
  onPatch: (id: string, patch: { roleId?: string; assignedClasses?: string[] }) => Promise<boolean>
  onAdd: (input: {
    fullName: string
    email: string
    roleId: string
  }) => Promise<SchoolUser | null>
  /** Set by the Roles tab when someone follows "Manage people" from a role. */
  roleFilter: string
  onRoleFilterChange: (roleId: string) => void
  record: RecordAccessEvent
}

export function PeopleTab({
  users,
  classLabels,
  savingId,
  onPatch,
  onAdd,
  roleFilter,
  onRoleFilterChange,
  record,
}: PeopleTabProps) {
  const { roles } = usePermissions()
  const currentUser = useCurrentUser()
  const { showSuccess, showError } = useAppToast()
  const [query, setQuery] = React.useState('')

  const [addOpen, setAddOpen] = React.useState(false)
  const [draft, setDraft] = React.useState({ fullName: '', email: '', roleId: '' })
  const [isAdding, setIsAdding] = React.useState(false)

  const changeRole = async (user: SchoolUser, roleId: string) => {
    if (!users) return

    // The same lockout the role editor guards against, one level up: a role
    // can keep `settings.manage` while the last person holding that role is
    // moved off it.
    if (!stillHasAnAdmin(users, roles, { id: user.id, roleId })) {
      showError('Someone must be able to manage settings', {
        description: `Give another person a role with that permission before changing ${user.fullName}.`,
      })
      return
    }

    const was = roles.find(role => role.id === user.roleId)?.name
    const now = roles.find(role => role.id === roleId)?.name ?? roleId

    if (await onPatch(user.id, { roleId })) {
      record({
        kind: 'user.role',
        target: user.fullName,
        summary: `Made ${user.fullName} ${now}`,
        detail: was ? `was ${was}` : undefined,
      })
      showSuccess(`${user.fullName} is now ${now}`, {
        description: 'Takes effect at their next sign-in.',
      })
    }
  }

  const setClasses = async (user: SchoolUser, next: string[]) => {
    const before = user.assignedClasses ?? []
    const detail = describeClasses(before, next)
    if (await onPatch(user.id, { assignedClasses: next })) {
      record({
        kind: 'user.classes',
        target: user.fullName,
        summary:
          next.length === 0
            ? `Removed every class from ${user.fullName}`
            : `Set ${user.fullName}'s classes to ${next.length} of ${classLabels.length}`,
        detail,
      })
    }
  }

  const toggleClass = (user: SchoolUser, label: string) => {
    const held = user.assignedClasses ?? []
    void setClasses(
      user,
      held.includes(label) ? held.filter(existing => existing !== label) : [...held, label],
    )
  }

  const openAdd = () => {
    setDraft({ fullName: '', email: '', roleId: roles[roles.length - 1]?.id ?? '' })
    setAddOpen(true)
  }

  const submitAdd = async () => {
    const fullName = draft.fullName.trim()
    const email = draft.email.trim()
    if (!fullName || !looksLikeEmail(email) || !draft.roleId) return

    setIsAdding(true)
    try {
      const created = await onAdd({ fullName, email, roleId: draft.roleId })
      if (!created) {
        showError('That email already has an account')
        return
      }
      const roleName = roles.find(role => role.id === created.roleId)?.name ?? created.roleId
      record({
        kind: 'user.create',
        target: created.fullName,
        summary: `Added ${created.fullName} as ${roleName}`,
        detail: created.email,
      })
      setAddOpen(false)
      showSuccess(`Added ${created.fullName}`, {
        description: 'They can sign in with the school password.',
      })
    } catch (error) {
      console.error('Failed to add a person', error)
      showError('Could not add them')
    } finally {
      setIsAdding(false)
    }
  }

  if (users === null) {
    return (
      <div className="space-y-3">
        {[0, 1, 2, 3].map(row => (
          <Skeleton key={row} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  const needle = query.trim().toLowerCase()
  const visible = users.filter(user => {
    if (roleFilter !== ALL_ROLES && user.roleId !== roleFilter) return false
    if (!needle) return true
    return user.fullName.toLowerCase().includes(needle) || user.email.toLowerCase().includes(needle)
  })

  const canSubmit =
    draft.fullName.trim().length > 0 && looksLikeEmail(draft.email) && draft.roleId !== ''

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-body-muted text-muted-foreground">
          Which role each person holds. Changes save as you make them and apply at their next
          sign-in.
        </p>
        <Button size="sm" className="shrink-0 gap-1.5" onClick={openAdd}>
          <UserPlus className="size-4" />
          Add person
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Search name or email…"
          label="Search people"
        />
        <div className="w-[170px] max-md:w-full">
          <Label htmlFor="people-role-filter" className="sr-only">
            Filter by role
          </Label>
          <Select value={roleFilter} onValueChange={onRoleFilterChange}>
            <SelectTrigger id="people-role-filter" className="h-control w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_ROLES}>All roles</SelectItem>
              {roles.map(role => (
                <SelectItem key={role.id} value={role.id}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {visible.length === 0 && (
        <p className="rounded-lg border border-dashed p-6 text-center text-caption text-muted-foreground">
          Nobody matches that.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {visible.map(user => {
          const role = roles.find(candidate => candidate.id === user.roleId)
          const scoped = role?.scopedToAssignedClasses === true
          const assigned = user.assignedClasses ?? []
          const isSelf = currentUser?.id === user.id
          const busy = savingId === user.id

          return (
            <div
              key={user.id}
              className="flex flex-col gap-3 rounded-xl border p-3 transition-opacity"
              style={{
                borderColor: border.default,
                backgroundColor: 'var(--card)',
                opacity: busy ? 0.6 : 1,
              }}
            >
              <div className="flex flex-wrap items-center gap-3">
                <span
                  aria-hidden
                  className="flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  style={{ backgroundColor: 'var(--heading)', color: 'var(--card)' }}
                >
                  {getInitials(user.fullName)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-body font-medium" style={{ color: 'var(--heading)' }}>
                    {user.fullName}
                    {isSelf && (
                      <Badge variant="secondary" className="ml-2 text-[10px]">
                        You
                      </Badge>
                    )}
                  </p>
                  <p className="text-caption text-muted-foreground">{user.email}</p>
                </div>

                <div className="w-[190px] max-md:w-full">
                  <Label htmlFor={`role-${user.id}`} className="sr-only">
                    Role for {user.fullName}
                  </Label>
                  <Select
                    value={role ? user.roleId : ''}
                    disabled={busy}
                    onValueChange={value => void changeRole(user, value)}
                  >
                    <SelectTrigger id={`role-${user.id}`} className="h-control w-full">
                      <SelectValue placeholder="No role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map(candidate => (
                        <SelectItem key={candidate.id} value={candidate.id}>
                          {candidate.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* A role that has since been deleted leaves the id behind. Say
                  so rather than showing an empty picker and no reason. */}
              {!role && (
                <p
                  className="flex items-start gap-1.5 text-caption"
                  style={{ color: 'var(--destructive)' }}
                >
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  Their role “{user.roleId}” no longer exists — they can sign in but reach nothing.
                </p>
              )}

              {/* Only a scoped role has classes to hold, and only then is an
                  empty list a problem worth pointing at. */}
              {scoped && (
                <div className="rounded-lg border p-2.5" style={{ borderColor: border.default }}>
                  <div className="mb-2 flex flex-wrap items-center gap-1.5">
                    <Layers className="size-3.5" style={{ color: text.muted }} aria-hidden />
                    <span className="text-caption font-medium" style={{ color: 'var(--heading)' }}>
                      Classes they can add to and edit
                    </span>
                    <span className="text-caption tabular-nums" style={{ color: text.muted }}>
                      {assigned.length}/{classLabels.length}
                    </span>
                    <span className="flex-1" />
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        void setClasses(
                          user,
                          assigned.length === classLabels.length ? [] : classLabels,
                        )
                      }
                      className="rounded-md px-1.5 py-0.5 text-[11px] font-medium hover:bg-muted disabled:opacity-50"
                      style={{ color: 'var(--heading)' }}
                    >
                      {assigned.length === classLabels.length ? 'Clear all' : 'Select all'}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {classLabels.map(label => {
                      const on = assigned.includes(label)
                      return (
                        <button
                          key={label}
                          type="button"
                          disabled={busy}
                          onClick={() => toggleClass(user, label)}
                          aria-pressed={on}
                          className={cn(
                            'tap-target rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                            on ? 'bg-[var(--heading)] text-[var(--card)]' : 'hover:bg-muted',
                          )}
                          style={{ borderColor: on ? 'var(--heading)' : border.default }}
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>

                  {assigned.length === 0 && (
                    <p className="mt-2 flex items-start gap-1.5 text-caption text-muted-foreground">
                      <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                      No classes yet — they can read the school but change nothing.
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a person</DialogTitle>
            <DialogDescription>
              They sign in with their email. Classes can be assigned once they have a role that
              needs them.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <div>
              <Label htmlFor="new-person-name">Full name</Label>
              <Input
                id="new-person-name"
                value={draft.fullName}
                autoComplete="off"
                onChange={event => setDraft(current => ({ ...current, fullName: event.target.value }))}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="new-person-email">Email</Label>
              <Input
                id="new-person-email"
                type="email"
                value={draft.email}
                autoComplete="off"
                onChange={event => setDraft(current => ({ ...current, email: event.target.value }))}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="new-person-role">Role</Label>
              <Select
                value={draft.roleId}
                onValueChange={value => setDraft(current => ({ ...current, roleId: value }))}
              >
                <SelectTrigger id="new-person-role" className="mt-1.5 w-full">
                  <SelectValue placeholder="Choose a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(role => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitAdd} disabled={!canSubmit || isAdding}>
              Add person
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { ALL_ROLES }
