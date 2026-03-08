import * as React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Phone, Mail, MessageCircle } from 'lucide-react'
import { primary, text, baseColors } from '@/theme/colors'
import type { Teacher } from '../types'
import { getDisplayName, formatPhone } from '../utils/formatting'

interface TeacherCardProps {
  teacher: Teacher
  onViewDetails?: (teacher: Teacher) => void
}

/**
 * TeacherCard component
 * Displays teacher profile information matching Figma design
 */
export function TeacherCard({ teacher, onViewDetails }: TeacherCardProps) {
  const displayName = getDisplayName(teacher)
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const profilePictureUrl = teacher.profilePictureUrl || teacher.avatarUrl

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
    <div className="bg-card rounded-lg shadow-xs p-4 flex flex-col gap-3 h-full">
      {/* Profile Header */}
      <div className="flex items-center gap-3">
        <Avatar
          className="w-12 h-12 shrink-0"
          style={{ backgroundColor: primary.soft }}
        >
          <AvatarImage
            src={profilePictureUrl}
            alt={displayName}
            className="rounded-full"
            style={{
              width: isPhoto ? '90%' : '60%',
              height: isPhoto ? '90%' : '60%',
              objectFit: isPhoto ? 'cover' : 'contain',
            }}
          />
          <AvatarFallback
            className="text-sm font-semibold"
            style={{ backgroundColor: primary.soft, color: text.heading }}
          >
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col min-w-0">
          <h3 className="text-sm font-semibold truncate" style={{ color: text.heading }}>
            {displayName}
          </h3>
          <p className="text-xs text-muted-foreground truncate">
            {teacher.teacherId} · {teacher.subject}
          </p>
        </div>
      </div>

      {/* Contact Info */}
      <div className="flex flex-col gap-2 flex-1">
        <div className="flex items-center gap-2">
          <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs text-foreground truncate">
            {formatPhone(teacher.primaryPhone)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs text-foreground truncate">
            {teacher.email}
          </span>
        </div>
      </div>

      {/* Bottom: Social icons + Message button */}
      <div className="flex items-center justify-between pt-1 border-t border-border/50">
        <div className="flex items-center gap-2">
          <button className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
            <Phone className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <button className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
            <svg className="w-3.5 h-3.5 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </button>
          <button className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
            <MessageCircle className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
        <Button
          onClick={handleViewDetails}
          size="sm"
          className="h-7 text-xs px-3 hover:opacity-90 border-0"
          style={{
            backgroundColor: baseColors.blue,
            color: text.heading,
          }}
        >
          Message
        </Button>
      </div>
    </div>
  )
}
