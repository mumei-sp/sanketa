/**
 * Gender type matching database schema
 * 0=MALE, 1=FEMALE, 2=OTHER, 3=PREFER_NOT_TO_SAY
 */
export type Gender = 0 | 1 | 2 | 3

/**
 * The kinds of person a school recognises out of the box.
 *
 * This was a TINYINT column on `user_profiles` — one per row, so one per
 * person, and copied into every school by the replica. It is gone. What a
 * person is at a school is now the `profile_types` / `profile_profile_types`
 * pair in the tenant schema, which is plural and school-extensible; these six
 * are the built-in codes it seeds with, and a school may add its own.
 *
 * Names rather than the TINYINT it used to be: `2` was a puzzle at every call
 * site, and `'parent'` is not.
 */
export type ProfileTypeName =
  | 'student'
  | 'teacher'
  | 'parent'
  | 'admin'
  | 'staff'

/**
 * Base UserProfile interface matching user_profiles table schema
 * This is the base type that can be extended for specific profile types (Student, Teacher, etc.)
 *
 * These are exactly the columns the tenant replica carries. Anything that is
 * true of a person *at a school* — what they are, which classes they take —
 * belongs in a table beside this one, not on the row.
 */
export interface UserProfile {
  /** Primary key - references GlobalDB.user_profiles.id (BIGINT) */
  id: string | number

  /** User ID - references GlobalDB.users.id (BIGINT) */
  userId: string | number

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
