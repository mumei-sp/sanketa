import type { UserProfile, Gender, ProfileType } from '@/types/user-profile'
import type { StudentFormValues } from '../schemas/student-schema'

/**
 * Student performance levels
 */
export type StudentPerformance = 'Good' | 'Needs Support' | 'At Risk'

/**
 * Student status options
 */
export type StudentStatus = 'Active' | 'On Leave'

/**
 * Guardian information structure
 */
export interface GuardianInfo {
  name?: string
  phoneCountryCode?: string
  phone?: string
  relation?: string
}

/**
 * Guardians information structure
 */
export interface GuardiansInfo {
  father?: GuardianInfo
  mother?: GuardianInfo
  alternativeGuardian?: GuardianInfo
}

/**
 * Student interface based on UserProfile
 * Matches database schema structure from user_profiles and students tables
 * 
 * Note: Some UserProfile fields (userId, profileType) are optional for backward compatibility
 * with existing code that doesn't include these fields yet.
 */
export interface Student extends Omit<UserProfile, 'userId' | 'profileType'> {
  /** User ID - optional for backward compatibility */
  userId?: string | number
  /** Profile type - optional for backward compatibility, defaults to 0 (STUDENT) */
  profileType?: ProfileType

  /** Student-specific identification */
  studentId: string

  /** Phone country code (e.g., "+91", "+39") - not in base UserProfile */
  phoneCountryCode?: string

  /** Address - not in base UserProfile */
  address?: string

  /** Academic Information (from students table) */
  admissionNumber?: string
  admissionDate?: string
  rollNumber?: string
  gradeLevel?: string
  section?: string
  /** JSON field for additional student info (hobbies, medical info, etc.) */
  studentInfo?: Record<string, unknown>

  /** Academic metrics (for table display) */
  gpa: number
  performance: StudentPerformance
  percentage: number
  status: StudentStatus

  /** Guardian Information */
  guardians?: GuardiansInfo

  /** Legacy/compatibility fields for backward compatibility */
  name?: string
  class?: string
  avatarUrl?: string
}

// Re-export types for convenience
export type { StudentFormValues } from '../schemas/student-schema'
export type { UserProfile, Gender, ProfileType } from '@/types/user-profile'
export type {
  BehaviorDisciplineRecord,
  BehaviorRecordType,
  BehaviorStatus,
} from './behavior-discipline'
