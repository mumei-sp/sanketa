import * as React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Phone, Mail, MessageCircle, Pencil, Trash2 } from 'lucide-react'
import { primary, accent, text, baseColors, status } from '@/theme/colors'
import { Tile } from '@/components/tile'
import type { Teacher } from '../types'
import { getDisplayName, formatPhone } from '../utils/formatting'

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

interface TeacherCardProps {
  teacher: Teacher
  onViewDetails?: (teacher: Teacher) => void
  onEdit?: (teacher: Teacher) => void
  onDelete?: (id: string) => Promise<void>
}

/**
 * TeacherCard component
 * Displays teacher profile information matching Figma design
 */
export function TeacherCard({ teacher, onViewDetails, onEdit, onDelete }: TeacherCardProps) {
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

  const [isDeleting, setIsDeleting] = React.useState(false)

  const handleViewDetails = React.useCallback(() => {
    if (onViewDetails) {
      onViewDetails(teacher)
    }
  }, [onViewDetails, teacher])

  return (
    <Tile
      id={`teacher-card-${teacher.id}`}
      layoutMode="block"
      background="card"
      borderRadius="lg"
      shadowed
      padding={16}
      className="relative flex flex-col gap-3 h-full cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleViewDetails}
    >
      {/* Top-right action icons */}
      {(onEdit || onDelete) && (
        <div className="absolute top-3 right-3 flex items-center gap-0.5">
          {onEdit && (
            <button
              onClick={e => { e.stopPropagation(); onEdit(teacher) }}
              className="w-7 h-7 rounded-md flex items-center justify-center transition-colors"
              style={{ backgroundColor: accent.soft }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = accent.base }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = accent.soft }}
              aria-label="Edit teacher"
            >
              <Pencil className="w-3.5 h-3.5" style={{ color: text.heading }} />
            </button>
          )}
          {onDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  onClick={e => e.stopPropagation()}
                  className="w-7 h-7 rounded-md flex items-center justify-center transition-colors"
                  style={{ backgroundColor: accent.soft }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = status.danger.soft }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = accent.soft }}
                  aria-label="Delete teacher"
                >
                  <Trash2 className="w-3.5 h-3.5" style={{ color: text.heading }} />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent onClick={e => e.stopPropagation()}>
                <AlertDialogHeader>
                  <AlertDialogTitle style={{ color: text.heading }}>Delete Teacher</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete &ldquo;{displayName}&rdquo;? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    disabled={isDeleting}
                    onClick={async (e) => {
                      e.preventDefault()
                      setIsDeleting(true)
                      try {
                        await onDelete?.(teacher.id as string)
                      } finally {
                        setIsDeleting(false)
                      }
                    }}
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      )}

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
      <div className="flex items-center justify-between pt-3 border-t border-border/50">
        <div className="flex items-center gap-2">
          {/* Phone & MessageCircle: visible on tablet/mobile, hidden on desktop */}
          <button onClick={e => e.stopPropagation()} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-muted transition-colors lg:hidden">
            <Phone className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <button onClick={e => e.stopPropagation()} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
            <WhatsAppIcon className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <button onClick={e => e.stopPropagation()} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-muted transition-colors lg:hidden">
            <MessageCircle className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
        <Button
          onClick={e => e.stopPropagation()}
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
    </Tile>
  )
}
