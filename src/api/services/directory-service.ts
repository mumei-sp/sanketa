/**
 * Directory API Service
 *
 * Everybody at this school, for the places that need to name one of them.
 *
 * Separate from `user-service`, which is about *accounts* — five of them at
 * Kendriya — where this is about *people*, of whom there are eleven hundred and
 * twenty-nine. Most of them have no login and never will; a student is on the
 * roster and a guardian is on a child's record whether or not anybody ever
 * issues them a password. `user_profiles` is the row that says a person is
 * here, so it is the row an audience names.
 */

import apiClient from '@/api/client'
import { mockOrHttp } from './_adapter'
import { withLatency } from '@/mocks/_shared'
import { callerSeesEveryRow } from '@/mocks/_shared/caller'
import { listProfiles, capacitiesOf } from '@/mocks/tenant/profiles'

/** One person, as an option to be picked. */
export interface DirectoryEntry {
  profileId: string
  name: string
  /** What they are here — `Teacher`, `Student`, `Guardian` — for telling two
   *  Sharmas apart in a list. */
  detail: string
}

const CAPACITY_LABELS: Record<string, string> = {
  student: 'Student',
  teacher: 'Teacher',
  staff: 'Staff',
  guardian: 'Guardian',
}

/**
 * Everybody here, to be named.
 *
 * ── Why `callerSeesEveryRow` and not `callerMay` ──────────────────────
 * `callerMay('read', 'Student')` asks "anywhere?", and a parent narrowed to
 * one child answers yes to that — it is the exact trap `caller.ts` documents.
 * The question here is whether this caller may see the *whole* roster, which
 * only an unnarrowed reader can: a principal and a teacher yes, a family no.
 *
 * The compose forms that use this are already behind `notices.manage` and
 * `calendar.manage`, so this is the second lock rather than the first.
 *
 * @apiRoute GET /api/v1/directory
 */
export async function fetchDirectory(): Promise<DirectoryEntry[]> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 120, max: 300 })
      if (!callerSeesEveryRow('read', 'Student')) return []

      return listProfiles()
        .filter(profile => !profile.isDeleted)
        .map(profile => {
          const capacities = capacitiesOf(profile.id)
          return {
            profileId: profile.id,
            name: profile.fullName,
            // The first capacity is enough to disambiguate, and a person who
            // is two things is rare enough that listing both would cost every
            // other row its width.
            detail: CAPACITY_LABELS[capacities[0] ?? ''] ?? 'At this school',
          }
        })
        .sort((a, b) => a.name.localeCompare(b.name))
    },
    async () => {
      const { data } = await apiClient.get<DirectoryEntry[]>('/directory')
      return data
    },
  )
}
