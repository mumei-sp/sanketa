import * as React from 'react'
import { X, FileText, Eye, Pencil, Trash2, Share2, Pin } from 'lucide-react'
import { cn } from '@/lib/utils'
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
import { Tile } from '@/components/tile'
import { baseColors, status, accent, border as borderTokens, statusVivid } from '@/theme/colors'
import type { NoticeBoardEntry, NoticeStatus } from '../types'

const statusStyles: Record<NoticeStatus, { bg: string; text: string }> = {
  Active:    { bg: statusVivid.success.bg, text: statusVivid.success.color },
  Scheduled: { bg: statusVivid.info.bg,    text: statusVivid.info.color },
  Draft:     { bg: statusVivid.neutral.bg, text: statusVivid.neutral.color },
  Expired:   { bg: statusVivid.danger.bg,  text: statusVivid.danger.color },
  Cancelled: { bg: statusVivid.warning.bg, text: statusVivid.warning.color },
}

const CONTENT_LINE_CLAMP = 4

interface NoticeDetailBoardProps {
  notice: NoticeBoardEntry
  onClose: () => void
  onDelete?: (id: string) => void
  onEdit?: (notice: NoticeBoardEntry) => void
  onTogglePin?: (id: string) => void
  showClose?: boolean
}

export function NoticeDetailBoard({ notice, onClose, onDelete, onEdit, onTogglePin, showClose = true }: NoticeDetailBoardProps) {
  const status = statusStyles[notice.status]
  const [isContentExpanded, setIsContentExpanded] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  // Reset expanded state when notice changes
  React.useEffect(() => {
    setIsContentExpanded(false)
  }, [notice.id])

  return (
    <Tile
      id="notice-detail-board"
      layoutMode="block"
      background="card"
      borderRadius="xl"
      shadowed
      padding={0}
      className="border flex flex-col max-h-[calc(100vh-2rem)]"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b">
        <h3 className="text-section-title" style={{ color: baseColors.heading }}>
          Detail Board
        </h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onTogglePin?.(notice.id)}
            className="size-8 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label={notice.pinned ? 'Unpin notice' : 'Pin notice'}
          >
            <Pin
              className={cn(
                'size-4 transition-transform duration-200',
                notice.pinned && '-rotate-45 fill-current',
              )}
              style={{ color: baseColors.heading }}
            />
          </button>
          {showClose && (
            <button
              type="button"
              onClick={onClose}
              className="size-8 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content - scrollable */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        {/* Image */}
        <img
          src={notice.thumbnail.replace('w=120&h=120', 'w=600&h=300')}
          alt=""
          className="w-full h-96 object-cover rounded-lg"
        />

        {/* Status + Views row */}
        <div className="flex items-center gap-2">
          <span
            className="text-badge px-2.5 py-1 rounded-full"
            style={{ backgroundColor: status.bg, color: status.text }}
          >
            {notice.status}
          </span>
          <span className="text-badge px-2.5 py-1 rounded-full bg-gray-100 text-muted-foreground flex items-center gap-1">
            <Eye className="size-3" />
            {notice.views}
          </span>
        </div>

        {/* Title — max 2 lines */}
        <h4
          className="text-body font-semibold leading-snug line-clamp-2"
          style={{ color: baseColors.heading }}
        >
          {notice.title}
        </h4>

        {/* Creator — truncate */}
        <p className="text-body-muted text-muted-foreground truncate">
          By {notice.createdBy}
        </p>

        {/* Details grid */}
        <div className="space-y-3 pt-1">
          <DetailRow label="Audience" value={notice.audience} />
          <DetailRow label="Post Date" value={notice.dateLabel ? notice.postDate : `${notice.postDate} - 08:00 AM`} />
          <DetailRow
            label={notice.dateLabel || 'Exp Date'}
            value={
              notice.dateEndValue
                ? `${notice.expiryDate} – ${notice.dateEndValue}`
                : notice.dateLabel
                  ? notice.expiryDate
                  : `${notice.expiryDate} - 01:00 PM`
            }
          />
        </div>

        {/* Content — clamped with show more/less */}
        <div className="pt-1">
          <p
            className="text-body-muted font-medium mb-1.5"
            style={{ color: baseColors.heading }}
          >
            Content
          </p>
          <p
            className="text-caption text-muted-foreground leading-relaxed"
            style={!isContentExpanded ? { WebkitLineClamp: CONTENT_LINE_CLAMP, display: '-webkit-box', WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' } : undefined}
          >
            {notice.content}
          </p>
          {notice.content.length > 150 && (
            <button
              type="button"
              onClick={() => setIsContentExpanded(prev => !prev)}
              className="text-caption font-medium mt-1 hover:underline"
              style={{ color: baseColors.heading }}
            >
              {isContentExpanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>

        {/* Attachments — limit visible count */}
        {notice.attachments.length > 0 && (
          <div className="pt-1">
            <p
              className="text-body-muted font-medium mb-2"
              style={{ color: baseColors.heading }}
            >
              Attachment{notice.attachments.length > 1 ? `s (${notice.attachments.length})` : ''}
            </p>
            <div className="space-y-2">
              {notice.attachments.slice(0, 3).map(att => (
                <div
                  key={att.name}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 border"
                >
                  <FileText className="size-5 text-red-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-body-muted font-medium truncate" style={{ color: baseColors.heading }}>
                      {att.name}
                    </p>
                    <p className="text-caption text-muted-foreground">
                      {att.type} · {att.size}
                    </p>
                  </div>
                </div>
              ))}
              {notice.attachments.length > 3 && (
                <p className="text-caption text-muted-foreground">
                  +{notice.attachments.length - 3} more attachment{notice.attachments.length - 3 > 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 px-5 py-4 border-t">
        <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => onEdit?.(notice)}>
          <Pencil className="size-3.5" />
          Edit
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-text-heading border-border-default hover:bg-accent-soft">
              <Trash2 className="size-3.5" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Notice</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{notice.title}"? This action cannot be undone.
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
                    await onDelete?.(notice.id)
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
        <Button variant="outline" size="sm" className="flex-1 gap-1.5">
          <Share2 className="size-3.5" />
          Share
        </Button>
      </div>
    </Tile>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-body-muted text-muted-foreground w-[90px] flex-shrink-0">{label}</span>
      <span className="text-body-muted font-medium min-w-0 truncate" style={{ color: baseColors.heading }}>
        {value}
      </span>
    </div>
  )
}
