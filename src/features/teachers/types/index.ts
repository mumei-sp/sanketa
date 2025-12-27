import type { UserProfile, ProfileType } from '@/types/user-profile'

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

  /** Email address */
  email: string

  /** Legacy/compatibility fields for backward compatibility */
  name?: string
  avatarUrl?: string
}

// Re-export types for convenience
export type { UserProfile, ProfileType } from '@/types/user-profile'

