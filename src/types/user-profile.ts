/**
 * Gender type matching database schema
 * 0=MALE, 1=FEMALE, 2=OTHER, 3=PREFER_NOT_TO_SAY
 */
export type Gender = 0 | 1 | 2 | 3

/**
 * Profile type matching database schema
 * 0=STUDENT, 1=TEACHER, 2=PARENT, 3=ADMIN, 4=STAFF, 5=GUARDIAN
 */
export type ProfileType = 0 | 1 | 2 | 3 | 4 | 5

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
