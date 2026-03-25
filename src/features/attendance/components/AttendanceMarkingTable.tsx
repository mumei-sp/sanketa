import { colors } from '@/theme/colors'
import { spacing } from '@/config/spacing'
import { AttendanceStatusSelect } from './AttendanceStatusSelect'
import type { ClassRosterStudent, MarkableAttendanceStatus } from '../types'

interface AttendanceMarkingTableProps {
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
 * Desktop table view for marking attendance.
 * Columns: #, Student (avatar + name), Roll #, Status (P/L/A buttons), Note (input).
 * Note field only appears when status is 'late' or 'absent'.
 */
export function AttendanceMarkingTable({
  roster,
  entries,
  onStatusChange,
  onNoteChange,
  disabled = false,
}: AttendanceMarkingTableProps) {
  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{ borderColor: colors.border.default }}
    >
      <table className="w-full">
        {/* Header */}
        <thead>
          <tr style={{ backgroundColor: colors.background.tableHeader }}>
            {['#', 'Student', 'Roll #', 'Status', 'Note'].map(header => (
              <th
                key={header}
                className="text-left text-xs font-semibold"
                style={{
                  color: colors.text.muted,
                  padding: `${spacing['2.5']} ${spacing['3']}`,
                  borderBottom: `1px solid ${colors.border.default}`,
                }}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {roster.map((student, idx) => {
            const entry = entries[student.id]
            const status = entry?.status
            const note = entry?.note ?? ''
            const showNote = status === 'late' || status === 'absent'

            // Row background tint based on status
            let rowBg = 'transparent'
            if (status === 'present') rowBg = colors.status.success.soft
            else if (status === 'late') rowBg = colors.status.warning.soft
            else if (status === 'absent') rowBg = colors.status.danger.soft

            return (
              <tr
                key={student.id}
                style={{
                  backgroundColor: rowBg,
                  borderBottom: idx < roster.length - 1 ? `1px solid ${colors.border.subtle}` : undefined,
                  transition: 'background-color 0.15s ease',
                }}
              >
                {/* # */}
                <td
                  className="text-sm"
                  style={{
                    color: colors.text.muted,
                    padding: `${spacing['2']} ${spacing['3']}`,
                    width: '40px',
                  }}
                >
                  {idx + 1}
                </td>

                {/* Student */}
                <td style={{ padding: `${spacing['2']} ${spacing['3']}` }}>
                  <div className="flex items-center gap-2.5">
                    {student.avatarUrl ? (
                      <img
                        src={student.avatarUrl}
                        alt={student.name}
                        className="w-8 h-8 rounded-full object-cover"
                        style={{ backgroundColor: colors.accent.base }}
                      />
                    ) : (
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                        style={{
                          backgroundColor: colors.accent.base,
                          color: colors.text.heading,
                        }}
                      >
                        {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                    )}
                    <span
                      className="text-sm font-medium"
                      style={{ color: colors.text.heading }}
                    >
                      {student.name}
                    </span>
                  </div>
                </td>

                {/* Roll # */}
                <td
                  className="text-sm"
                  style={{
                    color: colors.text.muted,
                    padding: `${spacing['2']} ${spacing['3']}`,
                    width: '80px',
                  }}
                >
                  {student.rollNumber}
                </td>

                {/* Status */}
                <td style={{ padding: `${spacing['2']} ${spacing['3']}`, width: '160px' }}>
                  <AttendanceStatusSelect
                    value={status}
                    onChange={s => onStatusChange(student.id, s)}
                    disabled={disabled}
                  />
                </td>

                {/* Note */}
                <td style={{ padding: `${spacing['2']} ${spacing['3']}` }}>
                  {showNote ? (
                    <input
                      type="text"
                      value={note}
                      onChange={e => onNoteChange(student.id, e.target.value)}
                      placeholder="Add reason..."
                      disabled={disabled}
                      className="w-full text-sm rounded-md border px-2.5 py-1.5 outline-none transition-colors focus:ring-1"
                      style={{
                        borderColor: colors.border.default,
                        color: colors.text.body,
                        backgroundColor: colors.background.card,
                      }}
                    />
                  ) : (
                    <span className="text-xs" style={{ color: colors.text.muted }}>—</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
