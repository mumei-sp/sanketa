import { colors } from '@/theme/colors'
import { StudentAvatar } from '@/components/shared/StudentAvatar'
import { MobileCardItem } from '@/components/shared/MobileCardItem'
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

        // Border & background using brand colors: blue (present), pink (late),
        // navy (absent). Each fill is a wash of that status' own colour —
        // absent previously used a flat grey, which read as disabled rather
        // than marked.
        let borderColor: string = colors.border.default
        let bgColor: string = colors.background.card
        if (status === 'present') {
          borderColor = 'color-mix(in srgb, var(--accent) 85%, black)'
          bgColor = colors.accent.soft
        } else if (status === 'late') {
          borderColor = 'color-mix(in srgb, var(--primary) 80%, black)'
          bgColor = colors.primary.soft
        } else if (status === 'absent') {
          borderColor = 'var(--heading)'
          bgColor = 'color-mix(in srgb, var(--heading) 7%, var(--card))'
        }

        return (
          <MobileCardItem
            key={student.id}
            borderColor={borderColor}
            bgColor={bgColor}
            className="transition-all"
          >
            {/* Header: avatar + name/roll on the left, an "Unmarked" nudge on
                the right. The chip disappears once a status is chosen, so what
                is still outstanding stays scannable down the list. */}
            <div className="flex items-center gap-2.5 mb-2.5">
              <StudentAvatar name={student.name} avatarUrl={student.avatarUrl} />
              <div className="flex-1 min-w-0">
                <div
                  className="text-sm font-medium truncate"
                  style={{ color: 'var(--heading)' }}
                >
                  {student.name}
                </div>
                <div className="text-xs" style={{ color: colors.text.muted }}>
                  Roll #{student.rollNumber}
                </div>
              </div>
              {!status && (
                <span
                  className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium"
                  style={{ backgroundColor: colors.border.subtle, color: colors.text.muted }}
                >
                  Unmarked
                </span>
              )}
            </div>

            {/* Status buttons */}
            <AttendanceStatusSelect
              value={status}
              onChange={s => onStatusChange(student.id, s)}
              disabled={disabled}
              layout="card"
            />

            {/* Note input (slides in when Late/Absent) */}
            {showNote && (
              <input
                type="text"
                value={note}
                onChange={e => onNoteChange(student.id, e.target.value)}
                placeholder="Add a reason…"
                disabled={disabled}
                aria-label={`Reason for ${student.name}`}
                className="h-control mt-2 w-full rounded-md border px-3 text-xs outline-none focus-visible:border-ring"
                style={{
                  borderColor: colors.border.default,
                  color: colors.text.body,
                  backgroundColor: colors.background.card,
                }}
              />
            )}
          </MobileCardItem>
        )
      })}
    </div>
  )
}
