/**
 * ReportCardPreview — Theme-aware, print-ready report card for a single student.
 *
 * Reads the selected theme from config.grading.reportCardTheme and applies
 * corresponding styles. Uses HTML tables with inline styles for print fidelity.
 */

import { Printer } from 'lucide-react'
import { text, border, accent, background, baseColors } from '@/theme/colors'
import { spacing } from '@/config/spacing'
import { useSchoolConfig } from '@/config/SchoolConfigContext'
import { ReportCardHeader } from './ReportCardHeader'
import { useGradeCalculator } from '../hooks/use-grade-calculator'
import type { ReportCardTheme } from '@/config/school-config'
import type { GradeSheetRow } from '../types'
import type { StudentAttendanceSummary } from '@/api/services/grade-service'

// ============================================================================
// Theme Styles
// ============================================================================

interface ThemeStyles {
  headerBorder: string
  studentInfoBg: string
  studentInfoBorder: string
  studentInfoRadius: string
  tableHeaderBg: string
  tableHeaderColor: string
  tableBorder: string
  tableCellBorder: string
  tableRowAlt: string | undefined
  footerBg: string
  summaryBorder: string
  summaryBg: string
  signatureLine: string
  sectionTitleStyle: React.CSSProperties
  formalTag: boolean
}

function getThemeStyles(theme: ReportCardTheme): ThemeStyles {
  switch (theme) {
    case 'modern':
      return {
        headerBorder: `3px solid ${accent.base}`,
        studentInfoBg: accent.base,
        studentInfoBorder: 'none',
        studentInfoRadius: '10px',
        tableHeaderBg: accent.base,
        tableHeaderColor: text.heading,
        tableBorder: 'none',
        tableCellBorder: `1px solid ${border.default}`,
        tableRowAlt: '#f9fafb',
        footerBg: accent.base,
        summaryBorder: 'none',
        summaryBg: accent.base,
        signatureLine: `2px dotted ${border.default}`,
        sectionTitleStyle: { fontSize: '13px', fontWeight: 600, color: text.heading, textTransform: 'uppercase' as const, letterSpacing: '0.5px' },
        formalTag: false,
      }
    case 'minimal':
      return {
        headerBorder: `1px solid ${border.default}`,
        studentInfoBg: 'transparent',
        studentInfoBorder: 'none',
        studentInfoRadius: '0',
        tableHeaderBg: 'transparent',
        tableHeaderColor: text.muted,
        tableBorder: 'none',
        tableCellBorder: `1px solid ${border.subtle}`,
        tableRowAlt: undefined,
        footerBg: 'transparent',
        summaryBorder: `1px solid ${border.default}`,
        summaryBg: 'transparent',
        signatureLine: `1px solid ${border.default}`,
        sectionTitleStyle: { fontSize: '12px', fontWeight: 500, color: text.muted, textTransform: 'uppercase' as const, letterSpacing: '1px' },
        formalTag: false,
      }
    case 'formal':
      return {
        headerBorder: `3px double ${text.heading}`,
        studentInfoBg: '#f5f5f5',
        studentInfoBorder: `1px solid ${border.default}`,
        studentInfoRadius: '0',
        tableHeaderBg: text.heading,
        tableHeaderColor: '#ffffff',
        tableBorder: `2px solid ${text.heading}`,
        tableCellBorder: `1px solid ${border.default}`,
        tableRowAlt: undefined,
        footerBg: '#f0f4f8',
        summaryBorder: `2px solid ${text.heading}`,
        summaryBg: '#f0f4f8',
        signatureLine: `2px solid ${text.heading}`,
        sectionTitleStyle: { fontSize: '13px', fontWeight: 700, color: text.heading, textTransform: 'uppercase' as const, letterSpacing: '1.5px', borderBottom: `1px solid ${text.heading}`, paddingBottom: '4px' },
        formalTag: true,
      }
    case 'classic':
    default:
      return {
        headerBorder: `2px solid ${text.heading}`,
        studentInfoBg: accent.base,
        studentInfoBorder: 'none',
        studentInfoRadius: '8px',
        tableHeaderBg: accent.base,
        tableHeaderColor: text.heading,
        tableBorder: `1px solid ${border.default}`,
        tableCellBorder: `1px solid ${border.default}`,
        tableRowAlt: undefined,
        footerBg: accent.base,
        summaryBorder: `1px solid ${border.default}`,
        summaryBg: 'transparent',
        signatureLine: `1px solid ${border.default}`,
        sectionTitleStyle: { fontSize: '13px', fontWeight: 600, color: text.heading, textTransform: 'uppercase' as const, letterSpacing: '0.5px' },
        formalTag: false,
      }
  }
}

// ============================================================================
// Component
// ============================================================================

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
  const { config } = useSchoolConfig()
  const theme = config.grading.reportCardTheme ?? 'classic'
  const ts = getThemeStyles(theme)

  const totalSubjects = subjects.length

  const cellStyle: React.CSSProperties = {
    border: ts.tableCellBorder,
    padding: '8px 12px',
    fontSize: '13px',
    color: text.body,
  }

  const headerCellStyle: React.CSSProperties = {
    ...cellStyle,
    backgroundColor: ts.tableHeaderBg,
    color: ts.tableHeaderColor,
    fontWeight: 600,
    fontSize: '12px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Printable area */}
      <div
        id="report-card-print-area"
        style={{
          flex: 1,
          padding: spacing['6'],
          paddingTop: '48px',
          backgroundColor: background.card,
          fontFamily: 'Inter, system-ui, sans-serif',
          overflow: 'auto',
        }}
      >
        {/* School Header */}
        <div style={{ paddingBottom: '16px', borderBottom: ts.headerBorder, marginBottom: '20px' }}>
          <ReportCardHeader examName={examName} />
          {ts.formalTag && (
            <div style={{ textAlign: 'center', marginTop: '8px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: text.heading, textTransform: 'uppercase', letterSpacing: '3px', border: `1px solid ${text.heading}`, padding: '2px 12px' }}>
                Official Report Card
              </span>
            </div>
          )}
        </div>

        {/* Student Info */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px 24px',
            marginBottom: '20px',
            padding: '12px 16px',
            backgroundColor: ts.studentInfoBg,
            border: ts.studentInfoBorder,
            borderRadius: ts.studentInfoRadius,
          }}
        >
          {[
            { label: 'Student Name', value: gradeRow.studentName },
            { label: 'Class & Section', value: `Class ${classId}` },
            { label: 'Roll Number', value: gradeRow.rollNumber },
            { label: 'Overall Grade', value: `${gradeRow.overallGrade} (${gradeRow.percentage}%)` },
          ].map(item => (
            <div key={item.label}>
              <span style={{ fontSize: '11px', color: text.muted, display: 'block' }}>{item.label}</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: text.heading }}>{item.value}</span>
            </div>
          ))}
        </div>

        {/* Grade Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', border: ts.tableBorder }}>
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
            {subjects.map((sub, idx) => {
              const g = gradeRow.subjects[sub.id]
              const marks = g?.marks
              const gradeLabel = g?.grade ?? '—'
              const gradeResult = marks !== null && marks !== undefined
                ? calculateGrade(marks, maxMarks)
                : null

              const rowBg = ts.tableRowAlt && idx % 2 === 1 ? ts.tableRowAlt : undefined

              return (
                <tr key={sub.id} style={{ backgroundColor: rowBg }}>
                  <td style={{ ...cellStyle, fontWeight: 500 }}>{sub.name}</td>
                  <td style={{ ...cellStyle, textAlign: 'center', fontWeight: 600 }}>{marks ?? '—'}</td>
                  <td style={{ ...cellStyle, textAlign: 'center', color: text.muted }}>{maxMarks}</td>
                  <td style={{ ...cellStyle, textAlign: 'center', fontWeight: 600 }}>{gradeLabel}</td>
                  <td style={{ ...cellStyle, textAlign: 'center' }}>{gradeResult?.points ?? '—'}</td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr style={{ backgroundColor: ts.footerBg }}>
              <td style={{ ...cellStyle, fontWeight: 700, color: text.heading }}>Total</td>
              <td style={{ ...cellStyle, textAlign: 'center', fontWeight: 700, color: text.heading }}>{gradeRow.total}</td>
              <td style={{ ...cellStyle, textAlign: 'center', color: text.muted }}>{maxMarks * totalSubjects}</td>
              <td style={{ ...cellStyle, textAlign: 'center', fontWeight: 700, color: text.heading }}>{gradeRow.overallGrade}</td>
              <td style={{ ...cellStyle, textAlign: 'center', fontWeight: 700, color: text.heading }}>{gradeRow.gpa}</td>
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
            border: ts.summaryBorder,
            borderRadius: '8px',
            backgroundColor: ts.summaryBg,
          }}
        >
          {[
            { label: 'Percentage', value: `${gradeRow.percentage}%` },
            { label: 'GPA', value: String(gradeRow.gpa) },
            { label: 'Result', value: gradeRow.percentage >= 33 ? 'PASS' : 'FAIL' },
          ].map(item => (
            <div key={item.label}>
              <span style={{ fontSize: '11px', color: text.muted, display: 'block' }}>{item.label}</span>
              <span style={{ fontSize: '18px', fontWeight: 700, color: text.heading }}>{item.value}</span>
            </div>
          ))}
        </div>

        {/* Attendance Summary */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ ...ts.sectionTitleStyle, marginBottom: '8px' }}>Attendance</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {[
              { label: 'Total Days', value: attendance.totalDays },
              { label: 'Present', value: attendance.present },
              { label: 'Late', value: attendance.late },
              { label: 'Absent', value: attendance.absent },
            ].map(stat => (
              <div
                key={stat.label}
                style={{ padding: '8px 12px', border: `1px solid ${border.default}`, borderRadius: '6px', textAlign: 'center' }}
              >
                <div style={{ fontSize: '11px', color: text.muted }}>{stat.label}</div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: text.heading }}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Remarks & Signatures */}
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ ...ts.sectionTitleStyle, marginBottom: '12px' }}>Remarks & Signatures</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <span style={{ fontSize: '12px', color: text.muted }}>Class Teacher's Remarks:</span>
              <div style={{ borderBottom: ts.signatureLine, marginTop: '20px' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
              {['Class Teacher', 'Principal', 'Parent / Guardian'].map(role => (
                <div key={role} style={{ textAlign: 'center' }}>
                  <div style={{ borderBottom: ts.signatureLine, width: '160px', marginBottom: '4px' }} />
                  <span style={{ fontSize: '11px', color: text.muted }}>{role}</span>
                </div>
              ))}
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
          style={{ backgroundColor: text.heading, color: background.card }}
        >
          <Printer className="w-4 h-4" />
          Print Report Card
        </button>
      </div>
    </div>
  )
}
