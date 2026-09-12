/**
 * What to call somebody under their name.
 *
 * Their roles at the school in view, because that is what a role is now — and
 * plural, because a person can hold several on one side: an acting head of
 * department is a Teacher and an HOD, and picking one of the two would be a
 * choice nobody asked for.
 *
 * ── Why it is narrowed, and what that changed ──────────────────────────
 * It used to read the whole profile, so the member of staff whose child
 * attends was labelled "Teacher · Parent" — true about the person and wrong
 * about the session, which is only ever one of those at a time. It reads the
 * active side now, so the label names the thing the rest of the screen is
 * obeying. Switch to her family side and it says "Parent", because that is
 * what she is holding.
 *
 * ── Why a hook and not two copies ──────────────────────────────────────
 * It was two copies, character for character, in `UserMenu` and `AppSidebar` —
 * the two places a person's role is shown, which is exactly the pair that must
 * never disagree. The first edit either of them needed separately would have
 * been the one that made them differ.
 */

import * as React from 'react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { usePermissions } from '@/features/auth/PermissionContext'
import { resolveActiveAccess } from '@/mocks/tenant/profiles'
import { activeTenant } from '@/mocks/_shared/tenant-context'

/** What to show when somebody is at a school that has given them nothing to do. */
const NO_ROLE = 'No role here'

export function useRoleLabel(): string {
  const currentUser = useCurrentUser()
  const { roles } = usePermissions()
  const school = activeTenant()

  const { roleIds } = React.useMemo(
    () => resolveActiveAccess(currentUser?.id),
    // `school` is read inside the resolver, not passed — a real dependency the
    // linter cannot see. Without it the label survives a school switch and
    // names a role held somewhere else.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentUser?.id, school],
  )

  // An id with no row behind it is shown as itself rather than dropped: a role
  // the school deleted while somebody held it should look like the loose end
  // it is, not like a role they never had.
  const named = roleIds.map(id => roles.find(role => role.id === id)?.name ?? id)
  return named.length > 0 ? named.join(' · ') : NO_ROLE
}
