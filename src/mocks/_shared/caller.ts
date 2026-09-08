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
import { defineAbilityFor, subjectFor, type AppAbility, type SubjectFields } from '@/config/ability'
import { findRole, type Action, type Subject } from '@/config/permissions'

/** Built per call: a session or a role can change between two reads. */
function abilityForCurrentSession(): AppAbility {
  const session = authUtils.getUser()
  const role = findRole(listRoles(), session?.role) ?? null
  return defineAbilityFor(role, {
    classSections: session?.assignedClasses ?? [],
    studentIds: session?.studentIds ?? [],
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
 * With no session at all — sign-in screen, tests — nothing is filtered. That
 * is the mock's own boundary, not a policy: there is no caller to narrow to.
 */
export function visibleToCaller<T>(
  rows: T[],
  action: Action,
  subject: Subject,
  key: (row: T) => SubjectFields | undefined,
): T[] {
  if (!authUtils.getUser()) return rows

  const ability = abilityForCurrentSession()
  // An unnarrowed caller matches every row, so skip the per-row work rather
  // than asking CASL forty times for an answer that cannot vary.
  if (ability.can(action, subject) && !isNarrowed(ability, action, subject)) return rows

  return rows.filter(row => {
    const fields = key(row)
    if (!fields) return false
    return ability.can(action, subjectFor(subject, fields))
  })
}

/**
 * Does any rule for this pair carry a condition?
 *
 * `can(action, subject)` with a bare name answers "anywhere?", which is true
 * for a narrowed caller as well as an unnarrowed one — so it cannot tell them
 * apart on its own. The rules can: a rule with no `conditions` matches every
 * record, and if the caller has one of those there is nothing to filter.
 */
function isNarrowed(ability: AppAbility, action: Action, subject: Subject): boolean {
  const rules = ability.rulesFor(action, subject)
  return rules.length > 0 && rules.every(rule => rule.conditions !== undefined)
}
