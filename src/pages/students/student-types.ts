/**
 * Re-export student types from features for convenience
 * This maintains backward compatibility while using the centralized type definitions
 */
export type {
  Student,
  StudentPerformance,
  StudentStatus,
  GuardianInfo,
  GuardiansInfo,
  StudentFormValues,
  UserProfile,
  Gender,
} from '@/features/students/types'
