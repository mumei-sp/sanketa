import type { AuthResponse, LoginRequest, RegisterRequest } from '@/features/auth/types'
import { authUtils } from '@/api/utils/auth'

const MOCK_DELAY = 1200

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * One account per built-in role, all with the password `admin`.
 *
 * A single admin login left every role unreachable without editing code, which
 * meant permission rules could only be reasoned about rather than used. Signing
 * in as the person is also how a real deployment is exercised, so nothing here
 * is scaffolding that has to come out later.
 *
 * `role` holds a role *id* from the roles table, not a display name — the name
 * is the school's to change.
 */
const MOCK_PASSWORD = 'admin'

const MOCK_ACCOUNTS: AuthResponse[] = [
  {
    token: 'mock-jwt-token-sanketa-2026',
    refreshToken: 'mock-refresh-token-sanketa-2026',
    user: { id: '1', fullName: 'Surya Admin', email: 'admin@sanketa.edu', role: 'admin' },
  },
  {
    token: 'mock-jwt-token-sanketa-principal',
    refreshToken: 'mock-refresh-token-sanketa-principal',
    user: { id: '2', fullName: 'Nandini Rao', email: 'principal@sanketa.edu', role: 'principal' },
  },
  {
    token: 'mock-jwt-token-sanketa-teacher',
    refreshToken: 'mock-refresh-token-sanketa-teacher',
    // Matches teacher T-1006 in the roster. A backend would read the teacher
    // record and stamp these into the token; the mock does the same by hand.
    user: {
      id: '3',
      fullName: 'Meera Iyengar',
      email: 'teacher@sanketa.edu',
      role: 'teacher',
      assignedClasses: ['8A', '8B'],
    },
  },
  {
    token: 'mock-jwt-token-sanketa-accountant',
    refreshToken: 'mock-refresh-token-sanketa-accountant',
    user: { id: '4', fullName: 'Vikram Shah', email: 'accountant@sanketa.edu', role: 'accountant' },
  },
]

/** The accounts, for the sign-in screen's hint. */
export const MOCK_ACCOUNT_HINTS = MOCK_ACCOUNTS.map(account => ({
  email: account.user.email,
  name: account.user.fullName,
  role: account.user.role,
}))

export async function mockLogin(data: LoginRequest): Promise<AuthResponse> {
  await delay(MOCK_DELAY)

  const identifier = data.identifier.trim().toLowerCase()
  const account = MOCK_ACCOUNTS.find(candidate => candidate.user.email.toLowerCase() === identifier)

  if (!account || data.password !== MOCK_PASSWORD) {
    throw {
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid credentials. Please try again.',
      status: 401,
    }
  }

  authUtils.setToken(account.token)
  authUtils.setUser(account.user)
  return account
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
