import { Separator } from '@/components/ui/separator'
import { Tile } from '@/components/tile'
import { ProfileCard } from '@/components/ui/profile-card'
import { InfoRow } from '@/components/ui/info-row'
import { StatusBadge } from './StatusBadge'
import { Cake, Phone, MapPin } from 'lucide-react'
import { fontSizes, fontWeights } from '@/config/typography'
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
      wrapped={false}
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

      {/* Parent/Guardian Info Section */}
      {(student.guardians?.father ||
        student.guardians?.mother ||
        student.guardians?.alternativeGuardian) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['4'] }}>
          <div>
            <h3 className="font-semibold" style={{ fontSize: fontSizes.lg }}>
              Parent/Guardian Info
            </h3>
          </div>

          <Tile
            id="guardian-info-section"
            layoutMode="block"
            background="muted"
            borderRadius={spacing['4']}
            style={{ padding: spacing['4'] }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {student.guardians.father && student.guardians.father.name && (
                <>
                  <GuardianRow
                    label="Father"
                    name={student.guardians.father.name}
                    phone={student.guardians.father.phone}
                    phoneCountryCode={student.guardians.father.phoneCountryCode}
                  />
                  {(student.guardians.mother?.name ||
                    student.guardians.alternativeGuardian?.name) && (
                    <Separator
                      className="my-0.5"
                      style={{ marginTop: spacing['2'], marginBottom: spacing['2'] }}
                    />
                  )}
                </>
              )}

              {student.guardians.mother && student.guardians.mother.name && (
                <>
                  <GuardianRow
                    label="Mother"
                    name={student.guardians.mother.name}
                    phone={student.guardians.mother.phone}
                    phoneCountryCode={student.guardians.mother.phoneCountryCode}
                  />
                  {student.guardians.alternativeGuardian?.name && (
                    <Separator
                      className="my-0.5"
                      style={{ marginTop: spacing['2'], marginBottom: spacing['2'] }}
                    />
                  )}
                </>
              )}

              {student.guardians.alternativeGuardian &&
                student.guardians.alternativeGuardian.name && (
                  <GuardianRow
                    label={`Alternative Guardian${
                      student.guardians.alternativeGuardian.relation
                        ? ` (${student.guardians.alternativeGuardian.relation})`
                        : ''
                    }`}
                    name={student.guardians.alternativeGuardian.name}
                    phone={student.guardians.alternativeGuardian.phone}
                    phoneCountryCode={student.guardians.alternativeGuardian.phoneCountryCode}
                  />
                )}
            </div>
          </Tile>
        </div>
      )}
    </ProfileCard>
  )
}

/** Helper for rendering a single guardian row */
function GuardianRow({
  label,
  name,
  phone,
  phoneCountryCode,
}: {
  label: string
  name: string
  phone?: string
  phoneCountryCode?: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: '2.75rem',
      }}
    >
      <span
        className="text-muted-foreground"
        style={{ fontSize: fontSizes.xs, fontWeight: fontWeights.regular }}
      >
        {label}
      </span>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          maxWidth: '60%',
          gap: spacing['1'],
        }}
      >
        <p
          className="font-semibold"
          style={{ fontSize: fontSizes.sm, textAlign: 'right', fontWeight: fontWeights.semibold }}
        >
          {name}
        </p>
        {phone && (
          <p
            className="text-muted-foreground"
            style={{ fontSize: fontSizes.xs, fontWeight: fontWeights.regular }}
          >
            {formatPhone(phone, phoneCountryCode)}
          </p>
        )}
      </div>
    </div>
  )
}
