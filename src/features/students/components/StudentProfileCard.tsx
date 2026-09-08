import { Tile } from '@/components/tile'
import { ProfileCard } from '@/components/ui/profile-card'
import { InfoRow } from '@/components/ui/info-row'
import { StatusBadge } from './StatusBadge'
import { Cake, Phone, MapPin } from 'lucide-react'
import { fontSizes } from '@/config/typography'
import { spacing } from '@/config/spacing'
import type { Student } from '../types'
import {
  getDisplayName,
  getGenderLabel,
  getGenderIcon,
  formatDate,
  formatPhone,
  getClassLabel,
} from '../utils/formatting'

interface StudentProfileCardProps {
  student: Student
}

/**
 * StudentProfileCard component
 * Uses shared ProfileCard for avatar/name/badges, with student-specific
 * personal info and guardian sections as children.
 */
export function StudentProfileCard({ student }: StudentProfileCardProps) {
  const displayName = getDisplayName(student)
  const profilePictureUrl = student.profilePictureUrl || student.avatarUrl
  const classLabel = getClassLabel(student.gradeLevel, student.section) || student.class || 'N/A'

  return (
    <ProfileCard
      name={displayName}
      avatarUrl={profilePictureUrl}
      avatarSize="8rem"
      gender={student.gender}
      wrapped
      badges={[
        { label: student.studentId, variant: 'muted' },
        { label: classLabel, variant: 'muted' },
      ]}
    >
      {/* Status badge — rendered separately since it uses a custom component */}
      <div className="flex justify-center" style={{ marginTop: `-${spacing['2']}` }}>
        <StatusBadge
          status={student.status}
          className="font-medium"
          style={{
            height: spacing['7'],
            paddingLeft: spacing['3'],
            paddingRight: spacing['3'],
            fontSize: fontSizes.xs,
          }}
        />
      </div>

      {/* Personal Information Section */}
      <Tile
        id="personal-info-section"
        layoutMode="block"
        background="muted"
        borderRadius={spacing['3']}
        style={{ padding: spacing['5'] }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['2'] }}>
          <InfoRow
            icon={<span>{getGenderIcon(student.gender)}</span>}
            label="Gender"
            value={getGenderLabel(student.gender)}
          />
          <InfoRow
            icon={<Cake className="w-4 h-4 text-muted-foreground" />}
            label="Date of Birth"
            value={formatDate(student.dateOfBirth)}
          />
          <InfoRow
            icon={<Phone className="w-4 h-4 text-muted-foreground" />}
            label="Phone Number"
            value={formatPhone(student.primaryPhone, student.phoneCountryCode)}
          />
          <InfoRow
            icon={<MapPin className="w-4 h-4 text-muted-foreground" />}
            label="Address"
            value={student.address || 'N/A'}
          />
        </div>
      </Tile>

      {/* The guardian list used to sit here, reading the contact fields
          embedded on the student record. `StudentGuardians` on the detail page
          shows the same people from the `parents` table, with the relationship,
          the email and whether they have an account — everything this had and
          the things that matter for access. Two sections naming the same people
          is the clutter, so this one went.

          The embedded fields are still the student form's to edit, and are
          still what seeds the table on first run. That they are now two copies
          of one fact is a real wart: editing a guardian on the form will not
          move the table. Making the form write through is the fix, and belongs
          with the provisioning work rather than here. */}
    </ProfileCard>
  )
}

/** Helper for rendering a single guardian row */
