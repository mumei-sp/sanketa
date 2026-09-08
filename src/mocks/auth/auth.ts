import type { AuthResponse, LoginRequest, RegisterRequest } from '@/features/auth/types'
import { authUtils } from '@/api/utils/auth'
import { findByEmail, listUsers } from '@/mocks/users'
import { studentsOfParent } from '@/mocks/parents'

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

/**
 * Listed on the sign-in screen so each role can be tried.
 *
 * Only accounts that can actually be signed into. A provisioned student or
 * parent is `disabled` until the services filter by scope, and offering one as
 * a hint would be offering a login that refuses.
 */
export function mockAccountHints() {
  return listUsers()
    .filter(user => user.status === 'active')
    .map(user => ({
      email: user.email,
      name: user.fullName,
      role: user.roleId,
    }))
}

/**
 * The student records a session is narrowed to.
 *
 * Their own for a student; their children's for a parent or guardian, read
 * through the link table — which is the reason that table exists. Resolved
 * here, at sign-in, because that is where a backend resolves it: the client
 * receives the list already decided rather than looking it up and being
 * trusted to look it up honestly.
 */
function studentScopeFor(account: {
  profileType: string
  studentId?: string
  parentId?: string
}): string[] {
  if (account.profileType === 'student') return account.studentId ? [account.studentId] : []
  if (account.profileType === 'parent' || account.profileType === 'guardian') {
    return account.parentId ? studentsOfParent(account.parentId) : []
  }
  return []
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

  // Refused separately from bad credentials, and after them: telling someone
  // with the wrong password that the account is disabled would confirm the
  // address exists.
  if (account.status !== 'active') {
    throw {
      code: 'ACCOUNT_NOT_ACTIVE',
      message:
        account.status === 'invited'
          ? 'This account has not been activated yet.'
          : 'This account has been disabled.',
      status: 403,
    }
  }

  const response: AuthResponse = {
    token: `mock-jwt-token-${account.id}`,
    refreshToken: `mock-refresh-token-${account.id}`,
    // The session carries the role and both scopes, the way a token would —
    // so a change made in the People screen takes effect at next sign-in
    // rather than needing the client to look the user up.
    user: {
      id: account.id,
      fullName: account.fullName,
      email: account.email,
      role: account.roleId,
      profileType: account.profileType,
      assignedClasses: account.assignedClasses,
      studentIds: studentScopeFor(account),
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
      profileType: 'teacher',
    },
  }

  authUtils.setToken(response.token)
  authUtils.setUser(response.user)
  return response
}
