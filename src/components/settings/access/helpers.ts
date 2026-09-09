/**
 * The bits of the Access screen that both tabs and the undo engine need.
 *
 * They live here rather than in whichever tab happened to need them first,
 * because the moment undo existed the guards had two callers: the control that
 * makes a change, and the control that takes it back. A guard implemented
 * twice is a guard that will eventually disagree with itself.
 */

import type { Permission, Role } from '@/config/permissions'
import { permissionDefinition } from '@/config/ability'

/**
 * Just enough of a person to answer the question below.
 *
 * Shaped like `Person` — identity nested, roles alongside — so the callers can
 * pass what they already have rather than mapping a list on every check.
 */
export interface RoleHolder {
  user: { id: string }
  roleIds: readonly string[]
}

/**
 * Would anybody still be able to reach the settings panel after this change?
 *
 * The one mistake in a people directory that cannot be undone from inside the
 * app: a role can keep `system.settings` while the last person holding that
 * role is moved off it, and then nobody can put anyone back.
 *
 * Asked of *this school*, because that is where roles live now. Locking
 * yourself out of one school is entirely possible while remaining an
 * administrator at another, and it is no less locked out for that.
 *
 * `changing` is the roles the row would hold afterwards — an empty list for
 * somebody being removed, or having their last role taken away.
 */
export function stillHasAnAdmin(
  people: readonly RoleHolder[],
  roles: Role[],
  changing: { id: string; roleIds: readonly string[] },
): boolean {
  const canManage = (roleId: string) =>
    roles.find(role => role.id === roleId)?.permissions.includes('system.settings') === true

  return people.some(person => {
    // Several roles now, so the question is whether *any* of them reaches
    // settings — a principal who is also a parent is still a principal.
    const held = person.user.id === changing.id ? changing.roleIds : person.roleIds
    return held.some(canManage)
  })
}

/** Human names for permission ids. */
export function labelsFor(ids: Permission[]): string[] {
  return ids.map(id => permissionDefinition(id)?.label ?? id)
}

/**
 * "+ Manage finance, − View transport" — what changed, in words.
 *
 * Capped, because granting a whole group at once produces a line nobody reads;
 * past a handful the count is the useful fact.
 */
export function describePermissionChange(
  before: Permission[],
  after: Permission[],
): string | undefined {
  const added = after.filter(permission => !before.includes(permission))
  const removed = before.filter(permission => !after.includes(permission))
  if (added.length === 0 && removed.length === 0) return undefined

  const parts: string[] = []
  const push = (ids: Permission[], sign: string) => {
    if (ids.length === 0) return
    if (ids.length > 4) {
      parts.push(`${sign} ${ids.length} permissions`)
      return
    }
    labelsFor(ids).forEach(label => parts.push(`${sign} ${label}`))
  }
  push(added, '+')
  push(removed, '−')
  return parts.join(', ')
}

/** The same, for a person's class list. */
export function describeClassChange(before: string[], after: string[]): string | undefined {
  const added = after.filter(label => !before.includes(label))
  const removed = before.filter(label => !after.includes(label))
  if (added.length === 0 && removed.length === 0) return undefined

  const parts: string[] = []
  const push = (labels: string[], sign: string) => {
    if (labels.length === 0) return
    if (labels.length > 5) parts.push(`${sign} ${labels.length} classes`)
    else labels.forEach(label => parts.push(`${sign} ${label}`))
  }
  push(added, '+')
  push(removed, '−')
  return parts.join(', ')
}
