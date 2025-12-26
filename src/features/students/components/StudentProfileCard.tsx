import * as React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Tile } from '@/components/tile'
import { StatusBadge } from '@/pages/students/StatusBadge'
import { Cake, Phone, MapPin } from 'lucide-react'
import { fontSizes } from '@/config/typography'
import { primary, accent } from '@/theme/colors'
import type { Student } from '../types'
import {
  getDisplayName,
  getGenderLabel,
  getGenderIcon,
  formatDate,
  formatPhone,
  getClassLabel,
} from '../utils/formatting'

/**
 * StudentProfileCard component
 * Displays student profile information using Tile components
 */
interface StudentProfileCardProps {
  student: Student
}

export function StudentProfileCard({ student }: StudentProfileCardProps) {
  const displayName = getDisplayName(student)
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const profilePictureUrl = student.profilePictureUrl || student.avatarUrl
  const classLabel = getClassLabel(student.gradeLevel, student.section) || student.class || 'N/A'

  // Detect avatar type: photo vs illustration
  // Photos typically have image extensions, illustrations might be emoji URLs or data URIs
  const isPhoto =
    profilePictureUrl &&
    (profilePictureUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ||
      profilePictureUrl.startsWith('data:image/') ||
      profilePictureUrl.startsWith('http') ||
      profilePictureUrl.startsWith('/'))

  // Background color based on gender
  // Pink for female, Blue for male
  const avatarBackground =
    student.gender === 1 // Female
      ? primary.base // Pink for female
      : accent.base // Blue for male

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Profile Picture and Name Section */}
      <div className="flex flex-col items-center" style={{ gap: '0.75rem' }}>
        <Avatar
          className="rounded-lg"
          style={{
            width: '8rem',
            height: '8rem',
            borderRadius: '1rem',
            marginTop: '1rem',
            marginBottom: '1rem',
            backgroundColor: avatarBackground,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <AvatarImage
            src={profilePictureUrl}
            alt={displayName}
            className="rounded-lg !h-auto !w-auto"
            style={{
              borderRadius: '1rem',
              width: isPhoto ? '90%' : '60%',
              height: isPhoto ? '90%' : '60%',
              objectFit: isPhoto ? 'cover' : 'contain',
              position: 'relative',
              zIndex: 1,
            }}
          />
          <AvatarFallback
            className="text-muted-foreground rounded-lg"
            style={{
              borderRadius: '1rem',
              fontSize: '2.143rem',
              backgroundColor: avatarBackground,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 0,
            }}
          >
            {initials}
          </AvatarFallback>
        </Avatar>
        <h2
          className="font-semibold text-center"
          style={{ fontSize: fontSizes.xl, marginBottom: '0.75rem' }}
        >
          {displayName}
        </h2>

        {/* Tags Section */}
        <div className="flex flex-wrap justify-center" style={{ gap: '0.5rem' }}>
          <span
            className="bg-muted font-medium"
            style={{
              height: '1.375rem',
              paddingLeft: '0.75rem',
              paddingRight: '0.75rem',
              borderRadius: '999rem',
              fontSize: '0.857rem',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            {student.studentId}
          </span>
          <span
            className="bg-muted font-medium"
            style={{
              height: '1.375rem',
              paddingLeft: '0.75rem',
              paddingRight: '0.75rem',
              borderRadius: '999rem',
              fontSize: '0.857rem',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            {classLabel}
          </span>
          <StatusBadge
            status={student.status}
            className="font-medium"
            style={{
              height: '1.375rem',
              paddingLeft: '0.75rem',
              paddingRight: '0.75rem',
              fontSize: '0.857rem',
            }}
          />
        </div>
      </div>

      {/* Personal Information Section */}
      <Tile
        id="personal-info-section"
        layoutMode="block"
        background="muted"
        borderRadius="0.75rem"
        style={{ padding: '1.125rem' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              minHeight: '2.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span
                className="text-muted-foreground"
                style={{
                  fontSize: '1rem',
                  width: '1rem',
                  height: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {getGenderIcon(student.gender)}
              </span>
              <span className="text-muted-foreground" style={{ fontSize: '0.857rem' }}>
                Gender
              </span>
            </div>
            <p
              className="font-medium"
              style={{
                fontSize: fontSizes.sm,
                textAlign: 'right',
                maxWidth: '60%',
                lineHeight: '1.4',
              }}
            >
              {getGenderLabel(student.gender)}
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              minHeight: '2.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Cake className="text-muted-foreground" style={{ width: '1rem', height: '1rem' }} />
              <span className="text-muted-foreground" style={{ fontSize: '0.857rem' }}>
                Date of Birth
              </span>
            </div>
            <p
              className="font-medium"
              style={{
                fontSize: fontSizes.sm,
                textAlign: 'right',
                maxWidth: '60%',
                lineHeight: '1.4',
              }}
            >
              {formatDate(student.dateOfBirth)}
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              minHeight: '2.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Phone className="text-muted-foreground" style={{ width: '1rem', height: '1rem' }} />
              <span className="text-muted-foreground" style={{ fontSize: '0.857rem' }}>
                Phone Number
              </span>
            </div>
            <p
              className="font-medium"
              style={{
                fontSize: fontSizes.sm,
                textAlign: 'right',
                maxWidth: '60%',
                lineHeight: '1.4',
              }}
            >
              {formatPhone(student.primaryPhone, student.phoneCountryCode)}
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              minHeight: '2.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <MapPin className="text-muted-foreground" style={{ width: '1rem', height: '1rem' }} />
              <span className="text-muted-foreground" style={{ fontSize: '0.857rem' }}>
                Address
              </span>
            </div>
            <p
              className="font-medium"
              style={{
                fontSize: fontSizes.sm,
                textAlign: 'right',
                maxWidth: '60%',
                lineHeight: '1.4',
              }}
            >
              {student.address || 'N/A'}
            </p>
          </div>
        </div>
      </Tile>

      {/* Parent/Guardian Info Section */}
      {(student.guardians?.father ||
        student.guardians?.mother ||
        student.guardians?.alternativeGuardian) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <h3 className="font-semibold" style={{ fontSize: fontSizes.lg }}>
              Parent/Guardian Info
            </h3>
          </div>

          <Tile
            id="guardian-info-section"
            layoutMode="block"
            background="muted"
            borderRadius="1rem"
            style={{ padding: '1rem' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {student.guardians.father && student.guardians.father.name && (
                <>
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
                      style={{ fontSize: '0.857rem', fontWeight: 400 }}
                    >
                      Father
                    </span>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        maxWidth: '60%',
                        gap: '0.25rem',
                      }}
                    >
                      <p
                        className="font-semibold"
                        style={{ fontSize: fontSizes.sm, textAlign: 'right', fontWeight: 600 }}
                      >
                        {student.guardians.father.name}
                      </p>
                      {student.guardians.father.phone && (
                        <p
                          className="text-muted-foreground"
                          style={{ fontSize: '0.857rem', fontWeight: 400 }}
                        >
                          {formatPhone(
                            student.guardians.father.phone,
                            student.guardians.father.phoneCountryCode,
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                  {(student.guardians.mother?.name ||
                    student.guardians.alternativeGuardian?.name) && (
                    <Separator
                      className="my-0.5"
                      style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}
                    />
                  )}
                </>
              )}

              {student.guardians.mother && student.guardians.mother.name && (
                <>
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
                      style={{ fontSize: '0.857rem', fontWeight: 400 }}
                    >
                      Mother
                    </span>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        maxWidth: '60%',
                        gap: '0.25rem',
                      }}
                    >
                      <p
                        className="font-semibold"
                        style={{ fontSize: fontSizes.sm, textAlign: 'right', fontWeight: 600 }}
                      >
                        {student.guardians.mother.name}
                      </p>
                      {student.guardians.mother.phone && (
                        <p
                          className="text-muted-foreground"
                          style={{ fontSize: '0.857rem', fontWeight: 400 }}
                        >
                          {formatPhone(
                            student.guardians.mother.phone,
                            student.guardians.mother.phoneCountryCode,
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                  {student.guardians.alternativeGuardian?.name && (
                    <Separator
                      className="my-0.5"
                      style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}
                    />
                  )}
                </>
              )}

              {student.guardians.alternativeGuardian &&
                student.guardians.alternativeGuardian.name && (
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
                      style={{ fontSize: '0.857rem', fontWeight: 400 }}
                    >
                      Alternative Guardian
                      {student.guardians.alternativeGuardian.relation &&
                        ` (${student.guardians.alternativeGuardian.relation})`}
                    </span>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        maxWidth: '60%',
                        gap: '0.25rem',
                      }}
                    >
                      <p
                        className="font-semibold"
                        style={{ fontSize: fontSizes.sm, textAlign: 'right', fontWeight: 600 }}
                      >
                        {student.guardians.alternativeGuardian.name}
                      </p>
                      {student.guardians.alternativeGuardian.phone && (
                        <p
                          className="text-muted-foreground"
                          style={{ fontSize: '0.857rem', fontWeight: 400 }}
                        >
                          {formatPhone(
                            student.guardians.alternativeGuardian.phone,
                            student.guardians.alternativeGuardian.phoneCountryCode,
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                )}
            </div>
          </Tile>
        </div>
      )}
    </div>
  )
}
