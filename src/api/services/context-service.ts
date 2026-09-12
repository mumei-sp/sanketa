/**
 * Profile Contexts API Service
 *
 * Where a person can go and as whom — the read behind the chooser that stands
 * between signing in and the app.
 *
 * ── Why this is one endpoint and not a loop in the client ──────────────
 * Roles live in each school's schema, so answering it means reading N schemas.
 * A client that did that itself would have to know how to switch tenants,
 * which is exactly the thing the tenant context exists to take away from it —
 * and on a real backend it would be N round trips before the app could draw
 * anything. `GET /api/v1/me/contexts` is the server doing the fan-out once and
 * answering with what it found. The mock does the same, in one function, in
 * `mocks/global/contexts.ts`.
 *
 * Switching side is *not* here. It is a client choice remembered in the
 * browser, checked against this answer, the same way the active school is a
 * client choice checked against the token's claim — see `active-context.ts`.
 */

import apiClient from '@/api/client'
import { mockOrHttp } from './_adapter'
import { withLatency } from '@/mocks/_shared'
import { listUserContexts } from '@/mocks/global'
import type { TenantContexts } from '@/mocks/global'
import { authUtils } from '@/api/utils/auth'

/**
 * Every school this login can reach, and the ways into each.
 *
 * A school with an empty `sides` is one the person is enrolled at and has no
 * role in yet. It is returned rather than filtered out, because "you are here
 * but nobody has said what you do" is a state a person needs told, and an app
 * that silently omitted the school would look like it had lost it.
 *
 * @apiRoute GET /api/v1/me/contexts
 */
export async function fetchContexts(): Promise<TenantContexts[]> {
  return mockOrHttp(
    async () => {
      // Short: this runs between the sign-in call and the first paint, and a
      // person who has just waited for one request should not visibly wait for
      // a second.
      await withLatency({ min: 80, max: 200 })
      return listUserContexts(authUtils.getUser()?.id)
    },
    async () => {
      const { data } = await apiClient.get<TenantContexts[]>('/me/contexts')
      return data
    },
    // The caller is identified by the session, and the answer spans every
    // school — so there is no single active tenant for the filter to check,
    // and demanding one would make the fan-out depend on the choice it exists
    // to inform.
    { anonymous: true },
  )
}
