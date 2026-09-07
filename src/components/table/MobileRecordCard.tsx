/**
 * MobileRecordCard — the shape a DataTable row takes below `lg`.
 *
 * Column layouts stop working once the viewport is narrower than the sum of
 * their columns; the alternative is a card per record, where the identifying
 * fields lead and the rest read as label/value pairs. Pass this to
 * `DataTable`'s `renderMobileCard` so every list in the app collapses the
 * same way.
 *
 * @example
 * ```tsx
 * <DataTable
 *   columns={studentColumns}
 *   data={students}
 *   renderMobileCard={row => (
 *     <MobileRecordCard
 *       media={<Avatar>…</Avatar>}
 *       title={row.original.name}
 *       subtitle={row.original.studentId}
 *       trailing={<StatusBadge status={row.original.status} />}
 *       fields={[
 *         { label: 'Class', value: row.original.class },
 *         { label: 'GPA', value: row.original.gpa.toFixed(1) },
 *       ]}
 *       onClick={() => navigate(`/students/details/${row.original.id}`)}
 *     />
 *   )}
 * />
 * ```
 */

import * as React from 'react'
import { MobileCardItem } from '@/components/shared/MobileCardItem'
import { cn } from '@/lib/utils'

/** A single label/value pair rendered in the card's detail grid. */
export interface MobileRecordField {
  label: string
  value: React.ReactNode
}

export interface MobileRecordCardProps {
  /** Leading visual — avatar, icon badge, colour chip. */
  media?: React.ReactNode
  /** Primary identifier for the record. */
  title: React.ReactNode
  /** Secondary identifier — ID, email, category. */
  subtitle?: React.ReactNode
  /** Top-right slot — status pill, amount, overflow menu. */
  trailing?: React.ReactNode
  /** Label/value pairs laid out two-up beneath the header. */
  fields?: MobileRecordField[]
  /** Full-width row under the fields — action buttons. */
  footer?: React.ReactNode
  /** Makes the whole card activate, mirroring a clickable table row. */
  onClick?: () => void
  className?: string
}

export function MobileRecordCard({
  media,
  title,
  subtitle,
  trailing,
  fields,
  footer,
  onClick,
  className,
}: MobileRecordCardProps) {
  const interactive = Boolean(onClick)

  return (
    <MobileCardItem
      className={cn(
        'flex flex-col gap-3',
        interactive &&
          'cursor-pointer transition-colors hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-ring',
        className,
      )}
      onClick={onClick}
      onKeyDown={
        interactive
          ? event => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onClick?.()
              }
            }
          : undefined
      }
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
    >
      {/* ── Header: identity on the left, status on the right ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {media}
          <div className="flex min-w-0 flex-col">
            <span className="font-medium break-words">{title}</span>
            {subtitle && (
              <span className="text-body-muted text-muted-foreground break-words">
                {subtitle}
              </span>
            )}
          </div>
        </div>
        {trailing && <div className="flex shrink-0 items-center gap-2">{trailing}</div>}
      </div>

      {/* ── Detail grid — two columns so short values pair up ── */}
      {fields && fields.length > 0 && (
        <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
          {fields.map(field => (
            <div key={field.label} className="flex min-w-0 flex-col gap-0.5">
              <dt className="text-caption text-muted-foreground">{field.label}</dt>
              <dd className="text-body font-medium break-words">{field.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {footer && <div className="flex flex-wrap items-center gap-2">{footer}</div>}
    </MobileCardItem>
  )
}
