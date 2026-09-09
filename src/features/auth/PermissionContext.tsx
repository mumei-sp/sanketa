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
  type AbilityScope,
  type AppAbility,
  type SubjectFields,
} from '@/config/ability'
import { useCurrentUser } from '@/hooks/use-current-user'
import { resolveTenantAccess } from '@/mocks/profiles'
import { activeTenant } from '@/mocks/_shared/tenant-context'

/**
 * Where an action is being attempted — the record it is about.
 *
 * Pass whichever fields you have. A caller with a class in hand passes the
 * class; one looking at a student's record passes the student; a caller with
 * neither passes nothing and gets the "anywhere?" answer, which is what a
 * toolbar button wants.
 */
export type PermissionScope = SubjectFields

/** What the caller asks for when starting a preview. */
export interface PreviewRequest {
  roleId: string
  /**
   * What the previewed holder is narrowed to, on both axes.
   *
   * Previewing a *person* passes theirs, which is the faithful view. Previewing
   * a *role* has no person to ask, so the Roles tab passes a representative
   * set — a narrowed role with nothing on its axis can do nothing, and a
   * preview that showed that would hide the very behaviour being previewed.
   */
  scope: AbilityScope
  /** Set when previewing a particular person rather than a bare role. */
  personName?: string
}

/** An active preview, resolved against the roles table. */
export interface ActivePreview {
  role: Role
  personName?: string
  scope: AbilityScope
  /**
   * What the previewed role holds and the real user does not.
   *
   * Empty for an admin. Non-empty means the view on screen is *less* than the
   * role really gets, which the banner has to say rather than quietly imply.
   */
  withheld: Permission[]
}

interface PermissionContextValue {
  /**
   * The raw ability, for checks that want CASL's own vocabulary — including
   * `ability.can('update', subject('Attendance', record))` against a whole
   * record rather than a class name.
   */
  ability: AppAbility
  /**
   * The role every check on this page is answered against — the previewed one
   * while a preview is running, otherwise the user's own.
   */
  role: Role | null
  /** The user's own role, regardless of any preview. */
  realRole: Role | null
  /** The running preview, or null. */
  preview: ActivePreview | null
  startPreview: (request: PreviewRequest) => void
  stopPreview: () => void
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

  /**
   * The access this account actually has at the school it is looking at.
   *
   * Read from the profile rather than the session: the session says who they
   * are and which schools they may reach, and what they may do is a fact about
   * the school in front of them. A teacher at one school and a parent at
   * another has two answers, and a field on the session can hold one.
   */
  // Keyed on the school as well as the person, so switching recomputes rather
  // than serving the last school's answer. Switching currently reloads the
  // app, so this is belt as well as braces — until a switcher does it live.
  const school = activeTenant()
  const access = React.useMemo(
    () => resolveTenantAccess(currentUser?.id),
    // `school` is not passed in, it is read inside — the resolver asks the
    // tenant context which school is active. So it is a real dependency that
    // the linter cannot see, and dropping it would serve the previous
    // school's roles after a switch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentUser?.id, school],
  )

  /**
   * Every role held here. Unknown ids are dropped — a profile can name a role
   * the school has since deleted.
   */
  const realRoles = React.useMemo(
    () =>
      access.roleIds.flatMap((id: string) => {
        const role = findRole(roles, id)
        return role ? [role] : []
      }),
    [roles, access.roleIds],
  )

  /**
   * The one role a preview narrows against.
   *
   * A preview shows what *another* role would see, clamped to what the viewer
   * really holds — so it needs a single set of the viewer's own permissions to
   * clamp against, which for someone holding several is their union.
   */
  const realRole = React.useMemo<Role | null>(() => {
    if (realRoles.length === 0) return null
    if (realRoles.length === 1) return realRoles[0]
    return {
      ...realRoles[0],
      permissions: [...new Set(realRoles.flatMap((role: Role) => role.permissions))],
    }
  }, [realRoles])

  const [request, setRequest] = React.useState<PreviewRequest | null>(null)

  /**
   * The preview, resolved every render rather than captured on start.
   *
   * So editing a role while previewing it shows the edit, and deleting it ends
   * the preview instead of leaving a view of a role that no longer exists.
   */
  const preview = React.useMemo<ActivePreview | null>(() => {
    if (!request || !realRole) return null
    const previewed = roles.find(candidate => candidate.id === request.roleId)
    if (!previewed) return null

    return {
      role: {
        ...previewed,
        // The narrowing described at the top of this file.
        permissions: previewed.permissions.filter(permission =>
          realRole.permissions.includes(permission),
        ),
      },
      personName: request.personName,
      scope: request.scope,
      withheld: previewed.permissions.filter(
        permission => !realRole.permissions.includes(permission),
      ),
    }
  }, [request, roles, realRole])

  const role = preview?.role ?? realRole

  /**
   * What this account is narrowed to, on both axes.
   *
   * Assembled here because this is the only place that knows both the profile
   * and the running preview. `assignedClasses` for staff, `studentIds` for a
   * student's own record or a parent's children — both per school, which is
   * why they come from the profile rather than the session.
   */
  const scope = React.useMemo<AbilityScope>(() => {
    if (preview) return preview.scope
    return { classSections: access.assignedClasses, studentIds: access.studentIds }
  }, [preview, access.assignedClasses, access.studentIds])

  /**
   * A preview replaces every role with the one being previewed; otherwise the
   * ability is the union of all of them, each narrowed on its own axis.
   */
  const ability = React.useMemo(
    () => defineAbilityFor(preview ? preview.role : realRoles, scope),
    [preview, realRoles, scope],
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
      return ability.can(definition.action, subjectFor(definition.subject, scope))
    }
    return {
      ability,
      role,
      realRole,
      preview,
      startPreview: setRequest,
      stopPreview: () => setRequest(null),
      roles,
      isReady,
      can,
      canAny: permissions => permissions.some(permission => can(permission)),
      refresh: load,
    }
  }, [ability, role, realRole, preview, roles, isReady, load])

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>
}

export function usePermissions(): PermissionContextValue {
  const context = React.useContext(PermissionContext)
  if (!context) {
    throw new Error('usePermissions must be used inside a PermissionProvider')
  }
  return context
}
