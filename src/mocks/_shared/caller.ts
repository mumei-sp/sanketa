/**
 * Who is asking — as a server would know it, not as a caller claims.
 *
 * Every read in `src/mocks/` runs through this to drop rows the caller may not
 * see. That is the difference between a permission system and a rendering
 * decision, and it is the one change that has to land before a family can sign
 * in: until now the services returned every row and the browser filtered, so
 * "a parent can only see their children" meant *another child's marks reached
 * this browser and were merely not drawn*. Fine while every account belonged to
 * staff, who are trusted with the data either way. Not fine for a parent.
 *
 * ── Why it reads the session rather than taking an argument ─────────────
 * A backend takes the caller from the request's token, where the client cannot
 * choose it. Passing a scope into every service would put the client in charge
 * of its own filtering, and would need every call site to remember — the exact
 * shape of bug this exists to prevent. So the mock reads the stored session,
 * which is the closest thing it has to a token, and no call site changes.
 *
 * The same `defineAbilityFor` the UI runs. One definition of who may see what,
 * enforced in two places, rather than a copy here that drifts from the copy
 * there.
 */

import { authUtils } from '@/api/utils/auth'
import { listRoles } from '@/mocks/roles/store'
import { resolveTenantAccess } from '@/mocks/profiles'
import { defineAbilityFor, subjectFor, type AppAbility, type SubjectFields } from '@/config/ability'
import { findRole, type Action, type Subject } from '@/config/permissions'

/**
 * Built per call: a session, a role or the active school can change between
 * two reads.
 *
 * Roles and both scope axes come from the caller's *profile at the active
 * school*, not from the session. The session says who they are and which
 * schools they may reach; what they may do is a fact about the school they
 * are looking at, and a session stamped at sign-in cannot answer it for two
 * schools at once. Resolving per call is also what fixes the old complaint
 * that linking a child needed a sign-out before it took effect.
 */
function abilityForCurrentSession(): AppAbility {
  const session = authUtils.getUser()
  if (!session) return defineAbilityFor(null, { classSections: [], studentIds: [] })

  const access = resolveTenantAccess(session.id)
  const table = listRoles()
  // Unknown ids are dropped rather than treated as unrestricted: a profile can
  // name a role a school has since deleted.
  const held = access.roleIds.flatMap(id => {
    const role = findRole(table, id)
    return role ? [role] : []
  })

  return defineAbilityFor(held, {
    classSections: access.assignedClasses,
    studentIds: access.studentIds,
  })
}

/**
 * Drop the rows this caller may not read.
 *
 * `key` says which record each row is about. A row whose key cannot be
 * determined is *withheld* rather than passed through: a row nobody can
 * attribute is exactly the row a narrowed caller should not receive, and
 * letting it through is how a filter fails open.
 *
 * With no session there is no caller, and the answer is nothing. A backend
 * meets a tokenless request with a 401, not with the whole table, and the
 * point of this file is to behave like one — returning every row when nobody
 * is signed in would put the widest hole in the component whose job is to be
 * the boundary. The router keeps that path unreachable today; this makes it
 * safe if it ever is not.
 */
export function visibleToCaller<T>(
  rows: T[],
  action: Action,
  subject: Subject,
  key: (row: T) => SubjectFields | undefined,
): T[] {
  if (!authUtils.getUser()) return []

  const ability = abilityForCurrentSession()
  // A caller who may see every row matches all of them, so skip the per-row
  // work rather than asking CASL forty times for an answer that cannot vary.
  if (seesEveryRow(ability, action, subject)) return rows

  return rows.filter(row => {
    const fields = key(row)
    if (!fields) return false
    return ability.can(action, subjectFor(subject, fields))
  })
}

/**
 * May this caller see every row of this kind?
 *
 * True only when they hold a rule with no conditions on it — one that matches
 * any record. That is the question, and getting it wrong is what let two
 * aggregates leak.
 *
 * The first version asked the opposite one, "is this caller *narrowed*", as
 * `rules.length > 0 && rules.every(has conditions)`. A caller holding no rule
 * at all scores false there, exactly like an admin, because there is nothing
 * to be narrowed. So a Teacher — who holds no finance permission whatsoever —
 * passed the fee-stats guard and received the school's totals, and an
 * Accountant with no attendance permission received every attendance record.
 * The list reads gave both of them nothing, which is what kept it hidden.
 *
 * `can(action, subject)` cannot stand in for this: with a bare subject name it
 * answers "anywhere?", which a narrowed caller also answers yes to.
 *
 * Inverted rules (`cannot`) are excluded. Nothing writes one today, but one
 * would be a *removal* of access, and counting it as permission to see
 * everything is the same failing-open shape as the bug above.
 */
function seesEveryRow(ability: AppAbility, action: Action, subject: Subject): boolean {
  return ability
    .rulesFor(action, subject)
    .some(rule => rule.conditions === undefined && !rule.inverted)
}

/**
 * One record, or nothing.
 *
 * The list reads were the easy half. A read that takes an id — `fetchStudentById`,
 * `fetchStudentReportCard` — takes it straight from the caller, which makes it
 * the one somebody would actually poke at, and filtering a list does nothing
 * for it. Signed in as a parent of student 7, `fetchStudentById('23')` handed
 * back another child's record until this existed.
 *
 * Returns `undefined` rather than throwing: a caller asking for a record they
 * may not see should be told it is not there, not that it exists and is
 * forbidden. "No such student" leaks nothing; "not yours" confirms the id.
 */
export function visibleRecordToCaller<T>(
  row: T | undefined | null,
  action: Action,
  subject: Subject,
  key: (row: T) => SubjectFields | undefined,
): T | undefined {
  if (!row) return undefined
  const [only] = visibleToCaller([row], action, subject, key)
  return only
}

/**
 * May this caller see a school-wide aggregate of this kind?
 *
 * For reads that return one figure rather than rows — fee totals, attendance
 * trends — where there is nothing to filter. Only a caller who may see every
 * row may see them summed: a narrowed family has no business knowing what the
 * school collected, and neither has a member of staff holding no permission on
 * the subject at all.
 */
export function callerSeesEveryRow(action: Action, subject: Subject): boolean {
  if (!authUtils.getUser()) return false
  return seesEveryRow(abilityForCurrentSession(), action, subject)
}
