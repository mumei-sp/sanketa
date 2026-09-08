/**
 * Taking a change back.
 *
 * The log records what a row looked like before and after, which is what makes
 * this possible at all: undoing is writing `before` back, whatever the
 * operation was. There is no per-operation inverse to keep in step with the
 * operations — a create is a change from nothing, a delete is a change to
 * nothing, and all three cases are the same write.
 *
 * ── Three rules that keep it honest ─────────────────────────────────────
 *
 * **Only the newest change to a row can be taken back.** Undoing an older one
 * would silently discard everything done since, and the person clicking it
 * would have no way to know. That check needs the whole log and so lives in the
 * view; everything here assumes it has already passed.
 *
 * **Undoing is itself a change.** It writes a new line rather than erasing the
 * old one, so the log stays a record rather than a draft — and because that new
 * line carries its own before and after, an undo can itself be undone.
 *
 * **The guards do not get a pass.** Reverting runs the same checks the original
 * control ran. A permission edit that would leave nobody able to manage
 * settings is refused whether it arrives from a switch or from here, and the
 * world has moved on since the entry was written: the role may be gone, the
 * person may hold something else, someone may now hold the role you are about
 * to delete.
 */

import {
  updateRole,
  deleteRole,
  restoreRole,
} from '@/api/services/role-service'
import {
  updateUserAccess,
  deleteUser,
  restoreUser,
  type SchoolUser,
} from '@/api/services/user-service'
import {
  migratePermissionIds,
  wouldOrphanSettings,
  type Permission,
  type Role,
  type ScopeAxis,
} from '@/config/permissions'
import type { AccessChange, AccessEvent } from '@/api/services/access-log-service'
import { describeClassChange, describePermissionChange, stillHasAnAdmin } from './helpers'

export interface UndoContext {
  roles: Role[]
  users: SchoolUser[]
  /** The signed-in user, who may not delete their own account. */
  currentUserId?: string
}

export type UndoOutcome =
  | { ok: true; summary: string; detail?: string; change: AccessChange }
  | { ok: false; reason: string }

/**
 * Why this entry cannot be taken back, or null if it can.
 *
 * Pure, and called both by the button (to disable itself and say why) and by
 * `undoEvent` (to refuse). One implementation, so the tooltip and the
 * behaviour cannot drift apart.
 */
export function undoBlocker(event: AccessEvent, context: UndoContext): string | null {
  if (!event.change) return 'Entries from before this feature cannot be taken back.'

  const { entity, id, before, after } = event.change
  const { roles, users, currentUserId } = context

  if (entity === 'role') {
    const role = roles.find(candidate => candidate.id === id)

    // Undoing a deletion: put it back.
    if (before && !after) {
      return role ? 'A role with that id exists again.' : null
    }

    // Undoing a creation: take it away.
    if (!before && after) {
      if (!role) return 'That role has already been removed.'
      if (role.builtin) return 'Built-in roles cannot be deleted.'
      const holders = users.filter(user => user.roleId === id).length
      if (holders > 0) {
        return `${holders} ${holders === 1 ? 'person holds' : 'people hold'} this role now.`
      }
      if (wouldOrphanSettings(roles.filter(candidate => candidate.id !== id))) {
        return 'It is the only role that can manage settings.'
      }
      return null
    }

    // Undoing an edit.
    if (!role) return 'That role no longer exists.'
    const permissions = before?.permissions as Permission[] | undefined
    if (permissions) {
      const after_ = roles.map(candidate =>
        candidate.id === id ? { ...candidate, permissions } : candidate,
      )
      if (wouldOrphanSettings(after_)) {
        return 'That would leave no role able to manage settings.'
      }
    }
    return null
  }

  const user = users.find(candidate => candidate.id === id)

  // Undoing a removal: put the account back.
  if (before && !after) {
    return user ? 'That account exists again.' : null
  }

  // Undoing a creation: remove the account.
  if (!before && after) {
    if (!user) return 'That account has already been removed.'
    if (user.id === currentUserId) return 'That is your own account.'
    if (!stillHasAnAdmin(users, roles, { id, roleId: null })) {
      return 'Someone must be able to manage settings.'
    }
    return null
  }

  // Undoing an edit.
  if (!user) return 'That account no longer exists.'
  const roleId = before?.roleId as string | undefined
  if (roleId !== undefined) {
    if (!roles.some(candidate => candidate.id === roleId)) {
      return `The role “${roleId}” no longer exists.`
    }
    if (!stillHasAnAdmin(users, roles, { id, roleId })) {
      return 'Someone must be able to manage settings.'
    }
  }
  return null
}

/** The fields of a role a stored `before` may carry. */
function rolePatch(fields: Record<string, unknown>) {
  const patch: Parameters<typeof updateRole>[1] = {}
  if ('name' in fields) patch.name = fields.name as string
  if ('description' in fields) patch.description = (fields.description as string) ?? ''
  if ('permissions' in fields) {
    // Through the rename map on the way out: the log is the one place a
    // pre-rename shape is *supposed* to survive, and writing those ids back
    // verbatim would hand the role grants the catalogue no longer defines.
    // `defineAbilityFor` skips unknown ids, so the role would quietly lose
    // them until the next load migrated the row — an intermittent-looking
    // failure with a very boring cause.
    patch.permissions = migratePermissionIds(fields.permissions as string[])
  }
  // Both spellings: entries written before the second scoping axis carry the
  // old boolean, and an audit log is exactly the place old shapes survive.
  if ('scopeBy' in fields) {
    patch.scopeBy = (fields.scopeBy as ScopeAxis | 'none' | undefined) ?? 'none'
  } else if ('scopedToAssignedClasses' in fields) {
    patch.scopeBy = fields.scopedToAssignedClasses === true ? 'classes' : 'none'
  }
  return patch
}

function userPatch(fields: Record<string, unknown>) {
  const patch: { roleId?: string; assignedClasses?: string[] } = {}
  if ('roleId' in fields) patch.roleId = fields.roleId as string
  if ('assignedClasses' in fields) {
    patch.assignedClasses = (fields.assignedClasses as string[] | undefined) ?? []
  }
  return patch
}

const REVERTED = 'Reverted — '
const REAPPLIED = 'Reapplied — '

/**
 * What to call the entry a reversal writes.
 *
 * Undoing an undo is a normal thing to do, and the naive `Reverted "…"` wrapper
 * nests: two round trips and the summary is quoting itself three deep. So the
 * two prefixes swap rather than stack, and the phrase underneath stays the
 * original change.
 *
 * It reads back its own prefix rather than carrying the root phrase in a second
 * field. Both sides of that string are written here, and the worst a mismatch
 * could do is word one line oddly.
 */
function reversalSummary(summary: string): string {
  if (summary.startsWith(REVERTED)) return REAPPLIED + summary.slice(REVERTED.length)
  if (summary.startsWith(REAPPLIED)) return REVERTED + summary.slice(REAPPLIED.length)
  return REVERTED + summary
}

/** What the reversal did, in the same words the original entry would use. */
function describeReversal(before: Record<string, unknown>, after: Record<string, unknown>) {
  if (Array.isArray(before.permissions) && Array.isArray(after.permissions)) {
    // Both sides through the rename map, for the same reason `rolePatch` does
    // it: a pre-rename entry otherwise describes itself with raw ids on one
    // side and human labels on the other, in the same sentence.
    return describePermissionChange(
      migratePermissionIds(after.permissions as string[]),
      migratePermissionIds(before.permissions as string[]),
    )
  }
  if (Array.isArray(before.assignedClasses) || Array.isArray(after.assignedClasses)) {
    return describeClassChange(
      (after.assignedClasses as string[]) ?? [],
      (before.assignedClasses as string[]) ?? [],
    )
  }
  return undefined
}

export async function undoEvent(event: AccessEvent, context: UndoContext): Promise<UndoOutcome> {
  const blocker = undoBlocker(event, context)
  if (blocker) return { ok: false, reason: blocker }

  // `undoBlocker` returns early when there is no change, so this is safe.
  const { entity, id, before, after } = event.change as AccessChange

  if (entity === 'role') {
    if (before && !after) {
      const restored = await restoreRole(before as unknown as Role)
      if (!restored) return { ok: false, reason: 'Could not put that role back.' }
      return {
        ok: true,
        summary: `Restored the role ${restored.name}`,
        detail: `${restored.permissions.length} permissions`,
        change: { entity, id, before: null, after: before },
      }
    }

    if (!before && after) {
      const name = (after.name as string | undefined) ?? id
      if (!(await deleteRole(id))) return { ok: false, reason: 'Could not remove that role.' }
      return {
        ok: true,
        summary: `Removed the role ${name}`,
        change: { entity, id, before: after, after: null },
      }
    }

    if (!before || !after) return { ok: false, reason: 'That entry has nothing to put back.' }
    if (!(await updateRole(id, rolePatch(before)))) {
      return { ok: false, reason: 'Could not save the reversal.' }
    }
    return {
      ok: true,
      summary: reversalSummary(event.summary),
      detail: describeReversal(before, after),
      change: { entity, id, before: after, after: before },
    }
  }

  if (before && !after) {
    const restored = await restoreUser(before as unknown as SchoolUser)
    if (!restored) return { ok: false, reason: 'Could not put that account back.' }
    return {
      ok: true,
      summary: `Restored ${restored.fullName}`,
      detail: restored.email,
      change: { entity, id, before: null, after: before },
    }
  }

  if (!before && after) {
    const name = (after.fullName as string | undefined) ?? id
    if (!(await deleteUser(id))) return { ok: false, reason: 'Could not remove that account.' }
    return {
      ok: true,
      summary: `Removed ${name}`,
      change: { entity, id, before: after, after: null },
    }
  }

  if (!before || !after) return { ok: false, reason: 'That entry has nothing to put back.' }
  if (!(await updateUserAccess(id, userPatch(before)))) {
    return { ok: false, reason: 'Could not save the reversal.' }
  }
  return {
    ok: true,
    summary: reversalSummary(event.summary),
    detail: describeReversal(before, after),
    change: { entity, id, before: after, after: before },
  }
}
