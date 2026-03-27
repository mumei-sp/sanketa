/**
 * ReportCardHeader — School header for the printed report card.
 *
 * Renders school logo, name, academic year, and exam name.
 * Uses inline styles throughout for print fidelity.
 */

import { GraduationCap } from 'lucide-react'
import { useSchoolConfig } from '@/config/SchoolConfigContext'
import { text, border } from '@/theme/colors'
import { MONTH_LABELS } from '@/config/school-config'

interface ReportCardHeaderProps {
  examName: string
}

export function ReportCardHeader({ examName }: ReportCardHeaderProps) {
  const { config } = useSchoolConfig()

  // Derive academic year label
  const startMonth = config.academicYearStartMonth
  const startYear = 2035 // mock year
  const endYear = startMonth >= 1 ? startYear + 1 : startYear
  const academicYear = `Academic Year ${startYear}–${String(endYear).slice(2)}`

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        paddingBottom: '16px',
        borderBottom: `2px solid ${text.heading}`,
        marginBottom: '20px',
      }}
    >
      {/* Logo */}
      {config.schoolLogo ? (
        <img
          src={config.schoolLogo}
          alt={config.schoolName}
          style={{ width: '56px', height: '56px', objectFit: 'contain', borderRadius: '8px' }}
        />
      ) : (
        <div
          style={{
            width: '56px',
            height: '56px',
            minWidth: '56px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: border.subtle,
          }}
        >
          <GraduationCap style={{ width: '28px', height: '28px', color: text.heading }} />
        </div>
      )}

      {/* School info */}
      <div style={{ flex: 1 }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: text.heading, margin: 0, lineHeight: 1.3 }}>
          {config.schoolName}
        </h1>
        <p style={{ fontSize: '12px', color: text.muted, margin: '2px 0 0' }}>
          {academicYear}
        </p>
      </div>

      {/* Exam name */}
      <div style={{ textAlign: 'right' }}>
        <p style={{ fontSize: '14px', fontWeight: 600, color: text.heading, margin: 0 }}>
          {examName}
        </p>
        <p style={{ fontSize: '11px', color: text.muted, margin: '2px 0 0' }}>
          Report Card
        </p>
      </div>
    </div>
  )
}
