import type { UserProfile, ProfileType } from '@/types/user-profile'
import type { EmploymentType } from './teacher-detail'

/**
 * Teacher interface based on UserProfile
 * Matches database schema structure from user_profiles and teachers tables
 * 
 * Note: Some UserProfile fields (userId, profileType) are optional for backward compatibility
 * with existing code that doesn't include these fields yet.
 */
export interface Teacher extends Omit<UserProfile, 'userId' | 'profileType'> {
  /** User ID - optional for backward compatibility */
  userId?: string | number
  /** Profile type - optional for backward compatibility, defaults to 1 (TEACHER) */
  profileType?: ProfileType

  /** Teacher-specific identification */
  teacherId: string

  /** Subject or specialization taught by the teacher */
  subject: string

  /**
   * How they are employed.
   *
   * On the row because the teachers dashboard counts them — it used to show
   * 62 full-time, 18 part-time and 6 substitute over a faculty list of
   * eighteen, three numbers that could not be reconciled with anything. A
   * count has to be a count of rows, so the rows have to say.
   *
   * The same `EmploymentType` the detail record already used, rather than a
   * second spelling of the same three values. Declaring `'full-time'` here
   * beside the detail record's `'Full-Time'` made `TeacherDetail extends
   * Teacher` an error and left two encodings for callers to reconcile.
   */
  employmentType?: EmploymentType

  /**
   * Class sections this teacher may add to and amend — registers, marks and
   * student records.
   *
   * Stated rather than derived from the timetable: a schedule says where
   * someone teaches this term, which is usually but not always who should be
   * allowed to change a register, and authorisation that shifts silently when
   * a timetable is edited surprises people at the worst moment. Empty or
   * absent means they can read everything and write nothing.
   */
  assignedClasses?: string[]

  /** Email address */
  email: string

  /** Legacy/compatibility fields for backward compatibility */
  name?: string
  avatarUrl?: string
}

// Re-export types for convenience
export type { UserProfile, ProfileType } from '@/types/user-profile'

/**
 * Aggregate counts for the teachers dashboard.
 *
 * Here rather than beside the fixture that happens to supply it today. A type
 * describes the shape the app agrees on; the mock is one producer of that
 * shape and the backend will be another, so components importing it from
 * `@/mocks/` had the dependency pointing the wrong way.
 */
export interface TeacherStatistics {
  total: number
  fullTime: number
  partTime: number
  substitute: number
}

/** One slice of the department-distribution chart. */
export interface DepartmentData {
  name: string
  count: number
  percentage: number
}

/** One teacher's load within a subject, for the workload chart. */
export interface TeacherWorkloadData {
  teacherName: string
  totalClasses: number
  teachingHours: number
  extraDuties: number
}
