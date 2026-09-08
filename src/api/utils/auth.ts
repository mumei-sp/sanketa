import type { AuthUser } from '@/features/auth/types'

const TOKEN_KEY = 'authToken'
const REFRESH_TOKEN_KEY = 'refreshToken'
const USER_KEY = 'authUser'

export const authUtils = {
  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY)
  },

  setToken: (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token)
  },

  /**
   * The credential that buys a new access token.
   *
   * `removeToken` has cleared this key since the beginning and nothing ever
   * wrote it, so the refresh token the auth response has always carried was
   * dropped on the floor. It is stored now, which is what makes the 401
   * interceptor able to do anything.
   */
  getRefreshToken: (): string | null => {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  },

  setRefreshToken: (token: string): void => {
    localStorage.setItem(REFRESH_TOKEN_KEY, token)
  },

  /**
   * The authenticated user's profile, captured from the auth response at
   * sign-in. Reads fall back to null when absent or unparsable — callers must
   * handle a missing profile (e.g. sessions created before this was stored).
   */
  getUser: (): AuthUser | null => {
    try {
      const raw = localStorage.getItem(USER_KEY)
      return raw ? (JSON.parse(raw) as AuthUser) : null
    } catch {
      return null
    }
  },

  setUser: (user: AuthUser): void => {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  },

  removeToken: (): void => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem(TOKEN_KEY)
  },
}
