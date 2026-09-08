/**
 * AccessSettingsSection — one screen for who may do what.
 *
 * Roles and people used to be two settings sections, and the split made both
 * of them worse. Editing a role never told you how many people it landed on;
 * assigning one never told you what it actually granted. They are two halves
 * of a single question — *who may do what* — so they are tabs of a single
 * screen, over one shared read of the directory.
 *
 * The directory is fetched once here rather than in each tab: the Roles tab
 * needs it for member counts and the People tab needs it for the list, and two
 * components fetching the same table would let them disagree after a write.
 *
 * The third tab is the audit log, and it is the reason the writes are routed
 * through this component rather than made inside the tabs. Every change to who
 * may do what appends a line, and having one place that both writes and
 * refreshes the log means a new control cannot quietly skip it.
 *
 * Each tab is gated on its own permission. A school may well want an office
 * administrator who can put people into roles without also being able to
 * redefine what those roles mean, and the panel already only opens this
 * section for someone holding at least one of the two.
 */

import * as React from 'react'
import { ShieldCheck, Users, Layers, KeyRound, History } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAppToast } from '@/hooks/use-app-toast'
import { useSchoolConfig } from '@/config/SchoolConfigContext'
import { getClassLabels } from '@/utils/class-section-helpers'
import { fetchStudents } from '@/api/services/student-service'
import type { AbilityScope } from '@/config/ability'
import { usePermissions } from '@/features/auth/PermissionContext'
import { useCurrentUser } from '@/hooks/use-current-user'
import {
  fetchUsers,
  createUser as createUserRequest,
  updateUserAccess,
  type SchoolUser,
} from '@/api/services/user-service'
import {
  fetchAccessEvents,
  recordAccessEvent,
  type AccessChange,
  type AccessEvent,
  type AccessEventKind,
} from '@/api/services/access-log-service'
import { ALL_PERMISSIONS } from '@/config/permissions'
import { StatTile } from './parts'
import { RolesTab } from './RolesTab'
import { PeopleTab, ALL_ROLES } from './PeopleTab'
import { ActivityTab } from './ActivityTab'
import { undoEvent } from './undo'

/** What a tab hands the recorder. The actor is filled in here. */
export interface AccessEventDraft {
  kind: AccessEventKind
  target: string
  summary: string
  detail?: string
  /**
   * What moved, in fields rather than prose.
   *
   * Optional on the type but written by every control, because an entry
   * without it cannot be taken back — see `undo.ts`.
   */
  change?: AccessChange
  /** Set only by an undo, naming the entry it reverses. */
  undoOf?: string
}

export type RecordAccessEvent = (draft: AccessEventDraft) => void

export function AccessSettingsSection() {
  const { can, roles, refresh } = usePermissions()
  const { config } = useSchoolConfig()
  const { showError, showSuccess } = useAppToast()
  const currentUser = useCurrentUser()

  const canManageRoles = can('roles.manage')
  // Reaching the People tab is a read. Every control inside it carries its own
  // verb — `roles.assign` on the role picker, `users.update` on the classes,
  // `users.create` on Add person — which is the point of splitting them.
  const canManagePeople = can('users.read')

  const classLabels = React.useMemo(
    () => getClassLabels(config.classSections),
    [config.classSections],
  )

  const [users, setUsers] = React.useState<SchoolUser[] | null>(null)
  /**
   * A couple of real student ids, for previewing a role narrowed to "their own
   * records".
   *
   * No account is linked to a student record yet, so a family role's scope
   * would otherwise be empty and its preview would show an app that reaches
   * nothing — which is true of a student with no record and useless as a
   * preview of the role. Real ids rather than a placeholder, because the
   * condition matches on them and a placeholder would match nothing.
   */
  const [sampleStudentIds, setSampleStudentIds] = React.useState<string[]>([])

  /** What a preview of a role stands in for, on each axis. */
  const previewScope = React.useMemo<AbilityScope>(
    () => ({ classSections: classLabels, studentIds: sampleStudentIds }),
    [classLabels, sampleStudentIds],
  )

  const [events, setEvents] = React.useState<AccessEvent[] | null>(null)
  const [savingId, setSavingId] = React.useState<string | null>(null)
  const [isUndoing, setIsUndoing] = React.useState(false)
  const [tab, setTab] = React.useState(canManageRoles ? 'roles' : 'people')
  const [roleFilter, setRoleFilter] = React.useState<string>(ALL_ROLES)

  React.useEffect(() => {
    fetchUsers()
      .then(setUsers)
      .catch(error => {
        console.error('Failed to load people', error)
        setUsers([])
      })
    fetchStudents()
      .then(students => setSampleStudentIds(students.slice(0, 2).map(student => String(student.id))))
      .catch(error => console.error('Failed to load a sample student', error))
    fetchAccessEvents()
      .then(setEvents)
      .catch(error => {
        console.error('Failed to load the access log', error)
        setEvents([])
      })
  }, [])

  /**
   * Append to the log, then re-read it.
   *
   * Deliberately fire-and-forget: a change that saved has happened whether or
   * not its log line lands, and blocking the toast on a second request would
   * make every switch feel twice as slow. A failure is reported to the console
   * rather than the user, who cannot do anything about it.
   */
  const record = React.useCallback<RecordAccessEvent>(
    draft => {
      void recordAccessEvent({ ...draft, actorName: currentUser?.fullName ?? 'Someone' })
        .then(() => fetchAccessEvents())
        .then(setEvents)
        .catch(error => console.error('Failed to record an access change', error))
    },
    [currentUser?.fullName],
  )

  /**
   * Write one person's access.
   *
   * Returns whether it landed, so a caller can decide what to say — the toast
   * for a role change names the new role, and there is no point announcing one
   * that failed to save.
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

  /** Add an account. Null back means the email was taken. */
  const addUser = React.useCallback(
    async (input: { fullName: string; email: string; roleId: string }) => {
      const created = await createUserRequest(input)
      if (created) setUsers(current => (current ? [...current, created] : [created]))
      return created
    },
    [],
  )

  /**
   * Take an entry back.
   *
   * Lives here rather than in the Activity tab because reversing a change
   * touches the same two tables the other tabs write, and afterwards the roles
   * table, the directory and the log all have to be re-read — the Roles tab is
   * showing permission counts that just moved. One place that writes, one place
   * that refreshes.
   */
  const handleUndo = React.useCallback(
    async (event: AccessEvent) => {
      if (!users) return
      setIsUndoing(true)
      try {
        const outcome = await undoEvent(event, { roles, users, currentUserId: currentUser?.id })
        if (!outcome.ok) {
          showError('Could not take that back', { description: outcome.reason })
          return
        }

        await refresh()
        setUsers(await fetchUsers())
        // The reversal is a new entry pointing at the old one — never an edit
        // of it. `record` re-reads the log, so the row it came from picks up
        // its "taken back" mark on the same pass.
        record({
          kind: event.kind,
          target: event.target,
          summary: outcome.summary,
          detail: outcome.detail,
          change: outcome.change,
          undoOf: event.id,
        })
        showSuccess(outcome.summary)
      } catch (error) {
        console.error('Failed to undo an access change', error)
        showError('Could not take that back')
      } finally {
        setIsUndoing(false)
      }
    },
    [users, roles, currentUser?.id, refresh, record, showError, showSuccess],
  )

  const openPeopleFor = (roleId: string) => {
    setRoleFilter(roleId)
    setTab('people')
  }

  const customRoles = roles.filter(role => !role.builtin).length
  const scopedRoles = roles.filter(role => role.scopeBy !== undefined).length

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
        <TabsList className="w-full">
          {canManageRoles && (
            <TabsTrigger value="roles" className="gap-1.5">
              <ShieldCheck className="size-4" />
              <span className="truncate">Roles</span>
            </TabsTrigger>
          )}
          {canManagePeople && (
            <TabsTrigger value="people" className="gap-1.5">
              <Users className="size-4" />
              <span className="truncate">People</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="activity" className="gap-1.5">
            <History className="size-4" />
            <span className="truncate">Activity</span>
          </TabsTrigger>
        </TabsList>

        {/* `forceMount` on all three: Radix unmounts a hidden tab, and this
            screen's tabs hold work in progress — the role you were editing,
            a half-typed search, the filter the Roles tab just set on People.
            Switching to the log to check what you did and coming back should
            not put you on a different role. */}
        {canManageRoles && (
          <TabsContent value="roles" forceMount hidden={tab !== 'roles'}>
            <RolesTab
              users={users}
              previewScope={previewScope}
              onManagePeople={openPeopleFor}
              canManagePeople={canManagePeople}
              record={record}
            />
          </TabsContent>
        )}

        {canManagePeople && (
          <TabsContent value="people" forceMount hidden={tab !== 'people'}>
            <PeopleTab
              users={users}
              classLabels={classLabels}
              savingId={savingId}
              onPatch={patchUser}
              onAdd={addUser}
              roleFilter={roleFilter}
              onRoleFilterChange={setRoleFilter}
              record={record}
            />
          </TabsContent>
        )}

        <TabsContent value="activity" forceMount hidden={tab !== 'activity'}>
          <ActivityTab
            events={events}
            undoContext={users ? { roles, users, currentUserId: currentUser?.id } : null}
            onUndo={handleUndo}
            isUndoing={isUndoing}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
