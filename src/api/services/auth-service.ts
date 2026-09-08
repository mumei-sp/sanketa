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
import { mockOrHttp } from './_adapter'
import { mockLogin, mockRegister } from '@/mocks/auth'
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
