/**
 * StudentAvatar — Reusable avatar with initials fallback.
 *
 * Wraps the base Avatar/AvatarImage/AvatarFallback primitives with
 * app-specific styling (accent background, heading-colored initials).
 */

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { colors } from '@/theme/colors'
import { getInitials } from '@/utils/format'

interface StudentAvatarProps {
  name: string
  avatarUrl?: string
  /** Pixel size. Default: 32 */
  size?: number
  className?: string
}

export function StudentAvatar({ name, avatarUrl, size = 32, className }: StudentAvatarProps) {
  return (
    <Avatar
      className={className}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        backgroundColor: 'var(--accent)',
      }}
    >
      {avatarUrl && (
        <AvatarImage src={avatarUrl} alt={name} className="object-cover" />
      )}
      <AvatarFallback
        className="text-xs font-semibold bg-transparent"
        style={{ color: 'var(--heading)' }}
      >
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  )
}
