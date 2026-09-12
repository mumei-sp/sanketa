/**
 * Everything one login could be, across every school it can reach.
 *
 * ── The one place the schema boundary is crossed on purpose ────────────
 * Every other read in this mock is answered from one school's rows, because
 * that is what schema-per-tenant means and `tenant-context` makes it hard to
 * do otherwise. This read cannot be: the question "where can I go and as
 * whom?" is asked *before* a school is chosen, and its answer spans all of
 * them.
 *
 * So it fans out — walking the tenants in the token's claim, switching the
 * active school around each read, and putting it back. That is the honest
 * shape of the thing on a real backend too, where it is N queries against N
 * schemas behind one endpoint rather than a join, because there is no join to
 * be had. Keeping it in one function with a name means the crossing happens
 * deliberately, once, somewhere a reviewer can find it — rather than being
 * something any screen might start doing.
 *
 * `GET /api/v1/me/contexts` is the route this stands in for.
 *
 * ── Roles are a school's data, so they are read inside the school ──────
 * Which is the whole reason for the fan-out. `user_tenant_mapping` is global
 * and says which schools; `profile_roles` is per-school and says what you are
 * in each. One is not derivable from the other, and the global database is
 * forbidden from holding a tenant's role ids — see SCHEMA.md.
 */

import { activeTenant, setActiveTenant } from '@/mocks/_shared/tenant-context'
import { resolveTenantAccess, sidesAvailable, narrowToSide } from '@/mocks/tenant/profiles'
import { listRoles } from '@/mocks/tenant/roles/store'
import { findStudent } from '@/mocks/tenant/students/store'
import { getDisplayName } from '@/features/students/utils/formatting'
import { CONTEXT_SIDES, type ContextSide, type Role } from '@/config/permissions'
import { resolveTenants } from './memberships/store'

/** One child a family context is about. */
export interface ContextChild {
  studentId: string
  name: string
  /** `8B`, or undefined for a record with no section yet. */
  classLabel?: string
}

/** One way into one school: this person, on one side, here. */
export interface UserContext {
  /** `kendriya:family`. Stable, and what a stored choice names. */
  id: string
  tenantCode: string
  tenantSchema: string
  tenantName: string
  side: ContextSide
  /** Every role held on this side. The permissions are their union. */
  roleIds: string[]
  /** The role the tile is named after — see `primaryRole`. */
  primaryRoleName: string
  /**
   * What this grants, in the school's own words.
   *
   * `Role.description`, which a school owns and edits in the role editor, so
   * it stays true when a school invents "Librarian" or takes finance away from
   * Principal. Null when the role carries none — the tile shows one line
   * instead of two rather than inventing a sentence that could go stale.
   */
  summary: string | null
  /** The children this side is about. Empty for staff. */
  children: ContextChild[]
  /** The class sections this side is narrowed to. Empty for family. */
  assignedClasses: string[]
  /** True when no role on this side narrows it — a principal, an admin. */
  reachesWholeSchool: boolean
}

/** One school this login can reach, and the ways in it offers. */
export interface TenantContexts {
  tenantCode: string
  tenantSchema: string
  tenantName: string
  /**
   * The sides available here, staff first. **Empty is a real answer**: a
   * membership with no roles behind it is somebody enrolled at a school that
   * has not yet said what they do, which the chooser shows as a school you
   * cannot enter yet rather than hiding.
   */
  sides: UserContext[]
}

/**
 * The role a context is named after.
 *
 * Nothing in the schema ranks roles, so this picks the one granting the most —
 * which gets "Principal" rather than "Teacher" for the head who still teaches,
 * and is stable because a tie falls back to the roles table's own order.
 *
 * `roles.hierarchy_level` is carried in the Postgres draft and unimplemented
 * (see SCHEMA.md, "mirrored but not implemented"). This is the first thing
 * that would use it, and the day it lands this function is where it goes.
 */
function primaryRole(held: Role[]): Role | undefined {
  return held.reduce<Role | undefined>(
    (best, role) =>
      best === undefined || role.permissions.length > best.permissions.length ? role : best,
    undefined,
  )
}

/** The active school's contexts. Assumes the caller has already switched to it. */
function contextsHere(
  userId: string,
  tenant: { code: string; schema: string; name: string },
): UserContext[] {
  const access = resolveTenantAccess(userId)
  const table = listRoles()

  return sidesAvailable(access).map(side => {
    const narrowed = narrowToSide(access, side)
    const held = narrowed.roleIds.flatMap(id => {
      const role = table.find(candidate => candidate.id === id)
      return role ? [role] : []
    })
    const primary = primaryRole(held)

    return {
      id: `${tenant.code}:${side}`,
      tenantCode: tenant.code,
      tenantSchema: tenant.schema,
      tenantName: tenant.name,
      side,
      roleIds: narrowed.roleIds,
      // An id with no row behind it still names the context rather than
      // leaving it blank — a role deleted while somebody held it.
      primaryRoleName: primary?.name ?? narrowed.roleIds[0] ?? 'No role',
      summary: primary?.description ?? null,
      children: narrowed.studentIds.flatMap(studentId => {
        const student = findStudent(studentId)
        if (!student) return []
        const classLabel =
          student.class ??
          (student.gradeLevel && student.section
            ? `${student.gradeLevel}${student.section}`
            : undefined)
        return [{ studentId, name: getDisplayName(student), classLabel }]
      }),
      assignedClasses: narrowed.assignedClasses,
      reachesWholeSchool: held.length > 0 && held.some(role => role.scopeBy === undefined),
    }
  })
}

/**
 * Every school this login can reach, and what it is in each.
 *
 * Ordered by the membership resolution, which is the same order the context
 * token's `tenantIds` claim carries — so the school a person lands on when
 * nothing has been chosen is the same one here as on the server.
 */
export function listUserContexts(userId: string | undefined): TenantContexts[] {
  if (!userId) return []

  // Put back whatever was active, whatever happens below. A throw that left
  // the app pointed at the last school in the loop would be a tenant leak
  // caused by the function that exists to describe tenants.
  const restore = activeTenant()
  try {
    return resolveTenants(userId).map(tenant => {
      setActiveTenant(tenant.schema)
      return {
        tenantCode: tenant.code,
        tenantSchema: tenant.schema,
        tenantName: tenant.name,
        sides: contextsHere(userId, tenant),
      }
    })
  } finally {
    setActiveTenant(restore)
  }
}

/** Flattened, for the places that want one list of tiles. Staff before family. */
export function flattenContexts(tenants: TenantContexts[]): UserContext[] {
  return tenants.flatMap(tenant => tenant.sides)
}

/**
 * Whether a stored choice is still one this person holds.
 *
 * The counterpart of the context token's tenant check, one level down: a side
 * remembered in `localStorage` is a preference, and a role revoked since it
 * was chosen makes it a stale one. Checked rather than trusted for the same
 * reason `applyTenantContext` checks the active tenant.
 */
export function isContextAvailable(
  tenants: TenantContexts[],
  tenantSchema: string,
  side: ContextSide,
): boolean {
  return tenants.some(
    tenant =>
      tenant.tenantSchema === tenantSchema && tenant.sides.some(context => context.side === side),
  )
}

/** Sides in offering order, for anything building its own list. */
export { CONTEXT_SIDES }
