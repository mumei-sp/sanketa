import { Calendar, Pin, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { statusVivid } from '@/theme/colors'
import type { NoticeBoardEntry, NoticeStatus } from '../types'

const statusStyles: Record<NoticeStatus, { bg: string; text: string }> = {
  Active:    { bg: statusVivid.success.bg, text: statusVivid.success.color },
  Scheduled: { bg: statusVivid.info.bg,    text: statusVivid.info.color },
  Draft:     { bg: statusVivid.neutral.bg, text: statusVivid.neutral.color },
  Expired:   { bg: statusVivid.danger.bg,  text: statusVivid.danger.color },
  Cancelled: { bg: statusVivid.warning.bg, text: statusVivid.warning.color },
}

interface NoticeCardProps {
  notice: NoticeBoardEntry
  isSelected: boolean
  onClick: (notice: NoticeBoardEntry) => void
  onTogglePin?: (id: string) => void
}

export function NoticeCard({ notice, isSelected, onClick, onTogglePin }: NoticeCardProps) {
  const status = statusStyles[notice.status]

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(notice)}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onClick(notice) }}
      className={cn(
        'group/notice relative w-full flex items-start gap-3 px-3 py-3 rounded-lg border bg-card text-left transition-colors hover:bg-muted/50 cursor-pointer md:items-center md:gap-4 md:px-4',
        isSelected && 'ring-2 ring-[color:var(--primary)] bg-[color:color-mix(in_srgb,var(--primary)_15%,var(--card))]',
      )}
    >
      {/* Pin toggle button */}
      <button
        type="button"
        onClick={e => {
          e.stopPropagation()
          onTogglePin?.(notice.id)
        }}
        className={cn(
          'tap-area absolute top-2 right-2 size-7 flex items-center justify-center rounded-md transition-all cursor-pointer z-10',
          notice.pinned
            ? 'opacity-100'
            : 'opacity-0 touch:opacity-100 group-hover/notice:opacity-100 hover:bg-muted',
        )}
        aria-label={notice.pinned ? 'Unpin notice' : 'Pin notice'}
      >
        <Pin
          className={cn(
            'size-4 transition-transform duration-200',
            notice.pinned && '-rotate-45 fill-current',
          )}
          style={{ color: 'var(--heading)' }}
        />
      </button>

      {/* Thumbnail */}
      <img
        src={notice.thumbnail}
        alt=""
        className="size-20 rounded-lg object-cover flex-shrink-0 md:size-28 lg:size-36"
      />

      {/* Main info */}
      <div className="flex-1 min-w-0 space-y-0.5">
        {/* Tags — limit to 1 visible row */}
        <div className="flex items-center gap-1.5 flex-wrap overflow-hidden max-h-6">
          {notice.tags.map(tag => (
            <span
              key={tag.label}
              className="text-badge px-2 py-0.5 rounded-full"
              style={{ backgroundColor: tag.color, color: 'var(--heading-accent, var(--heading))' }}
            >
              {tag.label}
            </span>
          ))}
        </div>

        {/* Title */}
        <h3
          className="text-body font-semibold line-clamp-2 lg:truncate"
          style={{ color: 'var(--heading)' }}
        >
          {notice.title}
        </h3>

        {/* Audience */}
        <div className="flex items-start gap-1 text-caption text-muted-foreground">
          <Users className="mt-0.5 size-3 flex-shrink-0" />
          <span className="line-clamp-2 lg:truncate">{notice.audience}</span>
        </div>
      </div>

      {/* Dates - stacked vertically with labels */}
      <div className="hidden md:flex flex-col gap-1.5 flex-shrink-0 text-caption text-muted-foreground w-[200px] lg:w-[260px]">
        <span className="flex items-center gap-1.5 whitespace-nowrap">
          <Calendar className="size-3 flex-shrink-0" />
          <span className="w-[80px] flex-shrink-0 truncate">{notice.dateLabel || 'Exp. Date'}</span>
          <span className="font-medium truncate" style={{ color: 'var(--heading)' }}>
            {notice.dateEndValue
              ? `${notice.expiryDate} – ${notice.dateEndValue}`
              : notice.expiryDate}
          </span>
        </span>
        <span className="flex items-center gap-1.5 whitespace-nowrap">
          <Calendar className="size-3 flex-shrink-0" />
          <span className="w-[80px] flex-shrink-0">Post Date</span>
          <span className="font-medium" style={{ color: 'var(--heading)' }}>{notice.postDate}</span>
        </span>
      </div>

      {/* Created By - stacked with label */}
      <div className="hidden lg:flex flex-col gap-0.5 flex-shrink-0 text-caption text-muted-foreground w-[120px]">
        <span>Created By</span>
        <span className="font-medium truncate" style={{ color: 'var(--heading)' }}>
          {notice.createdBy}
        </span>
      </div>

      {/* Status badge */}
      <span
        className="text-badge px-2.5 py-1 rounded-full flex-shrink-0 text-center lg:w-[85px] lg:px-0"
        style={{ backgroundColor: status.bg, color: status.text }}
      >
        {notice.status}
      </span>
    </div>
  )
}
