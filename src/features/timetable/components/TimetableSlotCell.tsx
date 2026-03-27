import { text, border, background, status } from '@/theme/colors'
import { spacing } from '@/config/spacing'
import { getSubjectById } from '@/data/mocks/timetable'
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
 * Individual card cell in the timetable grid.
 *
 * Design: White card with colored left border (3px) per subject,
 * rounded corners, subtle shadow. Break rows are muted full-width bars.
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
  // Break cells — rendered by parent as colSpan, this handles individual
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

  // Empty slot (no class assigned)
  if (!slot && !isExtraClass) {
    return (
      <td style={{ padding: `${spacing['1']}` }}>
        <div
          className="flex items-center justify-center rounded-lg h-full min-h-[56px] transition-all"
          style={{
            backgroundColor: isEditMode ? background.card : 'transparent',
            border: isEditMode ? `1.5px dashed ${border.default}` : undefined,
            cursor: isEditMode ? 'pointer' : 'default',
            color: text.muted,
          }}
          onClick={isEditMode ? onClick : undefined}
        >
          {isEditMode && (
            <span className="text-xs font-medium">+ Add</span>
          )}
        </div>
      </td>
    )
  }

  // Subject color for left border accent
  const subjectColor = slot ? (getSubjectById(slot.subjectId)?.color ?? border.default) : border.default

  // Card styling based on state
  let cardOpacity = 1
  let leftBorderColor = subjectColor

  if (isCancelled) {
    cardOpacity = 0.45
    leftBorderColor = status.danger.base
  } else if (isSubstitution) {
    leftBorderColor = text.heading
  } else if (isExtraClass) {
    leftBorderColor = text.heading
  }

  return (
    <td style={{ padding: `${spacing['1']}` }}>
      <div
        className="relative rounded-lg shadow-sm transition-all hover:shadow-md"
        style={{
          backgroundColor: background.card,
          borderLeft: `3px solid ${leftBorderColor}`,
          border: `1px solid ${border.subtle}`,
          borderLeftWidth: '3px',
          borderLeftColor: leftBorderColor,
          opacity: cardOpacity,
          padding: `${spacing['2']} ${spacing['2.5']}`,
          cursor: isEditMode ? 'pointer' : 'default',
          minHeight: '56px',
        }}
        onClick={isEditMode ? onClick : undefined}
      >
        {/* Subject name */}
        <div
          className="text-xs font-semibold truncate leading-tight"
          style={{
            color: text.heading,
            textDecoration: isCancelled ? 'line-through' : undefined,
          }}
        >
          {slot?.subjectName ?? exception?.newSubject ?? ''}
        </div>

        {/* Teacher name */}
        <div
          className="text-[10px] truncate mt-1 leading-tight"
          style={{ color: text.body }}
        >
          {slot?.teacherName ?? exception?.newTeacherName ?? ''}
        </div>

        {/* Room */}
        {slot?.room && (
          <div
            className="text-[10px] truncate mt-0.5 leading-tight"
            style={{ color: text.muted }}
          >
            {slot.room}
          </div>
        )}

        {/* Exception indicator dot */}
        {(isSubstitution || isExtraClass || isCancelled) && (
          <div
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
            style={{
              backgroundColor: isCancelled ? status.danger.base : text.heading,
            }}
            title={exception?.reason}
          />
        )}
      </div>
    </td>
  )
}
