import * as React from 'react'
import { authUtils } from '@/api/utils/auth'
import type { AuthUser } from '@/features/auth/types'

/**
 * Current authenticated user's profile, read from the session captured at
 * sign-in. Returns null when no profile is stored (signed out, or a session
 * created before profiles were persisted).
 *
 * When the backend is ready this becomes the single swap point — replace the
 * localStorage read with a `/auth/me` fetch (or context) and every consumer
 * (greeting header, top-bar avatar, …) picks it up unchanged.
 */
export function useCurrentUser(): AuthUser | null {
  // localStorage only changes via auth flows, which remount the app shell —
  // a lazy one-time read per mount is enough.
  const [user] = React.useState<AuthUser | null>(() => authUtils.getUser())
  return user
}
