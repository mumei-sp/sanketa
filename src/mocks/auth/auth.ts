import type { AuthResponse, LoginRequest, RegisterRequest } from '@/features/auth/types'
import { authUtils } from '@/api/utils/auth'
import { issueSession, revokeSession, rotateSession } from './sessions'
import { findByIdentifier, listUsers } from '@/mocks/users'
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
      // Whichever the account can actually be signed in with. A hint that
      // shows a blank where the address would be is worse than one that shows
      // the number the person would have typed anyway.
      email: user.email ?? user.phone ?? '',
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

  const account = findByIdentifier(data.identifier)

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

  const tokens = issueSession(account.id)
  const response: AuthResponse = {
    ...tokens,
    // The session carries the role and both scopes, the way a token would —
    // so a change made in the People screen takes effect at next sign-in
    // rather than needing the client to look the user up.
    user: {
      id: account.id,
      fullName: account.fullName,
      email: account.email,
      phone: account.phone,
      role: account.roleId,
      profileType: account.profileType,
      assignedClasses: account.assignedClasses,
      studentIds: studentScopeFor(account),
    },
  }

  authUtils.setToken(response.token)
  authUtils.setRefreshToken(response.refreshToken)
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
  const id = crypto.randomUUID()
  const response: AuthResponse = {
    ...issueSession(id),
    user: {
      id,
      fullName: data.fullName,
      email: data.email,
      role: 'teacher',
      profileType: 'teacher',
    },
  }

  authUtils.setToken(response.token)
  authUtils.setRefreshToken(response.refreshToken)
  authUtils.setUser(response.user)
  return response
}

/**
 * Redeem a refresh token for a new pair.
 *
 * Throws the same 401 a server would for a token it will not honour, because
 * the interceptor decides what to do by status: a 401 here means the session
 * is over and the person signs in again.
 */
export async function mockRefresh(refreshToken: string): Promise<AuthResponse> {
  await delay(MOCK_DELAY)

  const rotated = rotateSession(refreshToken)
  if (!rotated) {
    throw {
      code: 'INVALID_REFRESH_TOKEN',
      message: 'Your session has expired. Please sign in again.',
      status: 401,
    }
  }

  // Re-read the account rather than trusting the stored profile: a refresh is
  // the natural moment for a role change made in the People screen to take
  // effect, and it is what a server would do anyway.
  const account = listUsers().find(user => user.id === rotated.userId)
  const stored = authUtils.getUser()
  const user = account
    ? {
        id: account.id,
        fullName: account.fullName,
        email: account.email,
        role: account.roleId,
        profileType: account.profileType,
        assignedClasses: account.assignedClasses,
        studentIds: studentScopeFor(account),
      }
    : stored

  if (!user) {
    throw {
      code: 'ACCOUNT_NOT_FOUND',
      message: 'Your session has expired. Please sign in again.',
      status: 401,
    }
  }

  const response: AuthResponse = { ...rotated, user }
  authUtils.setToken(response.token)
  authUtils.setRefreshToken(response.refreshToken)
  authUtils.setUser(response.user)
  return response
}

/**
 * Sign out on the server too, so the refresh token stops being redeemable.
 *
 * Takes the token rather than reading it back from storage: the caller clears
 * local state first so navigation is safe, which means by the time this runs
 * there is nothing left to read.
 */
export function mockLogout(refreshToken: string | null): void {
  if (refreshToken) revokeSession(refreshToken)
}
