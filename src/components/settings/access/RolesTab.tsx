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
import {
  Plus,
  Trash2,
  ShieldCheck,
  Lock,
  ArrowRight,
  Compass,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import {
  defineAbilityFor,
  permissionDefinition,
  subjectFor,
  type AbilityScope,
} from '@/config/ability'
import { navigationItems, visibleNavigationItems } from '@/config/navigation'
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
} from '@/config/permissions'
import type { SchoolUser } from '@/api/services/user-service'
import type { RecordAccessEvent } from './AccessSettingsSection'
import { AvatarStack, CoverageBar, SearchField } from './parts'
import { describePermissionChange } from './helpers'

/**
 * The places a holder of this role would find in the sidebar.
 *
 * Built by running the real ability against the real navigation table rather
 * than by listing screens by hand, so it cannot drift: a permission that stops
 * gating a page stops appearing here on the same commit.
 *
 * Narrowed roles are previewed as though the holder has something on their
 * axis — every class for a class-scoped role, a representative student for a
 * family one — because the question here is "what does this role unlock", not
 * "what can this particular person reach today". The People tab answers the
 * second one.
 */
function useEffectiveAccess(role: Role | null, scope: AbilityScope): string[] {
  return React.useMemo(() => {
    if (!role) return []
    const ability = defineAbilityFor(role, scope)
    const can = (permission: Permission) => {
      const definition = permissionDefinition(permission)
      return definition ? ability.can(definition.action, subjectFor(definition.subject)) : false
    }

    const destinations = visibleNavigationItems(navigationItems, can).map(item => item.title)

    // The settings panel is not in the sidebar, so its three keys have to be
    // named here or a role that can only administer would look like it
    // reaches nothing.
    const admin: string[] = []
    if (can('system.settings')) admin.push('School settings')
    if (can('roles.manage')) admin.push('Roles')
    if (can('users.read')) admin.push('People')

    return [...destinations, ...admin]
  }, [role, scope])
}

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
  users: SchoolUser[] | null
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
}

export function RolesTab({
  users,
  previewScope,
  studentSampleReady,
  onNeedStudentSample,
  onManagePeople,
  canManagePeople,
  record,
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
      (users ?? []).filter(user => user.roleId === roleId).map(user => user.fullName),
    [users],
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

  const destinations = useEffectiveAccess(selected, previewScope)

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
    <div className="flex flex-col gap-4">
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

        <span className="flex-1" />

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
        <Button size="sm" className="shrink-0 gap-1.5" onClick={handleCreate} disabled={isSaving}>
          <Plus className="size-4" />
          New role
        </Button>
      </div>

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

          {/* The roster of roles. A card each rather than a chip, because the
              two things worth knowing before you edit one — how many
              permissions it carries and how many people hold it — do not fit
              on a chip. */}
          <div className="grid gap-2 sm:grid-cols-2">
            {roles.map(role => {
              const isSelected = selected?.id === role.id
              const holders = membersOf(role.id)
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelectedId(role.id)}
                  aria-pressed={isSelected}
                  className={cn(
                    'group flex flex-col gap-2 rounded-xl border p-3 text-left transition-all',
                    isSelected ? 'shadow-sm' : 'hover:bg-muted/40',
                  )}
                  style={{
                    borderColor: isSelected ? 'var(--heading)' : border.default,
                    boxShadow: isSelected ? '0 0 0 1px var(--heading)' : undefined,
                    backgroundColor: 'var(--card)',
                  }}
                >
                  <span className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className="flex size-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: isSelected ? 'var(--heading)' : 'var(--muted)' }}
                    >
                      <ShieldCheck
                        className="size-4"
                        style={{ color: isSelected ? 'var(--card)' : 'var(--heading)' }}
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-body font-semibold"
                        style={{ color: 'var(--heading)' }}
                      >
                        {role.name}
                      </span>
                      <span
                        className="block text-caption tabular-nums"
                        style={{ color: text.muted }}
                      >
                        {role.permissions.length} of {ALL_PERMISSIONS.length} permissions
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
                    {role.builtin && (
                      <Badge variant="outline" className="gap-1 text-[10px]">
                        <Lock className="size-2.5" />
                        Built-in
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

          {selected && (
            <div
              className="flex flex-col gap-4 rounded-xl border p-4"
              style={{ borderColor: border.default, backgroundColor: 'var(--card)' }}
            >
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-0 flex-1">
                  <Label htmlFor="role-name">Role name</Label>
                  <Input
                    id="role-name"
                    value={nameDraft ?? selected.name}
                    disabled={selected.builtin}
                    onChange={event => setNameDraft(event.target.value)}
                    onBlur={commitName}
                    onKeyDown={event => {
                      if (event.key === 'Enter') event.currentTarget.blur()
                      if (event.key === 'Escape') setNameDraft(null)
                    }}
                    className="mt-1.5"
                  />
                </div>
                {!selected.builtin && (
                  <Button
                    variant="outline"
                    className="shrink-0 gap-1.5 text-destructive"
                    onClick={() => setPendingDelete(selected)}
                  >
                    <Trash2 className="size-4" />
                    Delete
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
                  {users === null
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

              {/* Look at the app the way this role does.
                  Every class rather than none, because a scoped role with
                  nothing assigned can write nothing, and previewing that would
                  hide the behaviour being previewed. The panel closes because
                  the point is to see the app, not this screen. */}
              <Button
                variant="outline"
                className="gap-1.5"
                // Disabled rather than allowed-and-wrong: starting a preview
                // before the representative ids land captures an empty axis,
                // and the snapshot never catches up.
                disabled={!scopeReady}
                onClick={() => {
                  startPreview({ roleId: selected.id, scope: previewScope })
                  setSettingsOpen(false)
                }}
              >
                <Eye className="size-4" />
                {scopeReady ? `View the app as ${selected.name}` : 'Working out what it reaches…'}
              </Button>

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
                className="flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2.5"
                style={{ borderColor: border.default }}
              >
                <div className="min-w-0 flex-1">
                  <Label htmlFor="role-scope" className="text-body font-medium">
                    Limit what this role reaches
                  </Label>
                  <p className="text-caption text-muted-foreground">
                    {selected.scopeBy === 'classes'
                      ? 'Holders read every class but add and edit only the ones assigned to them.'
                      : selected.scopeBy === 'students'
                        ? "Holders read only their own records — a student's, or a parent's children's."
                        : 'Holders reach everything their permissions allow, everywhere.'}
                  </p>
                </div>
                <Select
                  value={selected.scopeBy ?? 'none'}
                  disabled={isSaving}
                  onValueChange={value => setScopeAxis(value as ScopeAxis | 'none')}
                >
                  <SelectTrigger id="role-scope" className="h-control w-[210px] max-md:w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not limited</SelectItem>
                    <SelectItem value="classes">To assigned classes</SelectItem>
                    <SelectItem value="students">To their own records</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* What the switches below add up to. Derived from the same
                  ability the app itself runs, so it is a preview and not a
                  promise. */}
              <div className="rounded-lg border p-3" style={{ borderColor: border.default }}>
                <div className="mb-2 flex items-center gap-1.5">
                  <Compass className="size-3.5" style={{ color: text.muted }} aria-hidden />
                  <span className="text-caption font-semibold" style={{ color: 'var(--heading)' }}>
                    Where this role can go
                  </span>
                </div>
                {!scopeReady ? (
                  <p className="text-caption text-muted-foreground">Working it out…</p>
                ) : destinations.length === 0 ? (
                  <p className="text-caption text-muted-foreground">
                    Nothing yet — a holder would sign in to an empty app.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {destinations.map(destination => (
                      <span
                        key={destination}
                        className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                        style={{ backgroundColor: 'var(--muted)', color: 'var(--heading)' }}
                      >
                        {destination}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {selected.id === myRole?.id && (
                <p className="text-caption" style={{ color: 'var(--heading)' }}>
                  This is your own role — changes here take effect for you immediately.
                </p>
              )}

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
          )}
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
