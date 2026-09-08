/**
 * SecuritySettingsSection — the role editor.
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
 */

import * as React from 'react'
import { Plus, Trash2, ShieldCheck, Lock } from 'lucide-react'
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
import {
  createRole as createRoleRequest,
  updateRole as updateRoleRequest,
  deleteRole as deleteRoleRequest,
} from '@/api/services/role-service'
import {
  impliedBy,
  permissionsByGroup,
  wouldOrphanSettings,
  type Permission,
  type Role,
} from '@/config/permissions'

export function SecuritySettingsSection() {
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

  const selected = roles.find(role => role.id === selectedId) ?? roles[0] ?? null

  // Abandon a half-typed name when the selection moves elsewhere.
  React.useEffect(() => {
    setNameDraft(null)
  }, [selected?.id])

  const commitName = () => {
    if (!selected || nameDraft === null) return
    const name = nameDraft.trim()
    setNameDraft(null)
    // An empty name would leave a role nobody can identify in the picker.
    if (!name || name === selected.name) return
    void patch(selected.id, { name })
  }

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

  const togglePermission = (permission: Permission, enabled: boolean) => {
    if (!selected) return

    const next = enabled
      ? [...selected.permissions, permission]
      : selected.permissions.filter(held => held !== permission)

    // Check against the whole table, not just this role: taking the last
    // `settings.manage` away is the one edit nobody can undo from in here.
    if (!enabled && permission === 'settings.manage') {
      const after = roles.map(role => (role.id === selected.id ? { ...role, permissions: next } : role))
      if (wouldOrphanSettings(after)) {
        showError('At least one role must keep "Manage school settings"', {
          description: 'Otherwise nobody could reopen this panel.',
        })
        return
      }
    }

    void patch(selected.id, { permissions: next })
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-section-title" style={{ color: 'var(--heading)' }}>
            Roles &amp; permissions
          </h3>
          <p className="text-body-muted text-muted-foreground mt-1">
            Choose what each role can see and do. Changes save as you make them.
          </p>
        </div>
        <Button size="sm" className="shrink-0 gap-1.5" onClick={handleCreate} disabled={isSaving}>
          <Plus className="size-4" />
          New role
        </Button>
      </div>

      {/* Role list — one line each, stacked on phones */}
      <div className="flex flex-wrap gap-2">
        {roles.map(role => {
          const isSelected = selected?.id === role.id
          return (
            <button
              key={role.id}
              type="button"
              onClick={() => setSelectedId(role.id)}
              className={cn(
                'flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors',
                isSelected ? 'bg-muted' : 'hover:bg-muted/50',
              )}
              style={{ borderColor: isSelected ? 'var(--heading)' : border.default }}
            >
              <ShieldCheck className="size-4 shrink-0" style={{ color: text.muted }} />
              <span className="text-body font-medium" style={{ color: 'var(--heading)' }}>
                {role.name}
              </span>
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
            </button>
          )
        })}
      </div>

      {selected && (
        <div className="flex flex-col gap-4 rounded-lg border p-4" style={{ borderColor: border.default }}>
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
              onCheckedChange={value =>
                void patch(selected.id, { scopedToAssignedClasses: value })
              }
              aria-label="Limit to assigned classes"
            />
          </div>

          {selected.id === myRole?.id && (
            <p className="text-caption" style={{ color: 'var(--heading)' }}>
              This is your own role — changes here take effect for you immediately.
            </p>
          )}

          {groups.map(({ group, permissions }) => (
            <div key={group}>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {group}
              </p>
              <div className="flex flex-col rounded-lg border" style={{ borderColor: border.default }}>
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
                        </Label>
                        <p className="text-caption text-muted-foreground">
                          {covered
                            ? `Included by "${covered.label}".`
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
          ))}
        </div>
      )}

      <p className="text-caption text-muted-foreground">
        These rules shape the app, not the data behind it. Once a backend enforces them, it is the
        server's copy that keeps records safe.
      </p>

      <AlertDialog open={pendingDelete !== null} onOpenChange={open => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {pendingDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Anyone assigned to this role will lose access until they are given another one. This
              cannot be undone.
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
