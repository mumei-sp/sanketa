/**
 * AccessSettingsSection — one screen for who may do what.
 *
 * Roles and people used to be two settings sections, and the split made both
 * of them worse. Editing a role never told you how many people it landed on;
 * assigning one never told you what it actually granted. They are two halves
 * of a single question — *who may do what* — so they are two tabs of a single
 * screen, over one shared read of the directory.
 *
 * The directory is fetched once here rather than in each tab: the Roles tab
 * needs it for member counts and the People tab needs it for the list, and
 * two components fetching the same table would let them disagree after a
 * write.
 *
 * Each tab is gated on its own permission. A school may well want an office
 * administrator who can put people into roles without also being able to
 * redefine what those roles mean, and the panel already only opens this
 * section for someone holding at least one of the two.
 */

import * as React from 'react'
import { ShieldCheck, Users, Layers, KeyRound } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAppToast } from '@/hooks/use-app-toast'
import { useSchoolConfig } from '@/config/SchoolConfigContext'
import { getClassLabels } from '@/utils/class-section-helpers'
import { usePermissions } from '@/features/auth/PermissionContext'
import { fetchUsers, updateUserAccess, type SchoolUser } from '@/api/services/user-service'
import { ALL_PERMISSIONS } from '@/config/permissions'
import { StatTile } from './parts'
import { RolesTab } from './RolesTab'
import { PeopleTab, ALL_ROLES } from './PeopleTab'

export function AccessSettingsSection() {
  const { can, roles } = usePermissions()
  const { config } = useSchoolConfig()
  const { showError } = useAppToast()

  const canManageRoles = can('roles.manage')
  const canManagePeople = can('users.manage')

  const classLabels = React.useMemo(
    () => getClassLabels(config.classSections),
    [config.classSections],
  )

  const [users, setUsers] = React.useState<SchoolUser[] | null>(null)
  const [savingId, setSavingId] = React.useState<string | null>(null)
  const [tab, setTab] = React.useState(canManageRoles ? 'roles' : 'people')
  const [roleFilter, setRoleFilter] = React.useState<string>(ALL_ROLES)

  React.useEffect(() => {
    fetchUsers()
      .then(setUsers)
      .catch(error => {
        console.error('Failed to load people', error)
        setUsers([])
      })
  }, [])

  /**
   * Write one person's access.
   *
   * Returns whether it landed, so a caller can decide what to say — the
   * toast for a role change names the new role, and there is no point
   * announcing one that failed to save.
   */
  const patchUser = React.useCallback(
    async (id: string, patch: { roleId?: string; assignedClasses?: string[] }) => {
      setSavingId(id)
      try {
        const updated = await updateUserAccess(id, patch)
        if (updated) {
          setUsers(current => current?.map(user => (user.id === id ? updated : user)) ?? null)
        }
        return updated !== null
      } catch (error) {
        console.error('Failed to update access', error)
        showError('Could not save the change')
        return false
      } finally {
        setSavingId(null)
      }
    },
    [showError],
  )

  const openPeopleFor = (roleId: string) => {
    setRoleFilter(roleId)
    setTab('people')
  }

  const customRoles = roles.filter(role => !role.builtin).length
  const scopedRoles = roles.filter(role => role.scopedToAssignedClasses).length

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-section-title" style={{ color: 'var(--heading)' }}>
          Access
        </h3>
        <p className="text-body-muted text-muted-foreground mt-1">
          Roles decide what can be done. People decide who does it.
        </p>
      </div>

      {/* The state of the school's access in four numbers, so the tab you
          need is usually obvious before you open it. */}
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <StatTile icon={ShieldCheck} value={roles.length} label="Roles" />
        <StatTile icon={KeyRound} value={ALL_PERMISSIONS.length} label="Permissions" />
        <StatTile icon={Users} value={users?.length ?? '—'} label="People" />
        <StatTile
          icon={Layers}
          value={scopedRoles > 0 ? scopedRoles : customRoles}
          label={scopedRoles > 0 ? 'Scoped roles' : 'Custom roles'}
        />
      </div>

      <Tabs value={tab} onValueChange={setTab} className="gap-4">
        {/* One permission, one tab — no picker for a choice of one. */}
        {canManageRoles && canManagePeople && (
          <TabsList className="w-full">
            <TabsTrigger value="roles" className="gap-1.5">
              <ShieldCheck className="size-4" />
              Roles &amp; permissions
            </TabsTrigger>
            <TabsTrigger value="people" className="gap-1.5">
              <Users className="size-4" />
              People
            </TabsTrigger>
          </TabsList>
        )}

        {canManageRoles && (
          <TabsContent value="roles">
            <RolesTab
              users={users}
              classLabels={classLabels}
              onManagePeople={openPeopleFor}
              canManagePeople={canManagePeople}
            />
          </TabsContent>
        )}

        {canManagePeople && (
          <TabsContent value="people">
            <PeopleTab
              users={users}
              classLabels={classLabels}
              savingId={savingId}
              onPatch={patchUser}
              roleFilter={roleFilter}
              onRoleFilterChange={setRoleFilter}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
