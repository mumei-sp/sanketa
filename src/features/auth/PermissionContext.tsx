/**
 * What the signed-in user is allowed to do.
 *
 * Loads the roles table once and resolves the current user's role into a set
 * of permissions. Features ask `can('fees.manage')` — never `role === 'x'`,
 * which is what makes adding a role a data change rather than a code change.
 *
 * Roles are fetched, not derived, because they are the school's data: an admin
 * can rename Principal or take finance away from it, and the client has to
 * read what was actually saved rather than a copy compiled into the bundle.
 *
 * Deny while loading. The window between mount and the roles arriving is short,
 * but defaulting to *allow* would flash every gated control onto the screen of
 * someone who cannot use them, then snatch them back — worse than a beat of
 * nothing. `isReady` lets callers hold the frame instead of rendering a denial
 * they will immediately contradict.
 */

import * as React from 'react'
import { fetchRoles } from '@/api/services/role-service'
import { findRole, type Permission, type Role } from '@/config/permissions'
import {
  defineAbilityFor,
  permissionDefinition,
  subjectFor,
  type AppAbility,
} from '@/config/ability'
import { useCurrentUser } from '@/hooks/use-current-user'

/**
 * Where an action is being attempted.
 *
 * Only class sections today. If scoping ever grows a second axis — subjects,
 * departments — this is the type that gains a field, and every call site that
 * already passes a scope keeps working.
 */
export interface PermissionScope {
  classSection?: string
}

interface PermissionContextValue {
  /**
   * The raw ability, for checks that want CASL's own vocabulary — including
   * `ability.can('update', subject('Attendance', record))` against a whole
   * record rather than a class name.
   */
  ability: AppAbility
  /** The current user's role, or null when signed out or unassigned. */
  role: Role | null
  /** Every role the school has. Only the role editor needs this. */
  roles: Role[]
  /** False until the roles table has arrived — see the note above. */
  isReady: boolean
  /**
   * Held, and held *here*.
   *
   * Called without a scope on a scoped permission, this answers "can you do
   * this anywhere" — which is what a toolbar button needs to decide whether to
   * exist at all. Pass a scope to ask about one class.
   */
  can: (permission: Permission, scope?: PermissionScope) => boolean
  canAny: (permissions: Permission[]) => boolean
  /** Re-reads the table after the role editor saves. */
  refresh: () => Promise<void>
}

const PermissionContext = React.createContext<PermissionContextValue | null>(null)

export function PermissionProvider({ children }: { children: React.ReactNode }) {
  const currentUser = useCurrentUser()
  const [roles, setRoles] = React.useState<Role[]>([])
  const [isReady, setIsReady] = React.useState(false)

  const load = React.useCallback(async () => {
    try {
      setRoles(await fetchRoles())
    } catch (error) {
      console.error('Failed to load roles', error)
      // Leave `roles` empty: no role resolves, so nothing is permitted. An
      // error here must not become a free pass.
      setRoles([])
    } finally {
      setIsReady(true)
    }
  }, [])

  React.useEffect(() => {
    void load()
  }, [load])

  const role = React.useMemo(
    () => findRole(roles, currentUser?.role) ?? null,
    [roles, currentUser?.role],
  )

  const isClassScoped = role?.scopedToAssignedClasses === true
  const assignedClasses = React.useMemo(
    () => (isClassScoped ? (currentUser?.assignedClasses ?? []) : []),
    [isClassScoped, currentUser?.assignedClasses],
  )

  const ability = React.useMemo(
    () => defineAbilityFor(role, assignedClasses),
    [role, assignedClasses],
  )

  const value = React.useMemo<PermissionContextValue>(() => {
    /**
     * Permission-id checks, answered by the ability.
     *
     * Kept as the everyday call because a permission id is what a role stores
     * and what the editor toggles, so `can('attendance.mark')` reads the same
     * as the switch someone flipped. It resolves to the (action, subject) pair
     * and asks CASL, which is where scoping actually happens.
     */
    const can = (permission: Permission, scope?: PermissionScope) => {
      const definition = permissionDefinition(permission)
      if (!definition) return false
      return ability.can(
        definition.action,
        subjectFor(definition.subject, scope?.classSection),
      )
    }
    return {
      ability,
      role,
      roles,
      isReady,
      can,
      canAny: permissions => permissions.some(permission => can(permission)),
      refresh: load,
    }
  }, [ability, role, roles, isReady, load, isClassScoped, assignedClasses])

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>
}

export function usePermissions(): PermissionContextValue {
  const context = React.useContext(PermissionContext)
  if (!context) {
    throw new Error('usePermissions must be used inside a PermissionProvider')
  }
  return context
}
