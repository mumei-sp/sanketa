import { Pencil, AlertTriangle } from 'lucide-react'
import { colors } from '@/theme/colors'
import { spacing } from '@/config/spacing'
import type { AttendanceHistoryRow } from '../types'

interface AttendanceHistoryTableProps {
  /** History rows (most recent first) */
  rows: AttendanceHistoryRow[]
  /** Loading state */
  isLoading: boolean
  /** Called when user clicks Edit on a submitted row */
  onEdit: (date: string) => void
  /** Called when user clicks Mark on an unsubmitted row */
  onMark: (date: string) => void
}

/** Format a YYYY-MM-DD date for display */
function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

/** Format ISO timestamp to time */
function formatTime(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

/**
 * Table showing attendance history for a class in a month.
 * Each row is a weekday with present/late/absent counts, submitter info, and edit/mark action.
 */
export function AttendanceHistoryTable({
  rows,
  isLoading,
  onEdit,
  onMark,
}: AttendanceHistoryTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-sm" style={{ color: colors.text.muted }}>Loading history...</span>
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-sm" style={{ color: colors.text.muted }}>No records for this month</span>
      </div>
    )
  }

  const headers = ['Date', 'Present', 'Late', 'Absent', 'Marked By', 'Action']

  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{ borderColor: colors.border.default }}
    >
      <table className="w-full">
        <thead>
          <tr style={{ backgroundColor: colors.background.tableHeader }}>
            {headers.map(h => (
              <th
                key={h}
                className="text-left text-xs font-semibold"
                style={{
                  color: colors.text.muted,
                  padding: `${spacing['2.5']} ${spacing['3']}`,
                  borderBottom: `1px solid ${colors.border.default}`,
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={row.date}
              style={{
                backgroundColor: row.isSubmitted ? 'transparent' : colors.status.warning.soft,
                borderBottom: idx < rows.length - 1 ? `1px solid ${colors.border.subtle}` : undefined,
              }}
            >
              {/* Date */}
              <td
                className="text-sm font-medium"
                style={{ color: colors.text.heading, padding: `${spacing['2.5']} ${spacing['3']}` }}
              >
                {formatDate(row.date)}
              </td>

              {/* Present */}
              <td className="text-sm" style={{ padding: `${spacing['2.5']} ${spacing['3']}` }}>
                {row.isSubmitted ? (
                  <span style={{ color: colors.status.success.base }}>{row.present}</span>
                ) : (
                  <span style={{ color: colors.text.muted }}>—</span>
                )}
              </td>

              {/* Late */}
              <td className="text-sm" style={{ padding: `${spacing['2.5']} ${spacing['3']}` }}>
                {row.isSubmitted ? (
                  <span style={{ color: colors.status.warning.base }}>{row.late}</span>
                ) : (
                  <span style={{ color: colors.text.muted }}>—</span>
                )}
              </td>

              {/* Absent */}
              <td className="text-sm" style={{ padding: `${spacing['2.5']} ${spacing['3']}` }}>
                {row.isSubmitted ? (
                  <span style={{ color: colors.status.danger.base }}>{row.absent}</span>
                ) : (
                  <span style={{ color: colors.text.muted }}>—</span>
                )}
              </td>

              {/* Marked By */}
              <td className="text-sm" style={{ padding: `${spacing['2.5']} ${spacing['3']}` }}>
                {row.isSubmitted ? (
                  <div>
                    <span style={{ color: colors.text.body }}>{row.submittedBy}</span>
                    {row.submittedAt && (
                      <span className="text-xs ml-1" style={{ color: colors.text.muted }}>
                        ({formatTime(row.submittedAt)})
                      </span>
                    )}
                  </div>
                ) : (
                  <span style={{ color: colors.text.muted }}>—</span>
                )}
              </td>

              {/* Action */}
              <td style={{ padding: `${spacing['2.5']} ${spacing['3']}` }}>
                {row.isSubmitted ? (
                  <button
                    type="button"
                    onClick={() => onEdit(row.date)}
                    className="flex items-center gap-1 text-xs font-medium rounded-md px-2.5 py-1 border transition-colors hover:opacity-80"
                    style={{
                      color: colors.text.heading,
                      borderColor: colors.border.default,
                      backgroundColor: colors.background.card,
                    }}
                  >
                    <Pencil className="w-3 h-3" />
                    Edit
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onMark(row.date)}
                    className="flex items-center gap-1 text-xs font-medium rounded-md px-2.5 py-1 transition-colors hover:opacity-80"
                    style={{
                      color: colors.status.warning.text,
                      backgroundColor: colors.status.warning.soft,
                      border: `1px solid ${colors.status.warning.base}`,
                    }}
                  >
                    <AlertTriangle className="w-3 h-3" />
                    Mark
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
