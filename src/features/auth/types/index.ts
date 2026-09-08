export interface LoginRequest {
  /** Email address or phone number */
  identifier: string
  password: string
  rememberMe?: boolean
}

export interface RegisterRequest {
  fullName: string
  email: string
  phoneCountryCode: string
  phoneNumber: string
  password: string
}

export interface AuthResponse {
  token: string
  refreshToken: string
  user: AuthUser
}

export interface AuthUser {
  id: string
  fullName: string
  email: string
  /** Role id from the roles table, not a display name. */
  role: string
  avatarUrl?: string
  /**
   * Class sections this user may write to, when their role is scoped.
   *
   * Carried on the session because that is where a backend would put it — the
   * server reads the teacher record and stamps the list into the token, so the
   * client never has to look up who it is before knowing what it may edit.
   * Ignored entirely for roles that are not scoped.
   */
  assignedClasses?: string[]
}
