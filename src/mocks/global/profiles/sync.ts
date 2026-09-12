/**
 * Pushing the global profile down into a school's replica.
 *
 * On the real platform this is a trigger: update `GlobalDB.user_profiles` and
 * every tenant the user belongs to gets the twelve replicated columns written
 * over its copy, with `synced_at` and `sync_version` recording that it
 * happened. `DENORMALIZED_PROFILE_ARCHITECTURE.md` names three moments it
 * fires — a profile edit, a user joining a tenant, and a lazy pull when a
 * school finds a row it has never synced.
 *
 * Here it is a function, and the caller says when. That is a deliberate
 * difference and the mock should not pretend otherwise: a browser has no
 * trigger, no queue and no second database connection, so there is nowhere for
 * this to happen behind anybody's back.
 *
 * ── Why it lives between the two stores ────────────────────────────────
 * `global/profiles` cannot import a tenant table without the global layer
 * knowing about schools, and `tenant/profiles` cannot import the global one
 * without the replica knowing where it came from — which in the real system it
 * does not; a trigger writes it. So the sync is neither table's, the same way
 * `tenant/profiles/capacities.ts` is neither `profiles`' nor `students`'.
 *
 * ── One school at a time ───────────────────────────────────────────────
 * `tenantKey` resolves the *active* school, so this writes the replica of
 * whichever school is open. The real trigger fans out to every tenant in
 * `user_tenant_mapping`; here the other school's rows are a different
 * `localStorage` key that the store would have to be pointed at, and a mock
 * that switched tenant context underneath itself to write two rows would be
 * modelling the fan-out with the one mechanism the tenant boundary exists to
 * prevent. So: the school you are in, when you are in it — which is what the
 * lazy pull does anyway, and it converges on the same rows.
 */

import { replicaOf } from './store'
import { personOf, upsertPerson, listProfiles } from '@/mocks/tenant/profiles/store'

/**
 * Write the global row over this school's copy for one account.
 *
 * Returns false when there is nothing to do: no global profile, or nobody at
 * this school holding that login. Both are ordinary — most accounts are not at
 * most schools.
 */
export function syncProfileToActiveTenant(userId: string): boolean {
  const subset = replicaOf(userId)
  if (!subset) return false

  const local = listProfiles().find(profile => profile.userId === String(userId))
  if (!local) return false

  const current = personOf(local.id)
  upsertPerson(
    local.id,
    {
      ...subset,
      syncedAt: new Date().toISOString(),
      // Bumped on every sync, not only on a change, because that is what a
      // version is for: it answers "is this copy the one I last sent", and a
      // no-op sync still proves the copy is current.
      syncVersion: (current.syncVersion ?? 0) + 1,
    },
    // Otherwise the replica would write straight back up and the stamp would
    // be a record of this function talking to itself.
    { fromSync: true },
  )
  return true
}

/**
 * The lazy pull: sync anyone at this school who has never been synced.
 *
 * The seed writes a school's profiles from that school's own fixtures, so on
 * first run the replicas are correct and unstamped. Calling this at sign-in
 * stamps them and puts the global row beyond doubt — after which a name that
 * differs between the two is a real divergence rather than a seed that never
 * met its source.
 *
 * Returns how many rows it wrote.
 */
export function syncUnsyncedProfiles(): number {
  return listProfiles().filter(profile => profile.userId && profile.syncedAt === undefined)
    .reduce((count, profile) => count + (syncProfileToActiveTenant(profile.userId!) ? 1 : 0), 0)
}
