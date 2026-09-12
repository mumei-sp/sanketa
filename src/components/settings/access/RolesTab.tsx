/**
 * RolesTab — what each role may do.
 *
 * Roles are the school's data, not the app's: a school can add "Vice
 * Principal" or "Librarian" and decide exactly what each may do. Permissions
 * are the fixed half — they enumerate capabilities the code actually
 * implements, so there is no sense in inventing one at runtime.
 *
 * Unlike every other settings section this one saves immediately rather than
 * through the panel's draft-and-Save. Roles live in their own table behind a
 * service, not in SchoolConfig, and pretending otherwise would mean holding a
 * copy of a shared resource in a draft that could silently overwrite another
 * admin's edit on save. Every write is logged; see `record`.
 *
 * Two things it refuses to do, both unrecoverable from inside the app:
 *  - delete a built-in role, which would strand every user assigned to it
 *  - remove `settings.manage` from the last role that has it, which would lock
 *    everyone out of the panel that could put it back
 *
 * Two views of the same table. **Edit** answers "what can this role do?", one
 * role at a time. **Compare** answers "who can do this?", which is the question
 * an admin actually arrives with and which the one-role-at-a-time view made
 * you click four times to answer.
 */

import * as React from 'react'
import { createPortal } from 'react-dom'
import {
  Plus,
  Trash2,
  Lock,
  Pencil,
  Info,
  ArrowRight,
  SlidersHorizontal,
  Copy,
  Eye,
  LayoutGrid,
  Columns3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useAppToast } from '@/hooks/use-app-toast'
import { border, text } from '@/theme/colors'
import { cn } from '@/lib/utils'
import { usePermissions } from '@/features/auth/PermissionContext'
import { useSchoolConfig } from '@/config/SchoolConfigContext'
import type { AbilityScope } from '@/config/ability'
import {
  createRole as createRoleRequest,
  updateRole as updateRoleRequest,
  deleteRole as deleteRoleRequest,
} from '@/api/services/role-service'
import {
  impliedBy,
  permissionsByGroup,
  wouldOrphanSettings,
  ALL_PERMISSIONS,
  type Permission,
  type PermissionDefinition,
  type Role,
  type ScopeAxis,
  sideOfRole,
  type ContextSide,
} from '@/config/permissions'
import type { Person } from '@/api/services/user-service'
import type { RecordAccessEvent } from './AccessSettingsSection'
import { AvatarStack, CoverageBar, SearchField } from './parts'
import { describePermissionChange } from './helpers'

/** Does this permission match what someone typed into the search box? */
function matches(definition: PermissionDefinition, query: string): boolean {
  if (!query) return true
  const needle = query.toLowerCase()
  return (
    definition.label.toLowerCase().includes(needle) ||
    definition.description.toLowerCase().includes(needle) ||
    definition.group.toLowerCase().includes(needle) ||
    definition.id.toLowerCase().includes(needle)
  )
}

// ── Compare view ──────────────────────────────────────────────────────

/**
 * Every role against every permission.
 *
 * Read-only. A grid of 24 × N one-click toggles is a very efficient way to
 * make a change you did not mean to make and cannot see afterwards; the header
 * takes you to the role's own editor instead, where the change has a name next
 * to it.
 */
function CompareGrid({
  roles,
  onPick,
}: {
  roles: Role[]
  onPick: (roleId: string) => void
}) {
  const groups = React.useMemo(() => permissionsByGroup(), [])

  return (
    // The card background belongs on the whole grid, not just the sticky
    // column: the rows are transparent, so without it the frozen first column
    // reads as a white strip laid over the page.
    <div
      className="overflow-x-auto rounded-xl border"
      style={{ borderColor: border.default, backgroundColor: 'var(--card)' }}
    >
      <table className="w-full border-collapse text-left">
        <thead>
          <tr>
            <th
              scope="col"
              className="sticky left-0 z-10 min-w-[180px] px-3 py-2.5 text-caption font-semibold"
              style={{ backgroundColor: 'var(--card)', color: 'var(--heading)' }}
            >
              Permission
            </th>
            {roles.map(role => (
              <th key={role.id} scope="col" className="px-2 py-2.5 text-center">
                <button
                  type="button"
                  onClick={() => onPick(role.id)}
                  className="mx-auto block max-w-[110px] truncate rounded-md px-1.5 py-0.5 text-caption font-semibold hover:bg-muted"
                  style={{ color: 'var(--heading)' }}
                  title={`Edit ${role.name}`}
                >
                  {role.name}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groups.map(({ group, permissions }) => (
            <React.Fragment key={group}>
              <tr>
                <th
                  scope="colgroup"
                  colSpan={roles.length + 1}
                  className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                  style={{ backgroundColor: 'var(--muted)' }}
                >
                  {group}
                </th>
              </tr>
              {permissions.map(definition => (
                <tr key={definition.id} style={{ borderTop: `1px solid ${border.default}` }}>
                  <th
                    scope="row"
                    className="sticky left-0 z-10 px-3 py-2 text-caption font-normal"
                    style={{ backgroundColor: 'var(--card)', color: 'var(--heading)' }}
                  >
                    {definition.label}
                  </th>
                  {roles.map(role => {
                    const held = role.permissions.includes(definition.id as Permission)
                    const covered = impliedBy(definition.id as Permission, role.permissions)
                    const on = held || Boolean(covered)
                    return (
                      <td key={role.id} className="px-2 py-2 text-center">
                        <span
                          className="inline-block rounded-full"
                          title={
                            covered
                              ? `Included by "${covered.label}"`
                              : held
                                ? 'Granted'
                                : 'Not granted'
                          }
                          style={
                            on
                              ? {
                                  width: '9px',
                                  height: '9px',
                                  backgroundColor: 'var(--heading)',
                                  // Implied rather than chosen: same dot,
                                  // lighter, so a column reads as coverage
                                  // without hiding how it was granted.
                                  opacity: covered ? 0.4 : 1,
                                }
                              : {
                                  width: '9px',
                                  height: '9px',
                                  border: `1px solid ${border.default}`,
                                }
                          }
                        />
                        <span className="sr-only">
                          {on ? 'granted' : 'not granted'} for {role.name}
                        </span>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── The tab ───────────────────────────────────────────────────────────

interface RolesTabProps {
  /** The directory, for member counts. Null while it is still loading. */
  /**
   * Everyone with an account, joined to what they are at this school.
   *
   * Holder counts come from here rather than from the directory, because a
   * role is held at a school and the same login may hold a different set at
   * the next one.
   */
  people: Person[] | null
  /** What a role's preview stands in for on each axis — see the section. */
  previewScope: AbilityScope
  /** False until the representative student ids have arrived. */
  studentSampleReady: boolean
  /** Ask for them. Called only when a role narrowed to own records is open. */
  onNeedStudentSample: () => void
  /** Open the People tab filtered to one role. */
  onManagePeople: (roleId: string) => void
  canManagePeople: boolean
  record: RecordAccessEvent
  /** A node on the tab strip's row to render this tab's buttons into. */
  actionSlot?: HTMLElement | null
}

/**
 * The two kinds of role, and why they are drawn apart.
 *
 * They differ in more than what they grant. A family role's narrowing comes
 * from `student_guardians` — your children are your children — so it is not
 * something a school configures, and only the two built-ins may hold that
 * axis. Everything else is staff, and a school invents as many as it likes.
 *
 * Listing them in one grid made that look like a preference rather than a
 * rule, and left an admin wondering why Duplicate refuses on two of the six.
 */
const ROLE_GROUPS: { side: ContextSide; label: string; hint: string }[] = [
  { side: 'staff', label: 'Staff', hint: 'Yours to invent' },
  { side: 'family', label: 'Family', hint: 'Built in — scope comes from the records' },
]

export function RolesTab({
  people,
  previewScope,
  studentSampleReady,
  onNeedStudentSample,
  onManagePeople,
  canManagePeople,
  record,
  actionSlot,
}: RolesTabProps) {
  const { roles, realRole: myRole, refresh, startPreview } = usePermissions()
  const { setSettingsOpen } = useSchoolConfig()
  const { showSuccess, showError } = useAppToast()
  const groups = React.useMemo(() => permissionsByGroup(), [])

  const [view, setView] = React.useState<'edit' | 'compare'>('edit')
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  /**
   * The text fields' own copies, committed on blur.
   *
   * The name used to patch on every keystroke: two requests per character, and
   * because the input read its value back from the refetched roles, a slow
   * earlier response landing after a later one reset the field to a prefix of
   * what had been typed. Editing locally and saving once removes both.
   */
  const [nameDraft, setNameDraft] = React.useState<string | null>(null)
  const [descriptionDraft, setDescriptionDraft] = React.useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = React.useState<Role | null>(null)
  /** Open only while somebody is actually changing the name. */
  const [renaming, setRenaming] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [query, setQuery] = React.useState('')

  const selected = roles.find(role => role.id === selectedId) ?? roles[0] ?? null

  // Abandon half-typed text when the selection moves elsewhere.
  React.useEffect(() => {
    setNameDraft(null)
    setDescriptionDraft(null)
  }, [selected?.id])

  const membersOf = React.useCallback(
    (roleId: string) =>
      // Any of their roles, so somebody holding two is counted under both.
      (people ?? [])
        .filter(person => person.roleIds.includes(roleId))
        .map(person => person.user.fullName),
    [people],
  )
  const members = selected ? membersOf(selected.id) : []

  /**
   * A role narrowed to own records cannot be previewed against nothing, so ask
   * for the representative ids the first time one is opened.
   */
  const needsStudentSample = selected?.scopeBy === 'students'
  React.useEffect(() => {
    if (needsStudentSample) onNeedStudentSample()
  }, [needsStudentSample, onNeedStudentSample])

  /** Whether the preview has anything to stand in for on this role's axis. */
  const scopeReady = !needsStudentSample || studentSampleReady

  const patch = React.useCallback(
    async (id: string, changes: Parameters<typeof updateRoleRequest>[1]) => {
      setIsSaving(true)
      try {
        await updateRoleRequest(id, changes)
        await refresh()
        return true
      } catch (error) {
        console.error('Failed to update role', error)
        showError('Could not save the role')
        return false
      } finally {
        setIsSaving(false)
      }
    },
    [refresh, showError],
  )

  const commitName = () => {
    if (!selected || nameDraft === null) return
    const name = nameDraft.trim()
    setNameDraft(null)
    // An empty name would leave a role nobody can identify in the picker.
    if (!name || name === selected.name) return
    const was = selected.name
    void patch(selected.id, { name }).then(ok => {
      if (ok) {
        record({
          kind: 'role.update',
          target: name,
          summary: `Renamed the role ${was} to ${name}`,
          change: { entity: 'role', id: selected.id, before: { name: was }, after: { name } },
        })
      }
    })
  }

  const commitDescription = () => {
    if (!selected || descriptionDraft === null) return
    const description = descriptionDraft.trim()
    setDescriptionDraft(null)
    if (description === (selected.description ?? '')) return
    void patch(selected.id, { description })
  }

  /**
   * Every permission change goes through here, single or bulk.
   *
   * The lockout check has to sit at the one place that writes, not on the
   * individual switch: "clear this group" can take the last `settings.manage`
   * away just as easily as flipping it off can. So does the log line — a bulk
   * control that forgot to write one would be invisible in the audit trail.
   */
  const setPermissions = (next: Permission[]) => {
    if (!selected) return

    if (!next.includes('system.settings') && selected.permissions.includes('system.settings')) {
      const after = roles.map(role =>
        role.id === selected.id ? { ...role, permissions: next } : role,
      )
      if (wouldOrphanSettings(after)) {
        showError('At least one role must keep "Manage school settings"', {
          description: 'Otherwise nobody could reopen this panel.',
        })
        return
      }
    }

    const detail = describePermissionChange(selected.permissions, next)
    const name = selected.name
    const held = [...selected.permissions]
    void patch(selected.id, { permissions: next }).then(ok => {
      if (ok && detail) {
        record({
          kind: 'role.update',
          target: name,
          summary: `Changed what ${name} can do`,
          detail,
          change: {
            entity: 'role',
            id: selected.id,
            before: { permissions: held },
            after: { permissions: next },
          },
        })
      }
    })
  }

  const togglePermission = (permission: Permission, enabled: boolean) => {
    if (!selected) return
    setPermissions(
      enabled
        ? [...selected.permissions, permission]
        : selected.permissions.filter(held => held !== permission),
    )
  }

  /** Grant or clear a whole group at once — the reason a role editor is slow. */
  const setGroup = (permissions: PermissionDefinition[], enabled: boolean) => {
    if (!selected) return
    const ids = permissions.map(definition => definition.id as Permission)
    setPermissions(
      enabled
        ? [...new Set([...selected.permissions, ...ids])]
        : selected.permissions.filter(held => !ids.includes(held)),
    )
  }

  const setScopeAxis = (value: ScopeAxis | 'none') => {
    if (!selected) return
    const name = selected.name
    // 'none' rather than undefined on the wire: `updateRole` skips undefined,
    // so clearing the axis would otherwise silently do nothing — and undoing
    // "turned scoping on" would too.
    const was: ScopeAxis | 'none' = selected.scopeBy ?? 'none'
    void patch(selected.id, { scopeBy: value }).then(ok => {
      if (ok) {
        record({
          kind: 'role.update',
          target: name,
          summary:
            value === 'none'
              ? `Removed the limit from ${name}`
              : value === 'classes'
                ? `Limited ${name} to its holders' assigned classes`
                : `Limited ${name} to its holders' own records`,
          change: {
            entity: 'role',
            id: selected.id,
            before: { scopeBy: was },
            after: { scopeBy: value },
          },
        })
      }
    })
  }

  const handleCreate = async () => {
    setIsSaving(true)
    try {
      // Seeded with the two permissions every role needs to be usable at all,
      // rather than an empty role whose holder sees a blank app.
      const created = await createRoleRequest({
        name: 'New role',
        permissions: ['dashboard.read', 'notices.read'],
      })
      // Unscoped, so the store cannot refuse it — but the type says it can,
      // and a silent no-op would leave the panel showing the last role.
      if (!created) {
        showError('Could not create the role')
        return
      }
      await refresh()
      setSelectedId(created.id)
      setView('edit')
      record({
        kind: 'role.create',
        target: created.name,
        summary: `Created the role ${created.name}`,
        change: { entity: 'role', id: created.id, before: null, after: { ...created } },
      })
      showSuccess('Role created', { description: 'Give it a name and choose what it can do.' })
    } catch (error) {
      console.error('Failed to create role', error)
      showError('Could not create the role')
    } finally {
      setIsSaving(false)
    }
  }

  /**
   * Copy a role, permissions and scope included.
   *
   * The way every new role actually gets made. "Vice Principal" is Principal
   * minus two things, and building it from the two-permission blank meant
   * flipping seventeen switches to get back to where a copy starts.
   */
  const handleDuplicate = async (source: Role) => {
    setIsSaving(true)
    try {
      const created = await createRoleRequest({
        name: `${source.name} copy`,
        description: source.description,
        permissions: [...source.permissions],
        scopeBy: source.scopeBy,
      })
      // Copying Student or Parent is the one duplicate that cannot be made:
      // their axis is the app's, so the copy would be a family role a school
      // invented — or, worse, silently unscoped and reaching every child.
      if (!created) {
        showError(`${source.name} cannot be copied`, {
          description: "Roles limited to their holders' own records are built in.",
        })
        return
      }
      await refresh()
      setSelectedId(created.id)
      setView('edit')
      record({
        kind: 'role.create',
        target: created.name,
        summary: `Created ${created.name} from ${source.name}`,
        detail: `${source.permissions.length} permissions copied`,
        change: { entity: 'role', id: created.id, before: null, after: { ...created } },
      })
      showSuccess(`Copied ${source.name}`, { description: 'Rename it and adjust what it can do.' })
    } catch (error) {
      console.error('Failed to duplicate role', error)
      showError('Could not copy the role')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (role: Role) => {
    // The same check the permission toggle makes. Without it the guard is
    // trivially walked around: grant `settings.manage` to a new role, take it
    // off Admin (allowed, the new role holds it), then delete the new role.
    if (wouldOrphanSettings(roles.filter(candidate => candidate.id !== role.id))) {
      setPendingDelete(null)
      showError(`${role.name} is the only role that can manage settings`, {
        description: 'Give another role that permission first, then delete this one.',
      })
      return
    }

    const holders = membersOf(role.id).length
    setPendingDelete(null)
    try {
      await deleteRoleRequest(role.id)
      await refresh()
      setSelectedId(null)
      record({
        kind: 'role.delete',
        target: role.name,
        summary: `Deleted the role ${role.name}`,
        detail: holders > 0 ? `${holders} left without a role` : undefined,
        change: { entity: 'role', id: role.id, before: { ...role }, after: null },
      })
      showSuccess(`Deleted ${role.name}`)
    } catch (error) {
      console.error('Failed to delete role', error)
      showError('Could not delete the role')
    }
  }

  const visibleGroups = groups
    .map(({ group, permissions }) => ({
      group,
      permissions: permissions.filter(definition => matches(definition, query)),
    }))
    .filter(({ permissions }) => permissions.length > 0)

  return (
    // `@container`, not a viewport breakpoint. This screen lives inside the
    // settings panel, whose width is its own business — a sheet inside a
    // sidebar layout — and is nothing like the window's. Asking the window how
    // wide it is gets the wrong answer twice: a roomy window with a narrow
    // panel splits a layout that has no room, and the reverse hides one that
    // would have fitted.
    <div className="@container flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {/* Two questions, two views — see the file header. */}
        <div
          className="flex rounded-lg border p-0.5"
          style={{ borderColor: border.default }}
          role="group"
          aria-label="Role view"
        >
          {(
            [
              { id: 'edit', label: 'Edit', icon: LayoutGrid },
              { id: 'compare', label: 'Compare', icon: Columns3 },
            ] as const
          ).map(option => {
            const Icon = option.icon
            const active = view === option.id
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setView(option.id)}
                aria-pressed={active}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-caption font-medium transition-colors',
                  active ? 'bg-muted' : 'hover:bg-muted/50',
                )}
                style={{ color: active ? 'var(--heading)' : text.muted }}
              >
                <Icon className="size-3.5" aria-hidden />
                {option.label}
              </button>
            )
          })}
        </div>

      </div>

      {/*
        Level with the tabs, as the design draws them.

        "Duplicate" and "New role" act on the roster as a whole, so they belong
        on the row that says which part of Access you are in — not stranded at
        the end of the Edit/Compare switch, which only chooses how the roster is
        drawn. The two answer different questions and had been sharing a line.
      */}
      {actionSlot &&
        createPortal(
          <>
            {selected && (
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 gap-1.5"
                onClick={() => handleDuplicate(selected)}
                disabled={isSaving}
              >
                <Copy className="size-4" />
                Duplicate
              </Button>
            )}
            <Button
              size="sm"
              className="shrink-0 gap-1.5"
              onClick={handleCreate}
              disabled={isSaving}
            >
              <Plus className="size-4" />
              New role
            </Button>
          </>,
          actionSlot,
        )}

      {view === 'compare' ? (
        <>
          <p className="text-body-muted text-muted-foreground">
            Every role against every permission. A faint dot is granted by implication — "view" is
            included in "manage". Pick a role's name to edit it.
          </p>
          <CompareGrid
            roles={roles}
            onPick={roleId => {
              setSelectedId(roleId)
              setView('edit')
            }}
          />
        </>
      ) : (
        <>
          <p className="text-body-muted text-muted-foreground">
            Pick a role, then choose what it can see and do. Changes save as you make them.
          </p>

          {/* Master and detail beside each other, not stacked.

              The roster used to sit above the editor, so picking a role
              scrolled the thing you picked out of view — and the question
              this screen exists for, "how does this role differ from that
              one?", was asked by scrolling up and remembering. A rail
              keeps the answer on screen while the editor is open.

              Only where there is room for it. 600px is where a 200px rail
              still leaves the editor about 380 — measured against a permission
              row, which is the narrowest thing that has to stay readable: a
              label, a badge, a line of description and a switch. Narrower than
              that the roster goes back to a two-column grid with the editor
              underneath, which is the layout a narrow panel actually has room
              for; a rail beside a 300px editor would be worse than what it
              replaced.

              A second step at 720px widens the rail to 240. The design draws
              it at 288, but a role row here carries a name and a fraction where
              the design's carries avatars and a scope pill too — at 288 the app's
              rows had a gap in the middle of every line, and the 48px reads
              better spent on the editor beside it.

              720 rather than a rounder number because the settings panel hands
              this container 747px on a 1440 laptop: a threshold above that
              switched the wider rail on for large monitors only, which is the
              one case that did not need it. At 720 the editor keeps 491px,
              clear of the 380 the paragraph above measures. */}
          <div className="flex flex-col gap-4 @[600px]:grid @[600px]:grid-cols-[200px_minmax(0,1fr)] @[600px]:items-start @[600px]:gap-4 @[720px]:grid-cols-[240px_minmax(0,1fr)]">
            {/* The roster of roles. A card each rather than a chip, because
                the two things worth knowing before you edit one — how many
                permissions it carries and how many people hold it — do not fit
                on a chip.

                Pinned, so it is still there once you have scrolled into the
                permission list, which is the whole point of a rail. A school
                that invents enough roles can make it taller than the window,
                and a sticky element taller than its viewport has its bottom
                cut off with no way to reach it — so past that height it
                scrolls on its own. */}
            <div
              className="flex flex-col gap-3 rounded-xl border p-2 @[600px]:sticky @[600px]:top-0 @[600px]:max-h-dvh @[600px]:overflow-y-auto"
              style={{ borderColor: border.subtle, backgroundColor: 'var(--card)' }}
            >
              {ROLE_GROUPS.map(group => {
                const inGroup = roles.filter(role => sideOfRole(role) === group.side)
                if (inGroup.length === 0) return null
                return (
                  <div key={group.side} className="flex flex-col gap-0.5">
                    {/* Label left, count right, and no rule between them:
                        the design separates groups with the header's own
                        padding. A hairline across the column drew a second
                        edge inside a card that already has one. */}
                    <div className="flex items-center justify-between gap-2 px-2 pb-2 pt-1.5">
                      <span
                        className="text-caption font-semibold uppercase tracking-wide"
                        style={{ color: text.muted }}
                      >
                        {group.label}
                      </span>
                      <span className="text-caption tabular-nums" style={{ color: text.muted }}>
                        {inGroup.length}
                      </span>
                      {/* Dropped once the roster is a rail: "Built in — scope
                          comes from the records" beside a 200px column is
                          three lines of caption explaining a heading. The
                          per-role badges say the same thing where it applies,
                          which is the place it is actually asked. */}
                      <span
                        className="text-caption @[600px]:hidden"
                        style={{ color: text.muted }}
                      >
                        {group.hint}
                      </span>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2 @[600px]:grid-cols-1">
                      {inGroup.map(role => {
                  const isSelected = selected?.id === role.id
                  const holders = membersOf(role.id)
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setSelectedId(role.id)}
                      aria-pressed={isSelected}
                      className={cn(
                        'group flex flex-col gap-[7px] rounded-xl border px-[11px] py-[10px] text-left transition-colors',
                        isSelected ? '' : 'border-transparent hover:bg-muted/40',
                      )}
                      style={{
                        borderColor: isSelected ? 'var(--heading)' : undefined,
                        backgroundColor: isSelected ? 'var(--muted)' : undefined,
                      }}
                    >
                      {/* Name and count on one line, the count as a fraction.
                          "11 of 33 permissions" is a sentence, and a column of
                          eight of them is read rather than scanned; `11/33`
                          against a shared denominator is the comparison this
                          rail exists to make. The shield that used to sit here
                          was the same mark eight times over — it told you a row
                          was a role, which the column already says. */}
                      <span className="flex items-center justify-between gap-2">
                        <span
                          className="min-w-0 truncate text-body font-semibold"
                          style={{ color: 'var(--heading)' }}
                        >
                          {role.name}
                        </span>
                        <span
                          className="shrink-0 text-body font-semibold tabular-nums"
                          style={{ color: 'var(--heading)' }}
                        >
                          {role.permissions.length}
                          <span className="font-normal" style={{ color: text.muted }}>
                            /{ALL_PERMISSIONS.length}
                          </span>
                        </span>
                      </span>

                      <CoverageBar value={role.permissions.length} total={ALL_PERMISSIONS.length} />

                      <span className="flex flex-wrap items-center gap-1.5">
                        <AvatarStack names={holders} max={3} />
                        <span className="flex-1" />
                        {role.scopeBy && (
                          <Badge variant="outline" className="text-[10px]">
                            {role.scopeBy === 'classes' ? 'Class-scoped' : 'Own records'}
                          </Badge>
                        )}
                        {/* Only the school's own roles are named. "Built-in" on
                            every other row was a badge on all eight saying the
                            same thing, and the pair carried one bit between
                            them — which the presence of "Custom" already
                            carries on its own. */}
                        {!role.builtin && (
                          <Badge variant="secondary" className="text-[10px]">
                            Custom
                          </Badge>
                        )}
                        {myRole?.id === role.id && (
                          <Badge variant="secondary" className="text-[10px]">
                            You
                          </Badge>
                        )}
                      </span>
                    </button>
                      )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            {selected && (
              // One grid child holding both cards. A bare fragment made them
              // two children of a two-column grid, so the second wrapped onto a
              // row of its own under the rail.
              <div className="flex min-w-0 flex-col gap-4">
              {/*
                Two cards, not one inside the other.

                What the role IS — its name, who holds it, how far it reaches —
                and what it MAY DO are two questions, and the design gives each
                its own card. They had ended up nested: the permission list was
                a bordered card inside the bordered card carrying everything
                else, which draws an edge round a thing that is already inside
                an edge and reads as a mistake rather than a grouping.
              */}
              <div
                className="flex flex-col gap-4 rounded-xl border p-4"
                style={{ borderColor: border.default, backgroundColor: 'var(--card)' }}
              >
                {/*
                  The role's name is a heading, not a labelled field.

                  It was an always-open text input titled "Role name", which
                  put the card's most-read line in a box that invites typing —
                  and for the six built-in roles that box was permanently
                  disabled, so the control existed to be refused. A heading says
                  which role you are looking at; renaming is a thing you go and
                  do, behind the pencil, and only where it is possible.
                */}
                <div className="flex flex-wrap items-center gap-2">
                  {renaming ? (
                    <Input
                      id="role-name"
                      aria-label="Role name"
                      autoFocus
                      value={nameDraft ?? selected.name}
                      onChange={event => setNameDraft(event.target.value)}
                      onBlur={() => {
                        commitName()
                        setRenaming(false)
                      }}
                      onKeyDown={event => {
                        // Committed here rather than by asking the field to
                        // blur itself, which is what it did when this input was
                        // always on screen. Now that Enter also has to close
                        // the field, saying both out loud beats relying on the
                        // blur handler running first.
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          commitName()
                          setRenaming(false)
                        }
                        if (event.key === 'Escape') {
                          setNameDraft(null)
                          setRenaming(false)
                        }
                      }}
                      className="max-w-[280px]"
                    />
                  ) : (
                    <>
                      <h3 className="min-w-0 truncate text-section-title" style={{ color: 'var(--heading)' }}>
                        {selected.name}
                      </h3>
                      {selected.builtin && (
                        <Badge variant="outline" className="gap-1 text-[10px]">
                          <Lock className="size-2.5" />
                          Built in
                        </Badge>
                      )}
                    </>
                  )}

                  <span className="flex-1" />

                  {/* Look at the app the way this role does.
                      An icon beside the other two rather than a full-width
                      button in the body: it does not change the role, so it was
                      the widest control on a card about editing one.

                      Every class rather than none, because a scoped role with
                      nothing assigned can write nothing, and previewing that
                      would hide the behaviour being previewed. The panel closes
                      because the point is to see the app, not this screen. */}
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    // Disabled rather than allowed-and-wrong: starting a preview
                    // before the representative ids land captures an empty axis,
                    // and the snapshot never catches up.
                    disabled={!scopeReady}
                    title={
                      scopeReady
                        ? `View the app as ${selected.name}`
                        : 'Working out what it reaches…'
                    }
                    onClick={() => {
                      startPreview({ roleId: selected.id, scope: previewScope })
                      setSettingsOpen(false)
                    }}
                  >
                    <Eye className="size-4" />
                    <span className="sr-only">
                      {scopeReady
                        ? `View the app as ${selected.name}`
                        : 'Working out what it reaches…'}
                    </span>
                  </Button>

                  {!selected.builtin && !renaming && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      title={`Rename ${selected.name}`}
                      onClick={() => setRenaming(true)}
                    >
                      <Pencil className="size-4" />
                      <span className="sr-only">Rename</span>
                    </Button>
                  )}
                  {!selected.builtin && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0 text-destructive"
                      title={`Delete ${selected.name}`}
                      onClick={() => setPendingDelete(selected)}
                    >
                      <Trash2 className="size-4" />
                      <span className="sr-only">Delete role</span>
                    </Button>
                  )}
                </div>

                {/* A built-in role's description ships with the app; a custom
                    one has nowhere else to say what it is for. */}
                {selected.builtin ? (
                  selected.description && (
                    <p className="text-caption text-muted-foreground">{selected.description}</p>
                  )
                ) : (
                  <div>
                    <Label htmlFor="role-description">What it is for</Label>
                    <Textarea
                      id="role-description"
                      rows={2}
                      placeholder="Who should hold this role, and why."
                      value={descriptionDraft ?? selected.description ?? ''}
                      onChange={event => setDescriptionDraft(event.target.value)}
                      onBlur={commitDescription}
                      onKeyDown={event => {
                        if (event.key === 'Escape') setDescriptionDraft(null)
                      }}
                      className="mt-1.5"
                    />
                  </div>
                )}

                {/* Who holds it. The bridge between the two tabs: a permission
                    change is abstract until you can see the four people it lands
                    on. */}
                <div
                  className="flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2.5"
                  style={{ borderColor: border.default }}
                >
                  <AvatarStack names={members} />
                  <span className="min-w-0 flex-1 text-caption" style={{ color: text.muted }}>
                    {people === null
                      ? 'Counting people…'
                      : members.length === 0
                        ? 'No one holds this role yet.'
                        : `${members.length} ${members.length === 1 ? 'person holds' : 'people hold'} this role.`}
                  </span>
                  {canManagePeople && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 gap-1"
                      onClick={() => onManagePeople(selected.id)}
                    >
                      Manage people
                      <ArrowRight className="size-3.5" />
                    </Button>
                  )}
                </div>

                {/* Class scoping. Its own control rather than a permission,
                    because it does not grant anything — it narrows what the
                    permissions below already grant to the holder's own classes. */}
                {/* How this role is narrowed. A select rather than a switch
                    because there are now three answers, and the third one —
                    "their own records" — is what a student or parent account
                    will hold. It is not a permission: it does not grant
                    anything, it narrows what the permissions below already
                    grant. */}
                <div
                  className="flex flex-col gap-2.5 rounded-lg border p-3"
                  style={{ borderColor: border.default }}
                >
                  <div>
                    <p className="text-body font-medium" style={{ color: 'var(--heading)' }}>
                      Limit what this role reaches
                    </p>
                    <p className="text-caption text-muted-foreground">
                      {selected.scopeBy === 'classes'
                        ? 'Holders read every class but add and edit only the ones assigned to them.'
                        : selected.scopeBy === 'students'
                          ? "Holders read only their own records — a student's, or a parent's children's."
                          : 'Holders reach everything their permissions allow, everywhere.'}
                    </p>
                  </div>

                  {/*
                    Three answers, all three on screen.

                    A `<select>` shows one and hides the rest behind a click,
                    which is the wrong shape for a question whose whole point is
                    the comparison — "not limited" versus "assigned classes" is
                    the single most consequential choice on this screen. Laid out
                    it is also self-documenting: you can see that a third answer
                    exists and that it is not yours to pick.
                  */}
                  <div
                    role="radiogroup"
                    aria-label="Limit what this role reaches"
                    className="grid gap-1.5 sm:grid-cols-3"
                  >
                    {(
                      [
                        { value: 'none', label: 'Not limited' },
                        { value: 'classes', label: 'To assigned classes' },
                        { value: 'students', label: 'To their own records' },
                      ] as const
                    ).map(option => {
                      const on = (selected.scopeBy ?? 'none') === option.value
                      // The family axis is nobody's to set: it comes from
                      // `student_guardians`, so Student and Parent hold it and
                      // nothing a school makes can be given it. Shown padlocked
                      // rather than hidden — the question "why can't I pick
                      // that?" is better answered on screen than by an absence.
                      const locked = option.value === 'students'
                      const disabled =
                        isSaving || selected.scopeBy === 'students' || (locked && !on)
                      return (
                        <button
                          key={option.value}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          disabled={disabled}
                          title={
                            locked && !on
                              ? 'Built in and fixed — only Student and Parent can hold it'
                              : undefined
                          }
                          onClick={() => setScopeAxis(option.value as ScopeAxis | 'none')}
                          className={cn(
                            'flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-caption font-medium transition-colors',
                            on ? '' : 'hover:bg-muted disabled:hover:bg-transparent',
                            disabled && !on ? 'opacity-55' : '',
                          )}
                          style={
                            on
                              ? {
                                  backgroundColor: 'var(--heading)',
                                  borderColor: 'var(--heading)',
                                  color: 'var(--card)',
                                }
                              : { borderColor: border.default, color: text.muted }
                          }
                        >
                          {locked && <Lock className="size-3 shrink-0" aria-hidden />}
                          {option.label}
                        </button>
                      )
                    })}
                  </div>

                  {selected.scopeBy === 'students' && (
                    <p className="flex items-start gap-1.5 text-caption text-muted-foreground">
                      <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                      Own records is built in and fixed — it comes from who a child's guardians
                      are, not from a setting. Only Student and Parent can hold it.
                    </p>
                  )}
                </div>

                {selected.id === myRole?.id && (
                  <p className="text-caption" style={{ color: 'var(--heading)' }}>
                    This is your own role — changes here take effect for you immediately.
                  </p>
                )}

              </div>

                {/*
                  The permission list is one card, not six loose ones.

                  Each group already draws its own bordered block, so stacked
                  straight into the column they read as six unrelated panels
                  with the role's own settings above them — the design puts them
                  inside a single "What it can do" card, which is what says they
                  are all answers to the same question.
                */}
                <div
                  className="flex flex-col gap-3 rounded-xl border p-4"
                  style={{ borderColor: border.subtle, backgroundColor: 'var(--card)' }}
                >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h4 className="text-section-title" style={{ color: 'var(--heading)' }}>
                    What it can do
                  </h4>
                  <span className="text-caption tabular-nums" style={{ color: text.muted }}>
                    {selected.permissions.length} of {ALL_PERMISSIONS.length} granted
                  </span>
                </div>

                {/* Twenty-four switches is a scroll. Search first, then the list. */}
                <div className="flex flex-wrap items-center gap-2">
                  <SearchField
                    value={query}
                    onChange={setQuery}
                    placeholder="Search permissions…"
                    label="Search permissions"
                  />
                  <span
                    className="shrink-0 rounded-full px-2.5 py-1 text-caption font-medium tabular-nums"
                    style={{ backgroundColor: 'var(--muted)', color: 'var(--heading)' }}
                  >
                    {selected.permissions.length}/{ALL_PERMISSIONS.length} granted
                  </span>
                </div>

                {visibleGroups.length === 0 && (
                  <p className="text-caption text-muted-foreground">
                    No permission matches “{query}”.
                  </p>
                )}

                {visibleGroups.map(({ group, permissions }) => {
                  const granted = permissions.filter(definition =>
                    selected.permissions.includes(definition.id as Permission),
                  ).length
                  const all = granted === permissions.length

                  return (
                    <div key={group}>
                      <div className="mb-2 flex items-center gap-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {group}
                        </p>
                        <span className="text-[11px] tabular-nums" style={{ color: text.muted }}>
                          {granted}/{permissions.length}
                        </span>
                        <span className="flex-1" />
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => setGroup(permissions, !all)}
                          className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium hover:bg-muted disabled:opacity-50"
                          style={{ color: 'var(--heading)' }}
                        >
                          <SlidersHorizontal className="size-3" aria-hidden />
                          {all ? 'Clear all' : 'Grant all'}
                        </button>
                      </div>
                      <div
                        className="flex flex-col rounded-lg border"
                        style={{ borderColor: border.default }}
                      >
                        {permissions.map((definition, index) => {
                          const held = selected.permissions.includes(definition.id as Permission)
                          // Reading is included in managing, so show it on and
                          // locked rather than offering a switch that cannot
                          // take effect.
                          const covered = impliedBy(definition.id as Permission, selected.permissions)
                          const switchId = `perm-${selected.id}-${definition.id}`
                          return (
                            <div
                              key={definition.id}
                              className="flex items-center gap-3 px-3 py-2.5"
                              style={
                                index > 0 ? { borderTop: `1px solid ${border.default}` } : undefined
                              }
                            >
                              <div className="min-w-0 flex-1">
                                <Label
                                  htmlFor={switchId}
                                  className="cursor-pointer text-body font-medium"
                                >
                                  {definition.label}
                                  {definition.scopableBy?.includes('classes') && (
                                    <Badge variant="outline" className="ml-2 text-[10px] font-normal">
                                      By class
                                    </Badge>
                                  )}
                                  {definition.scopableBy?.includes('students') && (
                                    <Badge variant="outline" className="ml-2 text-[10px] font-normal">
                                      Own records
                                    </Badge>
                                  )}
                                </Label>
                                <p className="text-caption text-muted-foreground">
                                  {covered
                                    ? `Included by “${covered.label}”.`
                                    : definition.description}
                                </p>
                              </div>
                              <Switch
                                id={switchId}
                                checked={held || Boolean(covered)}
                                disabled={isSaving || Boolean(covered)}
                                onCheckedChange={value =>
                                  togglePermission(definition.id as Permission, value)
                                }
                                aria-label={definition.label}
                              />
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <p className="text-caption text-muted-foreground">
        These rules shape the app, not the data behind it. Once a backend enforces them, it is the
        server's copy that keeps records safe.
      </p>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={open => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {pendingDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete && membersOf(pendingDelete.id).length > 0
                ? `${membersOf(pendingDelete.id).length} ${
                    membersOf(pendingDelete.id).length === 1 ? 'person holds' : 'people hold'
                  } this role and will lose access until given another one. This cannot be undone.`
                : 'Anyone assigned to this role will lose access until they are given another one. This cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => pendingDelete && handleDelete(pendingDelete)}
            >
              Delete role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
