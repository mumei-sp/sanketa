/**
 * Access log API Service
 *
 * Mock path (the in-browser audit table under `src/mocks/access-log`) + HTTP
 * path (apiClient).
 *
 * Note the shape of `recordAccessEvent`: it takes an actor because the mock
 * has no session to read one from. The HTTP implementation does not send it —
 * a client that could name the actor on an audit record could name someone
 * else, so the server takes it from the token and ignores anything sent.
 */

import apiClient from '@/api/client'
import { mockOrHttp } from './_adapter'
import { withLatency } from '@/mocks/_shared'
import { callerMay } from '@/mocks/_shared/caller'
import * as mockServer from '@/mocks/tenant/access-log'
import { lapsedGrants, markLapsesRecorded, personOf } from '@/mocks/tenant/profiles'
import { listRoles } from '@/mocks/tenant/roles'
import type { AccessEvent, AccessEventKind, AccessChange, AccessEntity } from '@/mocks/tenant/access-log'

export type { AccessEvent, AccessEventKind, AccessChange, AccessEntity }

/**
 * The name on an entry nobody made.
 *
 * Exported because the Activity view has to recognise it to draw the row
 * differently, and a string compared in two files is a string that drifts.
 */
export const AUTOMATIC_ACTOR = 'Automatic'

/**
 * Write a line for every grant that has quietly run out.
 *
 * A role given until a date stops working on that date and nothing announces
 * it. That is the point of an expiry — nobody has to remember — but it leaves
 * the log describing a school where the acting head of department is still
 * acting, and the first person to notice reads it as a bug rather than as the
 * thing they asked for six months ago.
 *
 * On a server this is a nightly job. Here it runs when the log is read, which
 * is the only moment the difference can be seen; the entry is still dated to
 * the day the role ended, so the sweep's timing never shows.
 *
 * Written first and ticked off after — see `lapsedGrants`.
 */
function sweepLapsedGrants(): void {
  const lapsed = lapsedGrants()
  if (lapsed.length === 0) return

  const roleNames = new Map(listRoles().map(role => [role.id, role.name]))

  lapsed.forEach(grant => {
    const who = personOf(grant.profileId).fullName
    // A grant belonging to a profile that no longer exists has nobody to name,
    // and a line about nobody is worse than no line. It is still ticked off
    // below, so the sweep does not reconsider it every time.
    if (!who) return

    // A role deleted since the grant was made still ended, and the entry has
    // to say so without a name to say it with — the sentence changes shape
    // rather than dropping a placeholder into the middle of the old one.
    const what = roleNames.get(grant.roleId)
    const granter = grant.assignedBy ? personOf(grant.assignedBy).fullName : undefined

    const detail = [
      what ? undefined : 'The role has since been deleted',
      granter ? `Granted by ${granter}` : undefined,
    ].filter(Boolean)

    mockServer.recordEvent({
      at: grant.expiresAt,
      actorName: AUTOMATIC_ACTOR,
      kind: 'role.lapse',
      target: who,
      summary: what ? `${who}'s ${what} role lapsed` : `A role ${who} held lapsed`,
      detail: detail.length > 0 ? detail.join(', ') : undefined,
    })
  })

  markLapsesRecorded(lapsed)
}

/**
 * The change history, newest first.
 *
 * @apiRoute GET /api/v1/access-log
 */
export async function fetchAccessEvents(limit = 100): Promise<AccessEvent[]> {
  return mockOrHttp(
    async () => {
      // Who changed whose access, and when. Gated on `users.read` because that
      // is the permission the screen showing it sits behind, and because a log
      // of administrative actions read by the people it records is a different
      // thing from a record. `callerMay` rather than `callerSeesEveryRow`: the
      // rows are about staff actions, not about a student, so there is nothing
      // for an axis to narrow.
      if (!callerMay('read', 'User')) return []
      // Stands in for the job that would have run overnight.
      sweepLapsedGrants()
      await withLatency({ min: 80, max: 200 })
      return mockServer.listEvents(limit)
    },
    async () => {
      const { data } = await apiClient.get<AccessEvent[]>('/access-log', { params: { limit } })
      return data
    },
  )
}

/**
 * Append one line to the log.
 *
 * @apiRoute POST /api/v1/access-log
 */
export async function recordAccessEvent(input: {
  actorName: string
  kind: AccessEventKind
  target: string
  summary: string
  detail?: string
  change?: AccessChange
  undoOf?: string
}): Promise<AccessEvent | null> {
  return mockOrHttp(
    async () => mockServer.recordEvent(input),
    async () => {
      const { actorName: _ignored, ...body } = input
      const { data } = await apiClient.post<AccessEvent>('/access-log', body)
      return data
    },
  )
}
