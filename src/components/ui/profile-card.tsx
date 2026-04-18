import * as React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tile } from '@/components/tile'
import { fontSizes } from '@/config/typography'
import { spacing } from '@/config/spacing'
import { text, border } from '@/theme/colors'

export interface ProfileBadge {
  label: string
  /** 'muted' = gray bg, 'primary' = pink bg. Default: 'muted' */
  variant?: 'muted' | 'primary'
}

export interface ProfileDetail {
  label: string
  value: string
}

export interface ProfileCardProps {
  /** Display name */
  name: string
  /** Profile picture URL */
  avatarUrl?: string
  /** 0 = male, 1 = female — determines avatar background color */
  gender?: number
  /** Avatar size. Default: '7rem' */
  avatarSize?: string
  /** Pill badges below the name (e.g. ID, status, employment type) */
  badges?: ProfileBadge[]
  /** Key-value detail rows below badges (e.g. Subject / Class) */
  details?: ProfileDetail[]
  /** Additional content rendered below the card body */
  children?: React.ReactNode
  /** Whether to wrap in a Tile card. Default: true */
  wrapped?: boolean
}

/**
 * ProfileCard - Generic profile card with avatar, name, badges, detail rows, and children.
 * Shared between Student Details and Teacher Details pages.
 */
export function ProfileCard({
  name,
  avatarUrl,
  gender,
  avatarSize = '7rem',
  badges = [],
  details = [],
  children,
  wrapped = true,
}: ProfileCardProps) {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const isPhoto =
    avatarUrl &&
    (avatarUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ||
      avatarUrl.startsWith('data:image/') ||
      avatarUrl.startsWith('http') ||
      avatarUrl.startsWith('/'))

  // Pink for female, Blue for male
  const avatarBackground = gender === 1 ? 'var(--primary)' : 'var(--accent)'

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['3'] }}>
      {/* Avatar + Name + Badges */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: spacing['3'] }}>
        <Avatar
          className="rounded-lg"
          style={{
            width: avatarSize,
            height: avatarSize,
            borderRadius: '1rem',
            marginTop: spacing['2'],
            marginBottom: spacing['2'],
            backgroundColor: avatarBackground,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <AvatarImage
            src={avatarUrl}
            alt={name}
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
              fontSize: fontSizes['2xl'],
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

        {/* Name */}
        <h2
          className="font-semibold text-center"
          style={{ fontSize: fontSizes.xl, color: 'var(--heading)', margin: 0 }}
        >
          {name}
        </h2>

        {/* Badges */}
        {badges.length > 0 && (
          <div className="flex flex-wrap justify-center" style={{ gap: spacing['2'] }}>
            {badges.map(badge => (
              <span
                key={badge.label}
                className="font-medium"
                style={{
                  height: spacing['7'],
                  paddingLeft: spacing['3'],
                  paddingRight: spacing['3'],
                  borderRadius: '999rem',
                  fontSize: fontSizes.xs,
                  display: 'inline-flex',
                  alignItems: 'center',
                  backgroundColor: badge.variant === 'primary' ? 'var(--primary)' : border.default,
                  color: text.body,
                }}
              >
                {badge.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Detail rows (Subject, Class, etc.) */}
      {details.length > 0 && (
        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: spacing['2'],
            marginTop: spacing['2'],
          }}
        >
          {details.map(detail => (
            <div
              key={detail.label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span className="text-muted-foreground" style={{ fontSize: fontSizes.xs }}>
                {detail.label}
              </span>
              <span className="font-medium" style={{ fontSize: fontSizes.sm, color: text.body }}>
                {detail.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Additional content (personal info, guardian info, etc.) */}
      {children}
    </div>
  )

  if (!wrapped) return content

  return (
    <Tile
      id="profile-card"
      layoutMode="block"
      background="card"
      borderRadius="xl"
      shadowed
      padding={16}
    >
      {content}
    </Tile>
  )
}
