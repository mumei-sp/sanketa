/**
 * Auth API Service
 *
 * Mock path (the in-browser auth mock) + HTTP path (apiClient).
 *
 * The sign-in and register forms used to import `mockLogin` and `mockRegister`
 * directly, which made auth the one flow `VITE_USE_MOCK_API` could not switch:
 * turn the flag off, point the app at a real backend, and it would still
 * authenticate against a hard-coded password in the browser. Every other
 * feature reads through a service for exactly this reason.
 */

import apiClient from '@/api/client'
import { authUtils } from '@/api/utils/auth'
import { mockOrHttp } from './_adapter'
import { mockLogin, mockLogout, mockRefresh, mockRegister } from '@/mocks/auth'
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
} from '@/features/auth/types'

/**
 * Exchange credentials for a session.
 *
 * No `withLatency` wrapper: the auth mock owns its own delay, and a sign-in
 * that took two artificial pauses would feel like a slow server rather than a
 * simulated one.
 *
 * @apiRoute POST /api/v1/auth/login
 */
export async function login(data: LoginRequest): Promise<AuthResponse> {
  return mockOrHttp(
    async () => mockLogin(data),
    async () => {
      const { data: response } = await apiClient.post<AuthResponse>('/auth/login', data)
      return response
    },
  )
}

/**
 * @apiRoute POST /api/v1/auth/register
 */
export async function register(data: RegisterRequest): Promise<AuthResponse> {
  return mockOrHttp(
    async () => mockRegister(data),
    async () => {
      const { data: response } = await apiClient.post<AuthResponse>('/auth/register', data)
      return response
    },
  )
}

/**
 * Trade the stored refresh token for a new pair.
 *
 * Called by the client's 401 interceptor, not by a screen — which is why it
 * reads the token from storage rather than taking it as an argument: there is
 * exactly one session per tab, and letting a caller pass some other token in
 * would invite refreshing a session you are not in.
 *
 * Rejects when there is nothing to redeem, so the interceptor can treat "no
 * refresh token" and "refresh refused" the same way: sign in again.
 *
 * @apiRoute POST /api/v1/auth/refresh
 */
export async function refreshSession(): Promise<AuthResponse> {
  const refreshToken = authUtils.getRefreshToken()
  if (!refreshToken) {
    throw { code: 'NO_REFRESH_TOKEN', message: 'No session to refresh.', status: 401 }
  }

  return mockOrHttp(
    async () => mockRefresh(refreshToken),
    async () => {
      // `SKIP_AUTH_REFRESH` keeps the interceptor from trying to refresh the
      // refresh call itself, which is how this becomes an infinite loop.
      const { data } = await apiClient.post<AuthResponse>(
        '/auth/refresh',
        { refreshToken },
        { headers: { 'X-Skip-Auth-Refresh': 'true' } },
      )
      authUtils.setToken(data.token)
      authUtils.setRefreshToken(data.refreshToken)
      authUtils.setUser(data.user)
      return data
    },
  )
}

/**
 * End the session on the server as well as locally.
 *
 * Clearing localStorage alone leaves a refresh token that still works — which
 * matters on a shared machine, where "log out" has to mean the credential
 * stops being redeemable rather than merely being forgotten.
 *
 * @apiRoute POST /api/v1/auth/logout
 */
export async function logout(): Promise<void> {
  const refreshToken = authUtils.getRefreshToken()

  // Cleared before the first `await`, which means synchronously from the
  // caller's point of view. Callers sign out and navigate in the same tick,
  // and `GuestGuard` reads the token during that render — clearing it in a
  // `finally` let the guard still see a session and bounce the person back to
  // the dashboard they had just asked to leave.
  authUtils.removeToken()

  try {
    await mockOrHttp(
      async () => {
        mockLogout(refreshToken)
      },
      async () => {
        await apiClient.post('/auth/logout', { refreshToken })
      },
    )
  } catch (error) {
    // The session is already over locally; a failed revoke is worth knowing
    // about but must not strand someone on a page they meant to leave.
    console.error('Failed to revoke the session server-side', error)
  }
}
