import { text, border, background } from '@/theme/colors'
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
 * Individual cell in the timetable grid.
 * Shows subject name, teacher, and room with subject-specific color tinting.
 * Handles break rows, cancellations, substitutions, and extra classes.
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

  // Empty slot (no class assigned)
  if (!slot && !isExtraClass) {
    return (
      <td
        className="text-center text-xs"
        style={{
          backgroundColor: background.card,
          color: text.muted,
          padding: `${spacing['2']} ${spacing['3']}`,
          cursor: isEditMode ? 'pointer' : 'default',
          border: isEditMode ? `1px dashed ${border.default}` : undefined,
        }}
        onClick={isEditMode ? onClick : undefined}
      >
        {isEditMode ? '+' : '—'}
      </td>
    )
  }

  // Get subject color
  const subjectColor = slot ? (getSubjectById(slot.subjectId)?.color ?? border.default) : border.default

  // Determine cell styling
  let cellBg = subjectColor
  let cellBorder = 'transparent'
  let opacity = 1

  if (isCancelled) {
    cellBg = border.subtle
    opacity = 0.5
  } else if (isSubstitution) {
    cellBorder = text.heading
  } else if (isExtraClass) {
    cellBorder = text.heading
  }

  return (
    <td
      className="relative transition-all"
      style={{
        backgroundColor: cellBg,
        opacity,
        padding: `${spacing['1.5']} ${spacing['2']}`,
        borderLeft: cellBorder !== 'transparent' ? `3px solid ${cellBorder}` : undefined,
        cursor: isEditMode ? 'pointer' : 'default',
        minWidth: '120px',
      }}
      onClick={isEditMode ? onClick : undefined}
    >
      {/* Subject name */}
      <div
        className="text-xs font-semibold truncate"
        style={{
          color: text.heading,
          textDecoration: isCancelled ? 'line-through' : undefined,
        }}
      >
        {slot?.subjectName ?? exception?.newSubject ?? ''}
      </div>

      {/* Teacher name */}
      <div
        className="text-[10px] truncate mt-0.5"
        style={{ color: text.body }}
      >
        {slot?.teacherName ?? exception?.newTeacherName ?? ''}
      </div>

      {/* Room */}
      {slot?.room && (
        <div
          className="text-[10px] truncate mt-0.5"
          style={{ color: text.muted }}
        >
          {slot.room}
        </div>
      )}

      {/* Exception badge */}
      {(isSubstitution || isExtraClass || isCancelled) && (
        <div
          className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full"
          style={{
            backgroundColor: isCancelled
              ? '#FC5859' // status.danger — small dot, acceptable inline
              : text.heading,
          }}
          title={exception?.reason}
        />
      )}
    </td>
  )
}
