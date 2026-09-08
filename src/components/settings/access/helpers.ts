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
import type { SchoolUser } from '@/api/services/user-service'

/**
 * Would anybody still be able to reach the settings panel after this change?
 *
 * The one mistake in a people directory that cannot be undone from inside the
 * app: a role can keep `settings.manage` while the last person holding that
 * role is moved off it, and then nobody can put anyone back.
 *
 * `changing` describes the row about to move. Pass `roleId: null` for a person
 * being removed entirely.
 */
export function stillHasAnAdmin(
  users: SchoolUser[],
  roles: Role[],
  changing: { id: string; roleId: string | null },
): boolean {
  const canManage = (roleId: string) =>
    roles.find(role => role.id === roleId)?.permissions.includes('settings.manage') === true

  return users.some(user => {
    if (user.id !== changing.id) return canManage(user.roleId)
    return changing.roleId !== null && canManage(changing.roleId)
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
