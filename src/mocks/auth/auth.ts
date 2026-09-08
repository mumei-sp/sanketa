import type { AuthResponse, LoginRequest, RegisterRequest } from '@/features/auth/types'
import { authUtils } from '@/api/utils/auth'
import { findByEmail, listUsers } from '@/mocks/users'

const MOCK_DELAY = 1200

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Sign-in reads the user directory.
 *
 * The four accounts used to be hard-coded here, which meant a role assigned in
 * the People screen could never reach a session — the login would keep handing
 * back whatever was baked into this file. Reading the directory makes the two
 * agree, and is what a real backend does anyway.
 *
 * Every account uses the password `admin`.
 */
const MOCK_PASSWORD = 'admin'

/** Listed on the sign-in screen so each role can be tried. */
export function mockAccountHints() {
  return listUsers().map(user => ({
    email: user.email,
    name: user.fullName,
    role: user.roleId,
  }))
}

export async function mockLogin(data: LoginRequest): Promise<AuthResponse> {
  await delay(MOCK_DELAY)

  const account = findByEmail(data.identifier)

  if (!account || data.password !== MOCK_PASSWORD) {
    throw {
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid credentials. Please try again.',
      status: 401,
    }
  }

  const response: AuthResponse = {
    token: `mock-jwt-token-${account.id}`,
    refreshToken: `mock-refresh-token-${account.id}`,
    // The session carries the role and the class assignment, the way a token
    // would — so a change made in the People screen takes effect at next
    // sign-in rather than needing the client to look the user up.
    user: {
      id: account.id,
      fullName: account.fullName,
      email: account.email,
      role: account.roleId,
      assignedClasses: account.assignedClasses,
    },
  }

  authUtils.setToken(response.token)
  authUtils.setUser(response.user)
  return response
}

export async function mockRegister(data: RegisterRequest): Promise<AuthResponse> {
  await delay(MOCK_DELAY)

  // Simulate email already taken
  if (data.email === 'admin@sanketa.edu') {
    throw {
      code: 'EMAIL_EXISTS',
      message: 'An account with this email already exists.',
      status: 409,
    }
  }

  // Self-registration lands on the least-privileged built-in role. Handing a
  // new sign-up the admin account's permissions, as this used to by cloning
  // it, is the kind of default that only shows up once it matters.
  const response: AuthResponse = {
    token: `mock-jwt-token-${crypto.randomUUID()}`,
    refreshToken: `mock-refresh-token-${crypto.randomUUID()}`,
    user: {
      id: crypto.randomUUID(),
      fullName: data.fullName,
      email: data.email,
      role: 'teacher',
    },
  }

  authUtils.setToken(response.token)
  authUtils.setUser(response.user)
  return response
}
