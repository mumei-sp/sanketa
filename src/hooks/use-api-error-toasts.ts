/**
 * Says out loud that a request failed.
 *
 * ── Why this exists ────────────────────────────────────────────────────
 * `errorEmitter` has been wired since the API layer was written: `client.ts`
 * hands every `ApiError` to it and `api/index.ts` re-exports it. Nothing ever
 * subscribed. So the emitter ran into an empty room, and the ~80 call sites
 * that `catch (error) { console.error(...) }` were the whole story a user got
 * — which is to say a page that stays empty, looking exactly like a page with
 * nothing in it.
 *
 * That costs nothing today: `mockOrHttp` takes the mock path, so axios is
 * never reached and nothing is emitted. It starts costing the day
 * `VITE_USE_MOCK_API` is turned off, which is precisely the day nobody will be
 * watching the console. Ten lines now is cheaper than the bug report later.
 *
 * ── What it does NOT do ────────────────────────────────────────────────
 * It does not replace a page's own error handling. A form that fails to save
 * should say so where the form is; this is the backstop for everything that
 * currently says nothing at all, and it is deliberately quiet:
 *
 *   401 never arrives. The interceptor signs the session out and returns
 *   before `onError`, so an expired token is a redirect, not a toast.
 *
 *   Repeats collapse. The id is the error's own `code`, so six panels failing
 *   one network outage produce one toast rather than six — and a retried
 *   request that fails the same way twice replaces its toast instead of
 *   stacking a second.
 *
 * ── The one thing worth knowing ────────────────────────────────────────
 * `client.ts` calls `onError` BEFORE it decides whether to retry, so a blip
 * that the retry then recovers from has already been announced. Moving the
 * emit after the retry would fix that, and would also change what any future
 * subscriber (logging, metrics) is told — a bigger decision than this hook,
 * and not one to make on its behalf. The dedupe above keeps it to a single
 * toast in the meantime.
 */

import * as React from 'react'
import { errorEmitter } from '@/api/utils/error-emitter'
import type { ApiError } from '@/api/types'
import { useAppToast } from './use-app-toast'

/** What to say when the server did not say anything useful itself. */
function messageFor(error: ApiError): string {
  if (error.message) return error.message
  if (error.status === 0) return 'Could not reach the server'
  if (error.status === 403) return 'You do not have access to that'
  if (error.status === 404) return 'That could not be found'
  if (error.status >= 500) return 'The server had a problem'
  return 'Something went wrong'
}

export function useApiErrorToasts(): void {
  const { showError } = useAppToast()

  React.useEffect(
    () =>
      errorEmitter.onError(error => {
        showError(messageFor(error), { id: `api-error:${error.code}` })
      }),
    [showError],
  )
}
