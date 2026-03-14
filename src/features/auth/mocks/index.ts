import type { AuthResponse, LoginRequest, RegisterRequest } from '../types'
import { authUtils } from '@/api/utils/auth'

const MOCK_DELAY = 1200

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/** Default mock credentials: admin@sanketa.edu / admin */
const MOCK_IDENTIFIER = 'admin@sanketa.edu'
const MOCK_PASSWORD = 'admin'

const mockUser: AuthResponse = {
  token: 'mock-jwt-token-sanketa-2026',
  refreshToken: 'mock-refresh-token-sanketa-2026',
  user: {
    id: '1',
    fullName: 'Surya Admin',
    email: 'admin@sanketa.edu',
    role: 'Admin',
  },
}

export async function mockLogin(data: LoginRequest): Promise<AuthResponse> {
  await delay(MOCK_DELAY)

  if (data.identifier !== MOCK_IDENTIFIER || data.password !== MOCK_PASSWORD) {
    throw {
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid credentials. Please try again.',
      status: 401,
    }
  }

  authUtils.setToken(mockUser.token)
  return mockUser
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

  const response: AuthResponse = {
    ...mockUser,
    user: {
      ...mockUser.user,
      id: crypto.randomUUID(),
      fullName: data.fullName,
      email: data.email,
    },
  }

  authUtils.setToken(response.token)
  return response
}
