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
 * Changes take effect immediately, not at the next sign-in. Roles and class
 * lists live in the school's own tables and are resolved on every call, so
 * there is no stamped copy in a session waiting to go stale — which is what
 * used to make a role change wait for a sign-out.
 */

import * as React from 'react'
import { Info, AlertTriangle, Layers, UserPlus, Eye, Users } from 'lucide-react'
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
import { useSchoolConfig } from '@/config/SchoolConfigContext'
import {
  enrolPersonHere,
  identifierTaken,
  type Person,
  type SchoolUser,
} from '@/api/services/user-service'
import { listProfileTypes } from '@/mocks/profiles'
import type { AccountStatus } from '@/features/auth/types'
import type { RecordAccessEvent } from './AccessSettingsSection'
import { SearchField } from './parts'
import { ProvisionDialog } from './ProvisionDialog'
import { describeClassChange, stillHasAnAdmin } from './helpers'

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

/** Ten digits once punctuation and a country code are stripped. */
function looksLikePhone(value: string): boolean {
  return value.replace(/\D/g, '').length >= 10
}

const ALL_ROLES = '__all__'
const ALL_KINDS = '__all__'

/**
 * How the profile types group for someone reading a list of people.
 *
 * The schema has six; a person scanning this screen is looking for staff,
 * students or families, so the picker offers three and each maps to the
 * schema's values rather than replacing them.
 */
/**
 * Filtering by kind, over *capacities* rather than a single profile type.
 *
 * A person can be several kinds at once — the teacher whose child attends is
 * staff and family — so the filter asks whether any of their records match,
 * and she appears under both.
 */
const KIND_GROUPS: { id: string; label: string; capacities: string[] }[] = [
  { id: 'staff', label: 'Staff', capacities: ['staff', 'teacher'] },
  { id: 'student', label: 'Students', capacities: ['student'] },
  { id: 'family', label: 'Parents & guardians', capacities: ['parent'] },
]

/** How an account's status should read, and how loudly. */
const STATUS_LABEL: Record<AccountStatus, { text: string; tone: 'ok' | 'quiet' | 'warn' }> = {
  active: { text: 'Active', tone: 'ok' },
  invited: { text: 'Invited', tone: 'warn' },
  disabled: { text: 'Not yet active', tone: 'quiet' },
}

interface PeopleTabProps {
  /**
   * Everyone with an account, joined to what they are at *this* school.
   *
   * Roles and classes come from the school's own tables now, so a row shows
   * what somebody does *here* — and somebody with an account and no role here
   * shows with none, which is who an administrator has come to give one to.
   */
  people: Person[] | null
  classLabels: string[]
  savingId: string | null
  /** Identity and whether they may sign in — global, so no profile needed. */
  onPatch: (id: string, patch: { status?: AccountStatus }) => Promise<boolean>
  /** One chip, one change. See `setPersonRole`. */
  onSetRole: (profileId: string, roleId: string, held: boolean) => Promise<boolean>
  onSetClasses: (profileId: string, classSections: string[]) => Promise<boolean>
  /** Re-read the joined list, after a change that reshapes a row. */
  onRefreshPeople: () => Promise<void>
  /** Set while a row is mid-write, so the row can quiet itself. */
  setSavingId: (id: string | null) => void
  onAdd: (input: {
    fullName: string
    email?: string | null
    phone?: string
    roleId: string
  }) => Promise<SchoolUser | null>
  /** An account created by provisioning, so the list picks it up. */
  onProvisioned: (user: SchoolUser) => void
  /** Set by the Roles tab when someone follows "Manage people" from a role. */
  roleFilter: string
  onRoleFilterChange: (roleId: string) => void
  record: RecordAccessEvent
}

/**
 * What the account is known by, for a list row or a log entry.
 *
 * Email when there is one, the number otherwise. Not both: the People list
 * shows one line under the name, and an account provisioned from a family's
 * mobile has no address to show there.
 */
function identifierOf(user: { email: string | null; phone?: string }): string {
  return user.email ?? user.phone ?? '—'
}

export function PeopleTab({
  people,
  classLabels,
  savingId,
  onPatch,
  onSetRole,
  onSetClasses,
  onRefreshPeople,
  setSavingId,
  onAdd,
  onProvisioned,
  roleFilter,
  onRoleFilterChange,
  record,
}: PeopleTabProps) {
  const { roles, startPreview, can } = usePermissions()
  /**
   * Three verbs, three controls.
   *
   * Until the catalogue was realigned this whole screen sat behind one
   * `users.manage`, so an office administrator who should only be moving
   * people between roles could also rewrite everyone's class list. The
   * backend split these; now the UI can honour the split.
   */
  const canAssignRole = can('roles.assign')
  const canEditAccess = can('users.update')
  const canAddPeople = can('users.create')
  const { setSettingsOpen } = useSchoolConfig()
  const currentUser = useCurrentUser()
  const { showSuccess, showError } = useAppToast()
  const [query, setQuery] = React.useState('')
  const [kindFilter, setKindFilter] = React.useState(ALL_KINDS)

  const [addOpen, setAddOpen] = React.useState(false)
  const [provisionOpen, setProvisionOpen] = React.useState(false)
  const [draft, setDraft] = React.useState({ fullName: '', email: '', phone: '', roleId: '' })
  const [isAdding, setIsAdding] = React.useState(false)
  /**
   * The kind picked for somebody being given a profile, by user id.
   *
   * Per row rather than one shared value: an administrator working down a list
   * of three new arrivals should not have the second one's choice overwrite
   * the first's.
   */
  const [enrolKind, setEnrolKind] = React.useState<Record<string, string>>({})

  /**
   * The kinds of person this school recognises, its own additions included.
   *
   * Read straight from the store rather than through a service, which is the
   * one place this screen reaches past the API boundary — the list is
   * reference data a school edits elsewhere, and a route for it is worth
   * adding the day something else needs it.
   */
  const profileTypes = React.useMemo(
    () => listProfileTypes().filter(type => type.isActive),
    [],
  )

  /**
   * Give or take one role. Several may be held at once.
   *
   * The last role reaching settings cannot be taken from the last person
   * holding it — checked against what they would hold *afterwards*, because
   * removing one of somebody's three roles is not the same as removing them.
   */
  const toggleRole = async (person: Person, roleId: string) => {
    if (person.profileId === null) return
    const held = person.roleIds.includes(roleId)
    const after = held
      ? person.roleIds.filter(id => id !== roleId)
      : [...person.roleIds, roleId]

    if (!stillHasAnAdmin(people ?? [], roles, { id: person.user.id, roleIds: after })) {
      showError('Somebody has to be able to reach this screen', {
        description: `Taking that role from ${person.user.fullName} would leave this school with no administrator.`,
      })
      return
    }

    const name = roles.find(role => role.id === roleId)?.name ?? roleId
    if (await onSetRole(person.profileId, roleId, !held)) {
      record({
        kind: 'user.role',
        target: person.user.fullName,
        summary: held
          ? `Removed ${name} from ${person.user.fullName}`
          : `Made ${person.user.fullName} ${name}`,
        detail: identifierOf(person.user),
        change: {
          entity: 'profile-role',
          id: `${person.profileId}:${roleId}`,
          before: held ? { held: true } : null,
          after: held ? null : { held: true },
        },
      })
      showSuccess(
        held ? `${person.user.fullName} is no longer ${name}` : `${person.user.fullName} is now ${name}`,
      )
    }
  }

  /**
   * Let somebody sign in.
   *
   * The only way an account moves off `disabled`, and deliberately a decision
   * someone makes per person rather than a side effect of provisioning: until
   * a school has checked the contact details belong to the family, an active
   * account is a stranger's login.
   */
  const activate = async (person: Person) => {
    if (await onPatch(person.user.id, { status: 'active' })) {
      record({
        kind: 'user.role',
        target: person.user.fullName,
        summary: `Activated ${person.user.fullName}'s account`,
        detail: identifierOf(person.user),
      })
      showSuccess(`${person.user.fullName} can sign in now`)
    }
  }

  /**
   * Make somebody who has an account into somebody here.
   *
   * Logged as its own entity, because undoing it removes the profile — and
   * with it every role granted since. That is the right reversal and it is
   * worth being explicit that it is not a small one.
   */
  const enrol = async (person: Person) => {
    const code = enrolKind[person.user.id] ?? 'staff'
    setSavingId(person.user.id)
    try {
      const profileId = await enrolPersonHere(person.user.id, code)
      if (!profileId) {
        showError('Could not add them to this school')
        return
      }
      const kind = profileTypes.find(type => type.code === code)?.name ?? code
      record({
        kind: 'user.create',
        target: person.user.fullName,
        summary: `Added ${person.user.fullName} to this school as ${kind}`,
        detail: identifierOf(person.user),
        change: { entity: 'profile', id: profileId, before: null, after: { userId: person.user.id } },
      })
      showSuccess(`${person.user.fullName} is now at this school`, {
        description: 'Give them a role to decide what they can do.',
      })
      await onRefreshPeople()
    } catch (error) {
      console.error('Failed to add them to this school', error)
      showError('Could not add them to this school')
    } finally {
      setSavingId(null)
    }
  }

  const setClasses = async (person: Person, next: string[]) => {
    if (person.profileId === null) return
    const detail = describeClassChange(person.assignedClasses, next)
    if (await onSetClasses(person.profileId, next)) {
      record({
        kind: 'user.classes',
        target: person.user.fullName,
        summary:
          next.length === 0
            ? `Removed every class from ${person.user.fullName}`
            : `Set ${person.user.fullName}'s classes to ${next.length} of ${classLabels.length}`,
        detail,
        change: {
          entity: 'profile-classes',
          id: person.profileId,
          before: { assignedClasses: person.assignedClasses },
          after: { assignedClasses: next },
        },
      })
    }
  }

  const toggleClass = (person: Person, label: string) => {
    const held = person.assignedClasses
    void setClasses(
      person,
      held.includes(label) ? held.filter(existing => existing !== label) : [...held, label],
    )
  }

  const openAdd = () => {
    setDraft({ fullName: '', email: '', phone: '', roleId: roles[roles.length - 1]?.id ?? '' })
    setAddOpen(true)
  }

  const submitAdd = async () => {
    const fullName = draft.fullName.trim()
    const email = draft.email.trim()
    const phone = draft.phone.trim()
    // Either will do, and the store enforces the same rule — this only keeps
    // the button from submitting something it already knows will be refused.
    const hasIdentifier = looksLikeEmail(email) || looksLikePhone(phone)
    if (!fullName || !hasIdentifier || !draft.roleId) return

    setIsAdding(true)
    try {
      const created = await onAdd({
        fullName,
        email: email || null,
        phone: phone || undefined,
        roleId: draft.roleId,
      })
      if (!created) {
        // Which one clashed matters: a taken number is the ordinary case of two
        // parents sharing a mobile, and the answer is the other parent's
        // number, not "this person already has an account".
        const taken = await identifierTaken({ email: email || null, phone: phone || undefined })
        showError(
          taken === 'phone'
            ? 'That number already signs in to another account'
            : 'That email already has an account',
        )
        return
      }
      const roleName = roles.find(role => role.id === draft.roleId)?.name ?? draft.roleId
      record({
        kind: 'user.create',
        target: created.fullName,
        summary: `Added ${created.fullName} as ${roleName}`,
        detail: identifierOf(created),
        change: { entity: 'user', id: created.id, before: null, after: { ...created } },
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

  if (people === null) {
    return (
      <div className="space-y-3">
        {[0, 1, 2, 3].map(row => (
          <Skeleton key={row} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  const needle = query.trim().toLowerCase()
  const kindCapacities = KIND_GROUPS.find(group => group.id === kindFilter)?.capacities
  const visible = people.filter(person => {
    // Any of their roles, not the one — filtering by Teacher should find the
    // teacher who is also a parent.
    if (roleFilter !== ALL_ROLES && !person.roleIds.includes(roleFilter)) return false
    if (kindCapacities && !person.capacities.some(c => kindCapacities.includes(c))) return false
    if (!needle) return true
    return (
      person.user.fullName.toLowerCase().includes(needle) ||
      identifierOf(person.user).toLowerCase().includes(needle)
    )
  })

  const canSubmit =
    draft.fullName.trim().length > 0 &&
    (looksLikeEmail(draft.email) || looksLikePhone(draft.phone)) &&
    draft.roleId !== ''

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-body-muted text-muted-foreground">
          What each person does at this school. Changes save as you make them and take
          effect straight away.
        </p>
        {canAddPeople && (
          <div className="flex shrink-0 flex-wrap gap-2">
            {/* Two different jobs. "Add person" types in someone new — a
                member of staff joining. "Give parents accounts" works off
                records the school already has, which is how every family
                account should be created. */}
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setProvisionOpen(true)}
            >
              <Users className="size-4" />
              Give parents accounts
            </Button>
            <Button size="sm" className="gap-1.5" onClick={openAdd}>
              <UserPlus className="size-4" />
              Add person
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Search name or email…"
          label="Search people"
        />
        <div className="w-[170px] max-md:w-full">
          <Label htmlFor="people-kind-filter" className="sr-only">
            Filter by kind
          </Label>
          <Select value={kindFilter} onValueChange={setKindFilter}>
            <SelectTrigger id="people-kind-filter" className="h-control w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_KINDS}>Everyone</SelectItem>
              {KIND_GROUPS.map(group => (
                <SelectItem key={group.id} value={group.id}>
                  {group.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
        {visible.map(person => {
          const user = person.user
          const held = person.roleIds.flatMap(id => {
            const found = roles.find(candidate => candidate.id === id)
            return found ? [found] : []
          })
          // Any role that narrows by class earns them a class picker. A person
          // who teaches *and* parents narrows on both axes, and only one of
          // them is about classes.
          const scoped = held.some(role => role.scopeBy === 'classes')
          const assigned = person.assignedClasses
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
                    {/* Only when it is not the ordinary case — a list where
                        every row says "Active" says nothing. */}
                    {user.status !== 'active' && canEditAccess && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void activate(person)}
                        className="ml-2 rounded-full border px-2 py-0.5 text-[10px] font-medium hover:bg-muted disabled:opacity-50"
                        style={{ borderColor: 'var(--heading)', color: 'var(--heading)' }}
                        title="Let this person sign in"
                      >
                        Activate
                      </button>
                    )}
                    {user.status !== 'active' && (
                      <Badge
                        variant="outline"
                        className="ml-2 text-[10px]"
                        style={
                          STATUS_LABEL[user.status].tone === 'warn'
                            ? { color: 'var(--heading)' }
                            : undefined
                        }
                        title={
                          user.status === 'disabled'
                            ? 'Provisioned, but cannot sign in yet.'
                            : 'Invited and awaiting activation.'
                        }
                      >
                        {STATUS_LABEL[user.status].text}
                      </Badge>
                    )}
                  </p>
                  <p className="text-caption text-muted-foreground">{user.email}</p>
                </div>

                {/* The faithful preview: this person's roles *and* their
                    classes, so a scoped holder is seen exactly as they see
                    themselves. Not offered for yourself — that is just the app.
                    Previews one role at a time: showing the union of several
                    would be a view nobody actually has. */}
                {held.length > 0 && !isSelf && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 gap-1"
                    onClick={() => {
                      startPreview({
                        roleId: held[0].id,
                        scope: {
                          classSections: person.assignedClasses,
                          studentIds: [],
                        },
                        personName: user.fullName,
                      })
                      setSettingsOpen(false)
                    }}
                  >
                    <Eye className="size-3.5" />
                    View as
                  </Button>
                )}
              </div>

              {/* ── Roles ──
                  Chips rather than a dropdown, because a person can hold
                  several and a `<select>` can say one. The same control the
                  class row below uses, so the two read as one idea: what this
                  person is here, and where they may act. */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-caption text-muted-foreground">
                    {person.profileId === null
                      ? 'No role at this school'
                      : held.length === 0
                        ? 'No role yet'
                        : `${held.length === 1 ? 'Role' : 'Roles'}: ${held.map(role => role.name).join(', ')}`}
                  </p>
                </div>

                {person.profileId === null ? (
                  <div className="flex flex-col gap-2">
                    <p className="flex items-start gap-1.5 text-caption text-muted-foreground">
                      <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                      They can sign in but are nobody at this school yet, so they reach
                      nothing here.
                    </p>
                    {canEditAccess && (
                      <div className="flex flex-wrap items-center gap-2">
                        <Label htmlFor={`kind-${user.id}`} className="sr-only">
                          What {user.fullName} is at this school
                        </Label>
                        <Select
                          value={enrolKind[user.id] ?? 'staff'}
                          disabled={busy}
                          onValueChange={value =>
                            setEnrolKind(current => ({ ...current, [user.id]: value }))
                          }
                        >
                          <SelectTrigger id={`kind-${user.id}`} className="h-control w-[170px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {profileTypes.map(type => (
                              <SelectItem key={type.id} value={type.code}>
                                {type.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          className="gap-1.5"
                          disabled={busy}
                          onClick={() => void enrol(person)}
                        >
                          <UserPlus className="size-3.5" />
                          Add to this school
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {roles.map(candidate => {
                      const on = person.roleIds.includes(candidate.id)
                      return (
                        <button
                          key={candidate.id}
                          type="button"
                          disabled={busy || !canAssignRole}
                          onClick={() => void toggleRole(person, candidate.id)}
                          aria-pressed={on}
                          className={cn(
                            'tap-target rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                            on
                              ? 'border-transparent'
                              : 'hover:bg-muted disabled:opacity-50',
                          )}
                          style={
                            on
                              ? { backgroundColor: 'var(--heading)', color: 'var(--card)' }
                              : { borderColor: border.default }
                          }
                        >
                          {candidate.name}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

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
                      disabled={busy || !canEditAccess}
                      onClick={() =>
                        void setClasses(
                          person,
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
                          disabled={busy || !canEditAccess}
                          onClick={() => toggleClass(person, label)}
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

      <ProvisionDialog
        open={provisionOpen}
        onOpenChange={setProvisionOpen}
        users={people.map(person => person.user)}
        onCreated={onProvisioned}
      />

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
              <Label htmlFor="new-person-phone">Mobile number</Label>
              <Input
                id="new-person-phone"
                type="tel"
                value={draft.phone}
                autoComplete="off"
                onChange={event => setDraft(current => ({ ...current, phone: event.target.value }))}
                className="mt-1.5"
              />
              <p className="mt-1 text-caption text-muted-foreground">
                Either one is enough — both can be signed in with. A number can only belong to
                one account, so two parents sharing a mobile need an address for the second.
              </p>
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
