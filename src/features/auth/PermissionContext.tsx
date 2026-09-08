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
import {
  findRole,
  SCOPED_PERMISSIONS,
  type Permission,
  type Role,
} from '@/config/permissions'
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
  /** The current user's role, or null when signed out or unassigned. */
  role: Role | null
  /** Classes this user may write to. Empty when their role is not scoped. */
  assignedClasses: string[]
  /** True when this role's write permissions are limited to those classes. */
  isClassScoped: boolean
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

  const granted = React.useMemo(() => new Set(role?.permissions ?? []), [role])

  const isClassScoped = role?.scopedToAssignedClasses === true
  const assignedClasses = React.useMemo(
    () => (isClassScoped ? (currentUser?.assignedClasses ?? []) : []),
    [isClassScoped, currentUser?.assignedClasses],
  )

  const value = React.useMemo<PermissionContextValue>(() => {
    const can = (permission: Permission, scope?: PermissionScope) => {
      if (!granted.has(permission)) return false
      // Unscoped roles hold everything they hold, everywhere.
      if (!isClassScoped) return true
      // Reading is never narrowed — a teacher looks up any class's register;
      // it is changing one that belongs to whoever owns the class.
      if (!SCOPED_PERMISSIONS.has(permission)) return true
      // No class named means "anywhere?", which a teacher with any assignment
      // can answer yes to. The per-class question is asked with a scope.
      if (!scope?.classSection) return assignedClasses.length > 0
      return assignedClasses.includes(scope.classSection)
    }
    return {
      role,
      roles,
      assignedClasses,
      isClassScoped,
      isReady,
      can,
      canAny: permissions => permissions.some(permission => can(permission)),
      refresh: load,
    }
  }, [role, roles, isReady, granted, load, isClassScoped, assignedClasses])

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>
}

export function usePermissions(): PermissionContextValue {
  const context = React.useContext(PermissionContext)
  if (!context) {
    throw new Error('usePermissions must be used inside a PermissionProvider')
  }
  return context
}

/**
 * Renders its children only when the permission is held.
 *
 * For inline controls — a Delete button inside a row — where a hook plus a
 * ternary would be more ceremony than the thing it guards.
 *
 * ```tsx
 * <Can permission="notices.manage">
 *   <Button onClick={remove}>Delete</Button>
 * </Can>
 * ```
 */
export function Can({
  permission,
  children,
  fallback = null,
}: {
  permission: Permission
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const { can, isReady } = usePermissions()
  if (!isReady) return null
  return can(permission) ? <>{children}</> : <>{fallback}</>
}
