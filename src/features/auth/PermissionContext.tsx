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
import { useCurrentUser } from '@/hooks/use-current-user'

interface PermissionContextValue {
  /** The current user's role, or null when signed out or unassigned. */
  role: Role | null
  /** Every role the school has. Only the role editor needs this. */
  roles: Role[]
  /** False until the roles table has arrived — see the note above. */
  isReady: boolean
  can: (permission: Permission) => boolean
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

  const value = React.useMemo<PermissionContextValue>(() => {
    const can = (permission: Permission) => granted.has(permission)
    return {
      role,
      roles,
      isReady,
      can,
      canAny: permissions => permissions.some(can),
      refresh: load,
    }
  }, [role, roles, isReady, granted, load])

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
