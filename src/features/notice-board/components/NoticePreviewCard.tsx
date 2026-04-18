import { Eye } from 'lucide-react'
import { baseColors, statusVivid } from '@/theme/colors'
import { getNoticeCategoryColor } from '../utils/category-colors'
import type { NoticeFormValues } from '../schemas/notice-schema'

const statusStyles: Record<string, { bg: string; text: string }> = {
  Active:    { bg: statusVivid.success.bg, text: statusVivid.success.color },
  Scheduled: { bg: statusVivid.info.bg,    text: statusVivid.info.color },
  Draft:     { bg: statusVivid.neutral.bg, text: statusVivid.neutral.color },
  Expired:   { bg: statusVivid.danger.bg,  text: statusVivid.danger.color },
  Cancelled: { bg: statusVivid.warning.bg, text: statusVivid.warning.color },
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  const date = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00')
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

interface NoticePreviewCardProps {
  values: Partial<NoticeFormValues>
}

export function NoticePreviewCard({ values }: NoticePreviewCardProps) {
  const status = statusStyles[values.status || ''] || statusStyles.Draft
  const categoryColor = getNoticeCategoryColor(values.category)

  return (
    <div className="rounded-xl border bg-background shadow-sm overflow-hidden flex flex-col">
      {/* Image */}
      {values.thumbnail ? (
        <img src={values.thumbnail} alt="" className="w-full h-96 object-cover" />
      ) : (
        <div className="w-full h-96 bg-muted flex items-center justify-center">
          <span className="text-body-muted text-muted-foreground">Notice Image</span>
        </div>
      )}

      <div className="px-5 py-5 space-y-5">
        {/* Status + Views row */}
        <div className="flex items-center gap-2">
          {values.status && (
            <span
              className="text-badge px-2.5 py-1 rounded-full"
              style={{ backgroundColor: status.bg, color: status.text }}
            >
              {values.status}
            </span>
          )}
          {values.category && (
            <span
              className="text-badge px-2.5 py-1 rounded-full"
              style={{ backgroundColor: categoryColor, color: 'var(--heading)' }}
            >
              {values.category}
            </span>
          )}
          <span className="text-badge px-2.5 py-1 rounded-full bg-gray-100 text-muted-foreground flex items-center gap-1">
            <Eye className="size-3" />
            0
          </span>
        </div>

        {/* Title */}
        <h4
          className="text-body font-semibold leading-snug line-clamp-2"
          style={{ color: 'var(--heading)' }}
        >
          {values.title || 'Notice Title'}
        </h4>

        {/* Details grid */}
        <div className="space-y-3 pt-1">
          {values.audience && (
            <PreviewRow label="Audience" value={values.audience} />
          )}
          {values.postDate && (
            <PreviewRow label="Post Date" value={formatDate(values.postDate)} />
          )}
          {values.dateValue && (
            <PreviewRow
              label={values.dateLabel || 'Due Date'}
              value={
                values.dateEndValue
                  ? `${formatDate(values.dateValue)} – ${formatDate(values.dateEndValue)}`
                  : formatDate(values.dateValue)
              }
            />
          )}
        </div>

        {/* Content */}
        {values.content && (
          <div className="pt-1">
            <p
              className="text-body-muted font-medium mb-1.5"
              style={{ color: 'var(--heading)' }}
            >
              Content
            </p>
            <p className="text-caption text-muted-foreground leading-relaxed line-clamp-4">
              {values.content}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-body-muted text-muted-foreground w-[90px] flex-shrink-0">{label}</span>
      <span className="text-body-muted font-medium min-w-0" style={{ color: 'var(--heading)' }}>
        {value}
      </span>
    </div>
  )
}
