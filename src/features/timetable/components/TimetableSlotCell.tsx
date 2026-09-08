import { Pencil } from 'lucide-react'
import { text, border, status, withOpacity } from '@/theme/colors'
import { spacing } from '@/config/spacing'
import { useSchoolConfig } from '@/config/SchoolConfigContext'
import type { TimetableSlot, TimetableException } from '../types'

interface TimetableSlotCellProps {
  slot: TimetableSlot | null
  isBreak: boolean
  isCancelled: boolean
  isSubstitution: boolean
  isExtraClass: boolean
  exception?: TimetableException
  isEditMode: boolean
  onClick?: () => void
}

/**
 * Bento-style card cell in the timetable grid.
 *
 * Each subject slot is a rounded card tinted with its subject color.
 * No left border accent — the full card background carries the color.
 */
export function TimetableSlotCell({
  slot,
  isBreak,
  isCancelled,
  isSubstitution,
  isExtraClass,
  exception,
  isEditMode,
  onClick,
}: TimetableSlotCellProps) {
  // Break cells
  if (isBreak) {
    return (
      <td
        className="text-center text-xs italic"
        style={{
          backgroundColor: border.subtle,
          color: text.muted,
          padding: `${spacing['2']} ${spacing['3']}`,
        }}
      />
    )
  }

  // Empty slot
  if (!slot && !isExtraClass) {
    return (
      <td style={{ padding: `${spacing['0.5']}` }}>
        <div
          className="flex items-center justify-center rounded-xl h-full min-h-[60px] transition-all"
          style={{
            backgroundColor: isEditMode ? withOpacity('var(--accent)', 0.15) : 'transparent',
            border: isEditMode ? `1.5px dashed var(--accent)` : undefined,
            cursor: isEditMode ? 'pointer' : 'default',
            color: text.muted,
          }}
          onClick={isEditMode ? onClick : undefined}
        >
          {isEditMode && (
            <span className="text-[11px] font-medium" style={{ color: 'var(--heading)' }}>+ Add</span>
          )}
        </div>
      </td>
    )
  }

  // Subject color for card tint
  // The school's own subject list, not the timetable mock's copy of it.
  // Both existed with the same ids, and only one of them was editable — so
  // renaming or recolouring a subject in Settings never reached this grid.
  const { config } = useSchoolConfig()
  const subject = slot ? config.subjects.find(s => s.id === slot.subjectId) : undefined
  const subjectColor = subject?.color ?? 'var(--accent)'
  // The stored name is a copy taken when the slot was written, so a subject
  // renamed in Settings kept its old name here while its colour changed —
  // half-live, which is worse than either. The configured name wins; the copy
  // is the fallback for a subject that has since been deleted.
  const subjectLabel = subject?.name ?? slot?.subjectName ?? exception?.newSubject ?? ''

  // Opacity for cancelled
  const cardOpacity = isCancelled ? 0.35 : 1

  // Tint color — substitutions and extra classes use heading color
  const tintColor = (isSubstitution || isExtraClass) ? 'var(--heading)' : subjectColor

  return (
    <td style={{ padding: `${spacing['0.5']}` }}>
      <div
        className="relative rounded-xl transition-all overflow-hidden group"
        style={{
          backgroundColor: withOpacity(tintColor, 0.1),
          border: isEditMode
            ? `1.5px dashed ${withOpacity(tintColor, 0.35)}`
            : `1px solid ${withOpacity(tintColor, 0.18)}`,
          opacity: cardOpacity,
          cursor: isEditMode ? 'pointer' : 'default',
          minHeight: '60px',
        }}
        onClick={isEditMode ? onClick : undefined}
      >
        {/* Edit mode pencil indicator */}
        {isEditMode && (
          <div
            className="absolute top-1.5 right-1.5 rounded-full flex items-center justify-center opacity-40 touch:opacity-100 group-hover:opacity-100 transition-opacity"
            style={{ width: '18px', height: '18px', backgroundColor: withOpacity(tintColor, 0.2) }}
          >
            <Pencil className="w-2.5 h-2.5" style={{ color: 'var(--heading)' }} />
          </div>
        )}
        <div style={{ padding: `${spacing['2.5']} ${spacing['3']}` }}>
          {/* Subject name */}
          <div
            className="text-[13px] font-semibold truncate leading-tight"
            style={{
              color: 'var(--heading)',
              textDecoration: isCancelled ? 'line-through' : undefined,
            }}
          >
            {subjectLabel}
          </div>

          {/* Teacher name */}
          <div
            className="text-[11px] truncate leading-tight"
            style={{ color: text.muted, marginTop: '3px' }}
          >
            {slot?.teacherName ?? exception?.newTeacherName ?? ''}
          </div>

          {/* Room — pill badge */}
          {slot?.room && (
            <span
              className="inline-block text-[9px] font-medium rounded-full mt-1.5 leading-tight"
              style={{
                color: 'var(--heading)',
                backgroundColor: withOpacity(tintColor, 0.15),
                padding: '1px 6px',
              }}
            >
              {slot.room}
            </span>
          )}

          {/* Exception indicator dot */}
          {(isSubstitution || isExtraClass || isCancelled) && !isEditMode && (
            <div
              className="absolute top-2 right-2 w-2 h-2 rounded-full"
              style={{
                backgroundColor: isCancelled ? status.danger.base : 'var(--heading)',
              }}
              title={exception?.reason}
            />
          )}
        </div>
      </div>
    </td>
  )
}
