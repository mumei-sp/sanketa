import { ProfileCard } from '@/components/ui/profile-card'
import type { TeacherDetail } from '../types/teacher-detail'
import { getDisplayName } from '../utils/formatting'

interface TeacherProfileCardProps {
  teacher: TeacherDetail
}

/**
 * TeacherProfileCard - Thin wrapper around the shared ProfileCard
 * with teacher-specific badges and detail rows.
 */
export function TeacherProfileCard({ teacher }: TeacherProfileCardProps) {
  const displayName = getDisplayName(teacher)
  const profilePictureUrl = teacher.profilePictureUrl || teacher.avatarUrl
  const classLabel = teacher.classAssignments?.join(', ') || 'N/A'

  return (
    <ProfileCard
      name={displayName}
      avatarUrl={profilePictureUrl}
      gender={teacher.gender}
      badges={[
        { label: teacher.teacherId, variant: 'muted' },
        { label: teacher.employmentType, variant: 'primary' },
      ]}
      details={[
        { label: 'Subject', value: teacher.subject },
        { label: 'Class', value: classLabel },
      ]}
    />
  )
}
