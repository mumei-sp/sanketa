/**
 * Gender type matching database schema
 * 0=MALE, 1=FEMALE, 2=OTHER, 3=PREFER_NOT_TO_SAY
 */
export type Gender = 0 | 1 | 2 | 3

/**
 * Profile type matching database schema
 * 0=STUDENT, 1=TEACHER, 2=PARENT, 3=ADMIN, 4=STAFF, 5=GUARDIAN
 */
export type ProfileTypeCode = 0 | 1 | 2 | 3 | 4 | 5

/**
 * The same thing, spelled out.
 *
 * The database stores a TINYINT, and a profile row read off the wire carries
 * the code. Everywhere a person reads or writes one — an account row, a filter
 * on the People screen, a comparison in a permission check — the name is what
 * belongs in the source, because `profileType === 2` is a puzzle and
 * `profileType === 'parent'` is not.
 *
 * Two encodings of one column, so the pair is declared together with the map
 * between them rather than left for each caller to hardcode.
 */
export type ProfileTypeName =
  | 'student'
  | 'teacher'
  | 'parent'
  | 'admin'
  | 'staff'
  | 'guardian'

/** Wire code to name. Index is the code, by construction. */
export const PROFILE_TYPE_NAMES: readonly ProfileTypeName[] = [
  'student',
  'teacher',
  'parent',
  'admin',
  'staff',
  'guardian',
]

export function profileTypeName(code: ProfileTypeCode): ProfileTypeName {
  return PROFILE_TYPE_NAMES[code]
}

export function profileTypeCode(name: ProfileTypeName): ProfileTypeCode {
  return PROFILE_TYPE_NAMES.indexOf(name) as ProfileTypeCode
}

/**
 * @deprecated The numeric encoding is now `ProfileTypeCode`; use that where a
 * wire value is meant and `ProfileTypeName` where a person reads it.
 */
export type ProfileType = ProfileTypeCode

/**
 * Base UserProfile interface matching user_profiles table schema
 * This is the base type that can be extended for specific profile types (Student, Teacher, etc.)
 */
export interface UserProfile {
  /** Primary key - references GlobalDB.user_profiles.id (BIGINT) */
  id: string | number

  /** User ID - references GlobalDB.users.id (BIGINT) */
  userId: string | number

  /** Profile type - 0=STUDENT, 1=TEACHER, 2=PARENT, 3=ADMIN, 4=STAFF, 5=GUARDIAN */
  profileType: ProfileType

  /** Personal Information */
  /** Given name (nullable for Indian naming style) */
  firstName?: string
  middleName?: string
  /** Family name (nullable for Indian naming style) */
  lastName?: string
  /** Complete full name (nullable - can be derived from first_name/middle_name/last_name if not provided) */
  fullName?: string
  preferredName?: string
  displayName?: string

  /** Date of birth in YYYY-MM-DD format */
  dateOfBirth?: string

  /** Gender - 0=MALE, 1=FEMALE, 2=OTHER, 3=PREFER_NOT_TO_SAY */
  gender?: Gender

  /** Contact Information */
  primaryPhone?: string
  /** Dialling code paired with `primaryPhone`, e.g. '+91'. */
  phoneCountryCode?: string
  profilePictureUrl?: string

  /** Sync metadata */
  /** Last sync timestamp from Global DB */
  syncedAt?: string
  /** Version number for conflict resolution */
  syncVersion?: number
}
