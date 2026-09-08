import type { UserProfile, ProfileType } from '@/types/user-profile'

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

// ============================================================================
// Student Detail Page Types
// ============================================================================

import type { CalendarHighlight } from '@/components/ui/mini-calendar'
import type { DocumentItem } from '@/components/ui/documents-list'

/** Attendance data for a specific month */
export interface StudentAttendanceMonth {
  highlights: CalendarHighlight[]
  summary: {
    present: number
    late: number
    absent: number
    sick: number
  }
}

/** Scholarship entry */
export interface StudentScholarship {
  id: string
  title: string
  category: string
  icon: 'globe' | 'award' | 'book-open' | 'graduation-cap' | 'heart' | 'star' | 'trophy' | 'music' | 'palette' | 'code'
}

/** Health/Medical record */
export interface StudentHealthRecord {
  id: string
  title: string
  description: string
  severity?: 'normal' | 'mild' | 'severe'
}

/** Extracurricular activity */
export interface StudentActivity {
  id: string
  club: string
  role: string
  icon: string
  achievements: string
  duration: string
  advisor: string
}

/** Behavior log entry */
export type BehaviorType = 'Positive Note' | 'Minor Issue'

export interface StudentBehaviorEntry {
  id: string
  date: string
  type: BehaviorType
  details: string
  reportedBy: string
  statusAction: string
}

/** Aggregate detail data for the student detail page */
export interface StudentDetailData {
  monthlyAttendance: Record<string, StudentAttendanceMonth>
  scholarships: StudentScholarship[]
  healthRecords: StudentHealthRecord[]
  extracurriculars: StudentActivity[]
  behaviorLog: StudentBehaviorEntry[]
  documents: DocumentItem[]
}

// Re-export types for convenience
export type { StudentFormValues } from '../schemas/student-schema'
export type { UserProfile, Gender, ProfileType } from '@/types/user-profile'

/**
 * One month of the academic-performance chart.
 *
 * The index signature is the point: grade keys are built from the school's
 * configured class sections, so the shape is `month` plus a `grade{N}` per
 * grade that exists, not a hardcoded 7/8/9 slice.
 */
export interface AcademicPerformanceEntry {
  month: string
  [gradeKey: `grade${string}`]: number | string
}
