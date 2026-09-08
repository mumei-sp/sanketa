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

/**
 * What kind of thing an account belongs to.
 *
 * Not a role. A role is the school's data and can be renamed, invented or
 * deleted; the profile type is structural — it says which record the account
 * points at, and therefore which way its access narrows. A school can decide
 * what a Parent may see; it cannot decide that a parent is a member of staff.
 *
 * The values and their order come from the backend's `profile_type_enum`
 * (`0=STUDENT, 1=TEACHER, 2=PARENT, 3=ADMIN, 4=STAFF, 5=GUARDIAN`), so the
 * mock and the schema describe the same column. `guardian` is distinct from
 * `parent` there — a legal guardian who is not a parent — and both narrow the
 * same way.
 */
export type ProfileType = 'student' | 'teacher' | 'parent' | 'admin' | 'staff' | 'guardian'

/** Whether an account can be signed into. */
export type AccountStatus = 'invited' | 'active' | 'disabled'

export interface AuthUser {
  id: string
  fullName: string
  email: string
  /** Structural kind of account — see `ProfileType`. */
  profileType: ProfileType
  /**
   * The student records this session is narrowed to.
   *
   * Their own, for a student; their children's, for a parent or guardian.
   * Empty for staff, who narrow by class instead. Carried on the session the
   * way `assignedClasses` is, because a backend resolves it once at sign-in
   * and stamps it into the token rather than making the client look it up.
   */
  studentIds?: string[]
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
