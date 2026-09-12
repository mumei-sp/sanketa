/**
 * The bar that explains an empty app.
 *
 * An app that is correctly empty looks exactly like one that is broken, and
 * this access model produces correctly-empty apps on purpose: no permission
 * means no rows, and no rows means every screen is blank. So this says which
 * it is. Rendered outside every permission gate, for the same reason
 * `PreviewBanner` is — a person with no permissions here can reach no screen
 * that could tell them why.
 *
 * ── The two ways to arrive with nothing ────────────────────────────────
 * Both fall out of the shape of the tenant schema rather than being faults.
 *
 * **No role.** A `user_profiles` row exists and no `profile_roles` row points
 * at it. Somebody can be at a school — on the roster, on the staff list, in
 * the guardian table — without anyone having said what they may do. This used
 * to be reported only to people holding two schools, on the reasoning that
 * holding no role anywhere was "a different problem". From inside it is the
 * same problem: a blank screen and no explanation. The distinction is gone.
 *
 * **A role that reaches nothing.** The role exists, is narrowed, and the axis
 * it narrows on is empty — a teacher with no `teacher_classes`, a guardian
 * with no `student_guardians`. `defineAbilityFor` writes no rule at all in
 * that case, deliberately, so `can('attendance.mark')` is false rather than
 * true-until-you-name-a-class. The screen is then indistinguishable from
 * having no role, and until now it was explained as nothing at all.
 *
 * A role that is *not* narrowed — a principal, an accountant — reaches the
 * whole school and can never be in the second state. Which is why the check
 * asks each role about its own axis rather than looking for empty lists: an
 * unnarrowed role with no classes is not short of anything.
 *
 * ── What it no longer says ─────────────────────────────────────────────
 * It used to end "Switch school, or ask an administrator", and the switcher
 * hides below two contexts — so somebody with a role at only one of their two
 * schools read that advice beside no control that could take it. They are
 * moved to the school they can work in now (`recoverIfStranded`), so by the
 * time this renders there is genuinely nowhere else to be.
 */

import { Info } from 'lucide-react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { usePermissions } from '@/features/auth/PermissionContext'
import { listTenants } from '@/mocks/global'
import { resolveActiveAccess } from '@/mocks/tenant/profiles'
import type { TenantAccess } from '@/mocks/tenant/profiles'
import { activeTenant } from '@/mocks/_shared/tenant-context'
import type { Role } from '@/config/permissions'

/**
 * Why this app is empty, or null when it is not.
 *
 * Returns the sentence rather than a kind: there are four of them, each one
 * line, and a caller switching on a kind would only be reassembling the
 * reasoning that happens here.
 */
function emptyReason(access: TenantAccess, table: Role[], school: string): string | null {
  if (access.roleIds.length === 0) {
    return `You have no role at ${school} yet, so there is nothing here to show. An administrator there can give you one.`
  }

  const held = access.roleIds.flatMap(id => {
    const role = table.find(candidate => candidate.id === id)
    return role ? [role] : []
  })
  // An id with no row behind it grants nothing — the same reading `caller.ts`
  // takes of a role the school has deleted while somebody held it.
  if (held.length === 0) {
    return `Your role at ${school} no longer exists, so there is nothing here to show. An administrator there can give you another.`
  }

  const reaches = (role: Role) => {
    if (role.scopeBy === undefined) return true
    const axis = role.scopeBy === 'classes' ? access.assignedClasses : access.studentIds
    return axis.length > 0
  }
  if (held.some(reaches)) return null

  // Every role held here is narrowed to an empty axis. Name the axis, because
  // "assign me some classes" and "link me to my child" are different requests,
  // made of different people, and a bar that said only "nothing to show" would
  // leave the reader to guess which.
  const axes = new Set(held.map(role => role.scopeBy))
  if (axes.size === 1 && axes.has('classes')) {
    return `Your role at ${school} covers no classes yet, so there is nothing here to show. An administrator there can assign some.`
  }
  if (axes.size === 1 && axes.has('students')) {
    return `No children are linked to your account at ${school} yet, so there is nothing here to show. An administrator there can link them.`
  }
  return `Nothing has been assigned to your roles at ${school} yet, so there is nothing here to show. An administrator there can put that right.`
}

export function NoRoleHereNotice() {
  const currentUser = useCurrentUser()
  // The roles table says whether a role is narrowed, and it arrives
  // asynchronously. Saying nothing until it does beats announcing an empty app
  // to somebody whose roles have merely not loaded.
  const { roles, isReady } = usePermissions()
  if (!currentUser || !isReady) return null

  const schema = activeTenant()
  const name = listTenants().find(tenant => tenant.schema === schema)?.name ?? 'this school'
  // The session's access, like every other reader of this — a bar about what
  // you can do here has to ask the same question the services are answering.
  const reason = emptyReason(resolveActiveAccess(currentUser.id), roles, name)
  if (!reason) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]"
      style={{ pointerEvents: 'none' }}
    >
      <div
        className="flex max-w-full items-center gap-2.5 rounded-full border px-3 py-1.5 shadow-lg"
        style={{
          pointerEvents: 'auto',
          backgroundColor: 'var(--card)',
          borderColor: 'var(--border)',
        }}
      >
        <Info className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <p className="text-caption">{reason}</p>
      </div>
    </div>
  )
}
