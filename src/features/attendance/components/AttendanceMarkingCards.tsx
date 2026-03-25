import { colors, darken, baseColors } from '@/theme/colors'
import { spacing } from '@/config/spacing'
import { AttendanceStatusSelect } from './AttendanceStatusSelect'
import type { ClassRosterStudent, MarkableAttendanceStatus } from '../types'

interface AttendanceMarkingCardsProps {
  /** Student roster */
  roster: ClassRosterStudent[]
  /** Current entries: studentId → { status, note } */
  entries: Record<string, { status: MarkableAttendanceStatus | undefined; note: string }>
  /** Called when a student's status changes */
  onStatusChange: (studentId: string, status: MarkableAttendanceStatus) => void
  /** Called when a student's note changes */
  onNoteChange: (studentId: string, note: string) => void
  /** Disable all interactions */
  disabled?: boolean
}

/**
 * Mobile/tablet card view for marking attendance.
 * Each student is a card with avatar, name, roll#, status buttons, and optional note input.
 * Responsive: 2 columns on tablet, 1 column on mobile.
 */
export function AttendanceMarkingCards({
  roster,
  entries,
  onStatusChange,
  onNoteChange,
  disabled = false,
}: AttendanceMarkingCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {roster.map(student => {
        const entry = entries[student.id]
        const status = entry?.status
        const note = entry?.note ?? ''
        const showNote = status === 'late' || status === 'absent'

        // Border & background using brand colors: blue (present), pink (late), navy (absent)
        let borderColor = colors.border.default
        let bgColor = colors.background.card
        if (status === 'present') {
          borderColor = darken(baseColors.blue, 15)
          bgColor = colors.accent.soft
        } else if (status === 'late') {
          borderColor = darken(baseColors.pink, 20)
          bgColor = colors.primary.soft
        } else if (status === 'absent') {
          borderColor = colors.text.heading
          bgColor = colors.accent.muted
        }

        return (
          <div
            key={student.id}
            className="rounded-lg border transition-all"
            style={{
              borderColor,
              backgroundColor: bgColor,
              padding: spacing['3'],
            }}
          >
            {/* Header: Avatar + Name + Roll */}
            <div className="flex items-center gap-2.5 mb-2.5">
              {student.avatarUrl ? (
                <img
                  src={student.avatarUrl}
                  alt={student.name}
                  className="w-9 h-9 rounded-full object-cover"
                  style={{ backgroundColor: colors.accent.base }}
                />
              ) : (
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold"
                  style={{
                    backgroundColor: colors.accent.base,
                    color: colors.text.heading,
                  }}
                >
                  {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div
                  className="text-sm font-medium truncate"
                  style={{ color: colors.text.heading }}
                >
                  {student.name}
                </div>
                <div className="text-xs" style={{ color: colors.text.muted }}>
                  Roll #{student.rollNumber}
                </div>
              </div>
            </div>

            {/* Status buttons */}
            <AttendanceStatusSelect
              value={status}
              onChange={s => onStatusChange(student.id, s)}
              disabled={disabled}
            />

            {/* Note input (slides in when Late/Absent) */}
            {showNote && (
              <input
                type="text"
                value={note}
                onChange={e => onNoteChange(student.id, e.target.value)}
                placeholder="Add reason..."
                disabled={disabled}
                className="w-full text-xs rounded-md border px-2.5 py-1.5 mt-2 outline-none"
                style={{
                  borderColor: colors.border.default,
                  color: colors.text.body,
                  backgroundColor: colors.background.card,
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
