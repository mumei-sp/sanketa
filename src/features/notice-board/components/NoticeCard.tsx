import { Calendar, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { baseColors } from '@/theme/colors'
import type { NoticeBoardEntry, NoticeStatus } from '../types'

const statusStyles: Record<NoticeStatus, { bg: string; text: string }> = {
  Active: { bg: '#D4EDDA', text: '#155724' },
  Scheduled: { bg: '#CDEAF0', text: '#0C5460' },
  Draft: { bg: '#E2E3E5', text: '#383D41' },
  Expired: { bg: '#F8D7DA', text: '#721C24' },
  Cancelled: { bg: '#FFF3CD', text: '#856404' },
}

interface NoticeCardProps {
  notice: NoticeBoardEntry
  isSelected: boolean
  onClick: (notice: NoticeBoardEntry) => void
}

export function NoticeCard({ notice, isSelected, onClick }: NoticeCardProps) {
  const status = statusStyles[notice.status]

  return (
    <button
      type="button"
      onClick={() => onClick(notice)}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border bg-white text-left transition-colors hover:bg-gray-50',
        isSelected && 'ring-2 ring-[#FECCFD] bg-[#FDFAFE]',
      )}
    >
      {/* Thumbnail */}
      <img
        src={notice.thumbnail}
        alt=""
        className="size-12 rounded-lg object-cover flex-shrink-0"
      />

      {/* Main info */}
      <div className="flex-1 min-w-0 space-y-0.5">
        {/* Tags */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {notice.tags.map(tag => (
            <span
              key={tag.label}
              className="text-badge px-2 py-0.5 rounded-full"
              style={{ backgroundColor: tag.color, color: baseColors.heading }}
            >
              {tag.label}
            </span>
          ))}
        </div>

        {/* Title */}
        <h3
          className="text-body font-semibold truncate"
          style={{ color: baseColors.heading }}
        >
          {notice.title}
        </h3>

        {/* Audience */}
        <div className="flex items-center gap-1 text-caption text-muted-foreground">
          <Users className="size-3 flex-shrink-0" />
          <span className="truncate">{notice.audience}</span>
        </div>
      </div>

      {/* Dates + Created By */}
      <div className="hidden md:flex items-center gap-4 flex-shrink-0 text-caption text-muted-foreground">
        <span className="flex items-center gap-1 whitespace-nowrap">
          <Calendar className="size-3" />
          {notice.postDate}
        </span>
        <span className="flex items-center gap-1 whitespace-nowrap">
          <Calendar className="size-3" />
          {notice.expiryDate}
        </span>
        <span className="whitespace-nowrap w-[120px] truncate">
          {notice.createdBy}
        </span>
      </div>

      {/* Status badge */}
      <span
        className="text-badge px-2.5 py-1 rounded-full flex-shrink-0"
        style={{ backgroundColor: status.bg, color: status.text }}
      >
        {notice.status}
      </span>
    </button>
  )
}
