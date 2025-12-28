import * as React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Tile } from '@/components/tile'
import { Phone, Mail } from 'lucide-react'
import { textRoles, fontWeights } from '@/config/typography'
import { spacing } from '@/config/spacing'
import { primary, accent, text, background, baseColors } from '@/theme/colors'
import type { Teacher } from '../types'
import { getDisplayName, formatPhone } from '../utils/formatting'

/**
 * TeacherCard component
 * Displays teacher profile information in a compact card format
 */
interface TeacherCardProps {
  teacher: Teacher
  onViewDetails?: (teacher: Teacher) => void
}

export function TeacherCard({ teacher, onViewDetails }: TeacherCardProps) {
  const displayName = getDisplayName(teacher)
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const profilePictureUrl = teacher.profilePictureUrl || teacher.avatarUrl

  // Light purple background for avatar
  const avatarBackground = primary.soft

  // Detect avatar type: photo vs illustration
  const isPhoto =
    profilePictureUrl &&
    (profilePictureUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ||
      profilePictureUrl.startsWith('data:image/') ||
      profilePictureUrl.startsWith('http') ||
      profilePictureUrl.startsWith('/'))

  const handleViewDetails = React.useCallback(() => {
    if (onViewDetails) {
      onViewDetails(teacher)
    }
  }, [onViewDetails, teacher])

  return (
    <Tile
      id={`teacher-card-${teacher.id}`}
      layoutMode="flex"
      background="card"
      borderRadius="lg"
      shadowed
      padding={16}
      style={{
        height: '180px',
        flexDirection: 'column',
        gap: spacing['3'],
      }}
    >
      {/* Profile Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing['3'],
          flex: '0 0 auto',
        }}
      >
        {/* Avatar */}
        <Avatar
          style={{
            width: '3rem',
            height: '3rem',
            borderRadius: '50%',
            backgroundColor: avatarBackground,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            position: 'relative',
          }}
        >
          <AvatarImage
            src={profilePictureUrl}
            alt={displayName}
            style={{
              borderRadius: '50%',
              width: isPhoto ? '90%' : '60%',
              height: isPhoto ? '90%' : '60%',
              objectFit: isPhoto ? 'cover' : 'contain',
              position: 'relative',
              zIndex: 1,
            }}
          />
          <AvatarFallback
            style={{
              borderRadius: '50%',
              fontSize: textRoles.sectionTitle.fontSize,
              fontWeight: textRoles.sectionTitle.fontWeight,
              backgroundColor: avatarBackground,
              color: text.heading,
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

        {/* Name, ID, Subject */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: spacing['1'],
            flex: 1,
            minWidth: 0,
          }}
        >
          <h3
            style={{
              fontSize: textRoles.sectionTitle.fontSize,
              fontWeight: textRoles.sectionTitle.fontWeight,
              lineHeight: textRoles.sectionTitle.lineHeight,
              color: text.heading,
              margin: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {displayName}
          </h3>
          <p
            style={{
              fontSize: textRoles.bodyMuted.fontSize,
              fontWeight: textRoles.bodyMuted.fontWeight,
              lineHeight: textRoles.bodyMuted.lineHeight,
              color: text.muted,
              margin: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {teacher.teacherId} · {teacher.subject}
          </p>
        </div>
      </div>

      {/* Contact Info Box */}
      <Tile
        id={`teacher-contact-${teacher.id}`}
        layoutMode="flex"
        background="muted"
        borderRadius="md"
        padding={12}
        style={{
          flex: '1 1 auto',
          flexDirection: 'column',
          gap: spacing['2'],
          minHeight: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing['2'],
          }}
        >
          <Phone
            style={{
              width: spacing['4'],
              height: spacing['4'],
              color: text.muted,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: textRoles.body.fontSize,
              fontWeight: textRoles.body.fontWeight,
              lineHeight: textRoles.body.lineHeight,
              color: text.body,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {formatPhone(teacher.primaryPhone)}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing['2'],
          }}
        >
          <Mail
            style={{
              width: spacing['4'],
              height: spacing['4'],
              color: text.muted,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: textRoles.body.fontSize,
              fontWeight: textRoles.body.fontWeight,
              lineHeight: textRoles.body.lineHeight,
              color: text.body,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {teacher.email}
          </span>
        </div>
      </Tile>

      {/* View Details Button - Bottom right */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          flex: '0 0 auto',
        }}
      >
        <Button
          onClick={handleViewDetails}
          style={{
            backgroundColor: baseColors.blue,
            color: text.heading,
            fontSize: textRoles.body.fontSize,
            fontWeight: fontWeights.medium,
            height: '2rem',
            padding: `0 ${spacing['3']}`,
            borderRadius: spacing['1.5'],
            flexShrink: 0,
          }}
          className="hover:opacity-90 border-0"
        >
          View Details
        </Button>
      </div>
    </Tile>
  )
}

