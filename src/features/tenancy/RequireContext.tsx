/**
 * Hold the app until a person with more than one way in has picked one.
 *
 * The counterpart of `RequirePermission`, one step earlier: that decides
 * whether you may open a screen, this decides *as whom* you are opening any of
 * them. It has to run before the shell rather than inside it, because the
 * sidebar, the dashboard and every service call are already answers to the
 * question it asks.
 *
 * Renders nothing while the fan-out is in flight. A redirect decided on an
 * empty list would send somebody to the chooser and immediately back, and a
 * dashboard drawn on a guessed side would be a screenful of the wrong person's
 * data — briefly, which is the kind of wrong that gets screenshotted.
 */

import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { RouteFallback } from '@/components/layout/RouteFallback'
import { useContexts } from './ContextsProvider'

/** Where the choice is made. Exported so nothing else spells it by hand. */
export const CHOOSE_PROFILE_PATH = '/choose-profile'

export function RequireContext() {
  const { needsChoice, isReady } = useContexts()
  const location = useLocation()

  if (!isReady) return <RouteFallback />

  if (needsChoice) {
    // `replace`, so the back button does not walk into a shell that will only
    // bounce here again. No `state` carrying the attempted path: switching
    // context reloads the app onto the dashboard on purpose — a page a teacher
    // was looking at is rarely one her parent side should resume.
    return <Navigate to={CHOOSE_PROFILE_PATH} replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}

/**
 * The mirror: keep the chooser to people who have something to choose.
 *
 * Somebody with one way in who types the URL is sent to the app rather than
 * shown a screen with a single tile, which is a question with one answer.
 */
export function RedirectIfSingleContext() {
  const { all, isReady } = useContexts()

  if (!isReady) return <RouteFallback />
  if (all.length <= 1) return <Navigate to="/" replace />

  return <Outlet />
}
