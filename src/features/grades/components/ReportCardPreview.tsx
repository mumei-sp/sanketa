/**
 * ReportCardPreview — Print-ready report card for a single student.
 *
 * Uses HTML tables with inline styles for reliable print output.
 * Wrapped in a Sheet overlay on the page — the print CSS isolates
 * #report-card-print-area for clean printing.
 */

import { Printer } from 'lucide-react'
import { text, border, accent, background } from '@/theme/colors'
import { spacing } from '@/config/spacing'
import { ReportCardHeader } from './ReportCardHeader'
import { useGradeCalculator } from '../hooks/use-grade-calculator'
import type { GradeSheetRow } from '../types'
import type { StudentAttendanceSummary } from '@/api/services/grade-service'

interface ReportCardPreviewProps {
  gradeRow: GradeSheetRow
  subjects: { id: string; name: string; shortName: string }[]
  classId: string
  examName: string
  maxMarks: number
  attendance: StudentAttendanceSummary
  onPrint: () => void
}

export function ReportCardPreview({
  gradeRow,
  subjects,
  classId,
  examName,
  maxMarks,
  attendance,
  onPrint,
}: ReportCardPreviewProps) {
  const { calculateGrade } = useGradeCalculator()

  const cellStyle: React.CSSProperties = {
    border: `1px solid ${border.default}`,
    padding: '8px 12px',
    fontSize: '13px',
    color: text.body,
  }

  const headerCellStyle: React.CSSProperties = {
    ...cellStyle,
    backgroundColor: accent.base,
    color: text.heading,
    fontWeight: 600,
    fontSize: '12px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  }

  const totalSubjects = subjects.length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Printable area */}
      <div
        id="report-card-print-area"
        style={{
          flex: 1,
          padding: spacing['6'],
          backgroundColor: background.card,
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        {/* School Header */}
        <ReportCardHeader examName={examName} />

        {/* Student Info */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px 24px',
            marginBottom: '20px',
            padding: '12px 16px',
            backgroundColor: accent.base,
            borderRadius: '8px',
          }}
        >
          <div>
            <span style={{ fontSize: '11px', color: text.muted, display: 'block' }}>Student Name</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: text.heading }}>{gradeRow.studentName}</span>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: text.muted, display: 'block' }}>Class & Section</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: text.heading }}>Class {classId}</span>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: text.muted, display: 'block' }}>Roll Number</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: text.heading }}>{gradeRow.rollNumber}</span>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: text.muted, display: 'block' }}>Overall Grade</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: text.heading }}>{gradeRow.overallGrade} ({gradeRow.percentage}%)</span>
          </div>
        </div>

        {/* Grade Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
          <thead>
            <tr>
              <th style={{ ...headerCellStyle, textAlign: 'left' }}>Subject</th>
              <th style={{ ...headerCellStyle, textAlign: 'center' }}>Marks</th>
              <th style={{ ...headerCellStyle, textAlign: 'center' }}>Max</th>
              <th style={{ ...headerCellStyle, textAlign: 'center' }}>Grade</th>
              <th style={{ ...headerCellStyle, textAlign: 'center' }}>Points</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map(sub => {
              const g = gradeRow.subjects[sub.id]
              const marks = g?.marks
              const gradeLabel = g?.grade ?? '—'
              const gradeResult = marks !== null && marks !== undefined
                ? calculateGrade(marks, maxMarks)
                : null

              return (
                <tr key={sub.id}>
                  <td style={{ ...cellStyle, fontWeight: 500 }}>{sub.name}</td>
                  <td style={{ ...cellStyle, textAlign: 'center', fontWeight: 600 }}>
                    {marks ?? '—'}
                  </td>
                  <td style={{ ...cellStyle, textAlign: 'center', color: text.muted }}>
                    {maxMarks}
                  </td>
                  <td style={{ ...cellStyle, textAlign: 'center', fontWeight: 600 }}>
                    {gradeLabel}
                  </td>
                  <td style={{ ...cellStyle, textAlign: 'center' }}>
                    {gradeResult?.points ?? '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr style={{ backgroundColor: accent.base }}>
              <td style={{ ...cellStyle, fontWeight: 700, color: text.heading }}>Total</td>
              <td style={{ ...cellStyle, textAlign: 'center', fontWeight: 700, color: text.heading }}>
                {gradeRow.total}
              </td>
              <td style={{ ...cellStyle, textAlign: 'center', color: text.muted }}>
                {maxMarks * totalSubjects}
              </td>
              <td style={{ ...cellStyle, textAlign: 'center', fontWeight: 700, color: text.heading }}>
                {gradeRow.overallGrade}
              </td>
              <td style={{ ...cellStyle, textAlign: 'center', fontWeight: 700, color: text.heading }}>
                {gradeRow.gpa}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Percentage & GPA Summary */}
        <div
          style={{
            display: 'flex',
            gap: '24px',
            marginBottom: '20px',
            padding: '12px 16px',
            border: `1px solid ${border.default}`,
            borderRadius: '8px',
          }}
        >
          <div>
            <span style={{ fontSize: '11px', color: text.muted, display: 'block' }}>Percentage</span>
            <span style={{ fontSize: '18px', fontWeight: 700, color: text.heading }}>{gradeRow.percentage}%</span>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: text.muted, display: 'block' }}>GPA</span>
            <span style={{ fontSize: '18px', fontWeight: 700, color: text.heading }}>{gradeRow.gpa}</span>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: text.muted, display: 'block' }}>Result</span>
            <span style={{ fontSize: '18px', fontWeight: 700, color: text.heading }}>
              {gradeRow.percentage >= 33 ? 'PASS' : 'FAIL'}
            </span>
          </div>
        </div>

        {/* Attendance Summary */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: text.heading, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Attendance
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px',
            }}
          >
            {[
              { label: 'Total Days', value: attendance.totalDays },
              { label: 'Present', value: attendance.present },
              { label: 'Late', value: attendance.late },
              { label: 'Absent', value: attendance.absent },
            ].map(stat => (
              <div
                key={stat.label}
                style={{
                  padding: '8px 12px',
                  border: `1px solid ${border.default}`,
                  borderRadius: '6px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '11px', color: text.muted }}>{stat.label}</div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: text.heading }}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Remarks & Signatures */}
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: text.heading, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Remarks & Signatures
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <span style={{ fontSize: '12px', color: text.muted }}>Class Teacher's Remarks:</span>
              <div style={{ borderBottom: `1px solid ${border.default}`, marginTop: '20px' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ borderBottom: `1px solid ${border.default}`, width: '160px', marginBottom: '4px' }} />
                <span style={{ fontSize: '11px', color: text.muted }}>Class Teacher</span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ borderBottom: `1px solid ${border.default}`, width: '160px', marginBottom: '4px' }} />
                <span style={{ fontSize: '11px', color: text.muted }}>Principal</span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ borderBottom: `1px solid ${border.default}`, width: '160px', marginBottom: '4px' }} />
                <span style={{ fontSize: '11px', color: text.muted }}>Parent / Guardian</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print button — hidden in print */}
      <div
        className="no-print"
        style={{
          padding: `${spacing['3']} ${spacing['6']}`,
          borderTop: `1px solid ${border.default}`,
          backgroundColor: background.card,
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        <button
          type="button"
          onClick={onPrint}
          className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-opacity cursor-pointer"
          style={{
            backgroundColor: text.heading,
            color: background.card,
          }}
        >
          <Printer className="w-4 h-4" />
          Print Report Card
        </button>
      </div>
    </div>
  )
}
