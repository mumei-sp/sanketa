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
 * admin's edit on save.
 *
 * Two things it refuses to do, both unrecoverable from inside the app:
 *  - delete a built-in role, which would strand every user assigned to it
 *  - remove `settings.manage` from the last role that has it, which would lock
 *    everyone out of the panel that could put it back
 *
 * What the old version could not show, and this one can: how many people hold
 * the role you are about to change, and what the change does to what they see.
 * Both come from sitting next to the people directory rather than in a
 * separate settings section.
 */

import * as React from 'react'
import { Plus, Trash2, ShieldCheck, Lock, ArrowRight, Compass, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { defineAbilityFor, permissionDefinition, subjectFor } from '@/config/ability'
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
} from '@/config/permissions'
import type { SchoolUser } from '@/api/services/user-service'
import { AvatarStack, CoverageBar, SearchField } from './parts'

/**
 * The places a holder of this role would find in the sidebar.
 *
 * Built by running the real ability against the real navigation table rather
 * than by listing screens by hand, so it cannot drift: a permission that stops
 * gating a page stops appearing here on the same commit.
 *
 * Scoped roles are previewed as though the holder has classes assigned —
 * `classLabels` — because the question here is "what does this role unlock",
 * not "what can this particular person reach today". The People tab answers
 * the second one.
 */
function useEffectiveAccess(role: Role | null, classLabels: string[]): string[] {
  return React.useMemo(() => {
    if (!role) return []
    const ability = defineAbilityFor(role, classLabels)
    const can = (permission: Permission) => {
      const definition = permissionDefinition(permission)
      return definition ? ability.can(definition.action, subjectFor(definition.subject)) : false
    }

    const destinations = visibleNavigationItems(navigationItems, can).map(item => item.title)

    // The settings panel is not in the sidebar, so its three keys have to be
    // named here or a role that can only administer would look like it
    // reaches nothing.
    const admin: string[] = []
    if (can('settings.manage')) admin.push('School settings')
    if (can('roles.manage')) admin.push('Roles')
    if (can('users.manage')) admin.push('People')

    return [...destinations, ...admin]
  }, [role, classLabels])
}

/** Does this text match what someone typed into the permission search? */
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

interface RolesTabProps {
  /** The directory, for member counts. Null while it is still loading. */
  users: SchoolUser[] | null
  classLabels: string[]
  /** Open the People tab filtered to one role. */
  onManagePeople: (roleId: string) => void
  canManagePeople: boolean
}

export function RolesTab({ users, classLabels, onManagePeople, canManagePeople }: RolesTabProps) {
  const { roles, role: myRole, refresh } = usePermissions()
  const { showSuccess, showError } = useAppToast()
  const groups = React.useMemo(() => permissionsByGroup(), [])

  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  /**
   * The name field's own copy, committed on blur.
   *
   * It used to patch on every keystroke: two requests per character, and
   * because the input read its value back from the refetched roles, a slow
   * earlier response landing after a later one reset the field to a prefix of
   * what had been typed. Editing locally and saving once removes both.
   */
  const [nameDraft, setNameDraft] = React.useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = React.useState<Role | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)
  const [query, setQuery] = React.useState('')

  const selected = roles.find(role => role.id === selectedId) ?? roles[0] ?? null

  // Abandon a half-typed name when the selection moves elsewhere.
  React.useEffect(() => {
    setNameDraft(null)
  }, [selected?.id])

  const membersOf = React.useCallback(
    (roleId: string) => (users ?? []).filter(user => user.roleId === roleId).map(user => user.fullName),
    [users],
  )
  const members = selected ? membersOf(selected.id) : []
  const destinations = useEffectiveAccess(selected, classLabels)

  const patch = React.useCallback(
    async (id: string, changes: Parameters<typeof updateRoleRequest>[1]) => {
      setIsSaving(true)
      try {
        await updateRoleRequest(id, changes)
        await refresh()
      } catch (error) {
        console.error('Failed to update role', error)
        showError('Could not save the role')
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
    void patch(selected.id, { name })
  }

  /**
   * Every permission change goes through here, single or bulk.
   *
   * The lockout check has to sit at the one place that writes, not on the
   * individual switch: "clear this group" can take the last
   * `settings.manage` away just as easily as flipping it off can.
   */
  const setPermissions = (next: Permission[]) => {
    if (!selected) return

    if (!next.includes('settings.manage') && selected.permissions.includes('settings.manage')) {
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

    void patch(selected.id, { permissions: next })
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

  const handleCreate = async () => {
    setIsSaving(true)
    try {
      // Seeded with the two permissions every role needs to be usable at all,
      // rather than an empty role whose holder sees a blank app.
      const created = await createRoleRequest({
        name: 'New role',
        permissions: ['dashboard.view', 'notices.view'],
      })
      await refresh()
      setSelectedId(created.id)
      showSuccess('Role created', { description: 'Give it a name and choose what it can do.' })
    } catch (error) {
      console.error('Failed to create role', error)
      showError('Could not create the role')
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

    setPendingDelete(null)
    try {
      await deleteRoleRequest(role.id)
      await refresh()
      setSelectedId(null)
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
      <div className="flex items-start justify-between gap-3">
        <p className="text-body-muted text-muted-foreground">
          Pick a role, then choose what it can see and do. Changes save as you make them.
        </p>
        <Button size="sm" className="shrink-0 gap-1.5" onClick={handleCreate} disabled={isSaving}>
          <Plus className="size-4" />
          New role
        </Button>
      </div>

      {/* The roster of roles. A card each rather than a chip, because the two
          things worth knowing before you edit one — how many permissions it
          carries and how many people hold it — do not fit on a chip. */}
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
                  style={{
                    backgroundColor: isSelected ? 'var(--heading)' : 'var(--muted)',
                  }}
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
                  <span className="block text-caption tabular-nums" style={{ color: text.muted }}>
                    {role.permissions.length} of {ALL_PERMISSIONS.length} permissions
                  </span>
                </span>
              </span>

              <CoverageBar value={role.permissions.length} total={ALL_PERMISSIONS.length} />

              <span className="flex flex-wrap items-center gap-1.5">
                <AvatarStack names={holders} max={3} />
                <span className="flex-1" />
                {role.scopedToAssignedClasses && (
                  <Badge variant="outline" className="text-[10px]">
                    Class-scoped
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

          {selected.description && (
            <p className="text-caption text-muted-foreground">{selected.description}</p>
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

          {/* Class scoping. Its own control rather than a permission, because
              it does not grant anything — it narrows what the permissions
              below already grant to the holder's own classes. */}
          <div
            className="flex items-center gap-3 rounded-lg border px-3 py-2.5"
            style={{ borderColor: border.default }}
          >
            <div className="min-w-0 flex-1">
              <Label htmlFor="role-scoped" className="cursor-pointer text-body font-medium">
                Limit to assigned classes
              </Label>
              <p className="text-caption text-muted-foreground">
                Holders read every class but add and edit only the ones assigned to them.
                Affects attendance, marks and student records.
              </p>
            </div>
            <Switch
              id="role-scoped"
              checked={selected.scopedToAssignedClasses === true}
              disabled={isSaving}
              onCheckedChange={value => void patch(selected.id, { scopedToAssignedClasses: value })}
              aria-label="Limit to assigned classes"
            />
          </div>

          {/* What the switches below add up to. Derived from the same ability
              the app itself runs, so it is a preview and not a promise. */}
          <div className="rounded-lg border p-3" style={{ borderColor: border.default }}>
            <div className="mb-2 flex items-center gap-1.5">
              <Compass className="size-3.5" style={{ color: text.muted }} aria-hidden />
              <span className="text-caption font-semibold" style={{ color: 'var(--heading)' }}>
                Where this role can go
              </span>
            </div>
            {destinations.length === 0 ? (
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
                    // Reading is included in managing, so show it on and locked
                    // rather than offering a switch that cannot take effect.
                    const covered = impliedBy(definition.id as Permission, selected.permissions)
                    const switchId = `perm-${selected.id}-${definition.id}`
                    return (
                      <div
                        key={definition.id}
                        className="flex items-center gap-3 px-3 py-2.5"
                        style={index > 0 ? { borderTop: `1px solid ${border.default}` } : undefined}
                      >
                        <div className="min-w-0 flex-1">
                          <Label htmlFor={switchId} className="cursor-pointer text-body font-medium">
                            {definition.label}
                            {definition.scoped && (
                              <Badge variant="outline" className="ml-2 text-[10px] font-normal">
                                Scopable
                              </Badge>
                            )}
                          </Label>
                          <p className="text-caption text-muted-foreground">
                            {covered ? `Included by “${covered.label}”.` : definition.description}
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
