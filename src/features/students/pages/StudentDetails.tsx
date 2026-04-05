import * as React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { DetailPageLayout } from '@/components/ui/detail-page-layout'
import { spacing } from '@/config/spacing'
import { useStudentById } from '@/features/students/hooks/use-student-by-id'
import { useStudentDetailData } from '@/features/students/hooks/use-student-detail-data'
import { getDisplayName } from '@/features/students/utils/formatting'
import { getStudentBreadcrumbs } from '../utils/breadcrumbs'
import { STUDENT_MESSAGES } from '../constants'

import { StudentProfileCard } from '../components/StudentProfileCard'
import { StudentDocuments } from '../components/StudentDocuments'
import { StudentAttendanceCalendar } from '../components/StudentAttendanceCalendar'
import { StudentScholarships } from '../components/StudentScholarships'
import { StudentHealthInfo } from '../components/StudentHealthInfo'
import { AcademicPerformance } from '../components/AcademicPerformance'
import { StudentExtracurricular } from '../components/StudentExtracurricular'
import { StudentBehaviorLog } from '../components/StudentBehaviorLog'

/**
 * StudentDetails page component
 * Displays comprehensive student information in a 3-column layout (desktop),
 * 2-column (tablet), or single column (mobile).
 */
export default function StudentDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { student, isLoading, error } = useStudentById(id)
  const { detailData } = useStudentDetailData(id)

  const [calYear, setCalYear] = React.useState(() => new Date().getFullYear())
  const [calMonth, setCalMonth] = React.useState(() => new Date().getMonth())

  const handleBack = React.useCallback(() => {
    navigate('/students')
  }, [navigate])

  const handleMonthChange = React.useCallback((year: number, month: number) => {
    setCalYear(year)
    setCalMonth(month)
  }, [])

  // Get attendance data for the currently displayed month
  const monthKey = `${calYear}-${calMonth}`
  const currentAttendance = detailData?.monthlyAttendance[monthKey]
  const calendarHighlights = currentAttendance?.highlights ?? []
  const attendanceSummary = currentAttendance?.summary

  const displayName = student ? getDisplayName(student) : 'Student Details'
  const breadcrumbs = React.useMemo(
    () => getStudentBreadcrumbs('details', displayName),
    [displayName],
  )

  return (
    <DetailPageLayout
      title="Student Details"
      breadcrumbs={breadcrumbs}
      showBackButton
      isLoading={isLoading}
      error={error || (!student && !isLoading ? STUDENT_MESSAGES.NOT_FOUND : null)}
      errorActionLabel={STUDENT_MESSAGES.BACK_TO_STUDENTS}
      onErrorAction={handleBack}
      loadingMessage={STUDENT_MESSAGES.LOADING_DETAILS}
    >
      {student && (
        <div
          className="grid grid-cols-1 md:grid-cols-[280px_1fr] xl:grid-cols-[25%_25%_1fr]"
          style={{ gap: spacing['4'] }}
        >
          {/* ═══ LEFT COLUMN ═══ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['4'] }}>
            <StudentProfileCard student={student} />
            {detailData?.documents && detailData.documents.length > 0 && (
              <StudentDocuments documents={detailData.documents} />
            )}
          </div>

          {/* ═══ MIDDLE COLUMN ═══ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['4'] }}>
            <StudentAttendanceCalendar
              year={2035}
              month={2}
              highlights={calendarHighlights}
              summary={attendanceSummary}
              today={calYear === 2035 && calMonth === 2 ? 2 : undefined}
              onMonthChange={handleMonthChange}
            />
            {detailData?.scholarships && detailData.scholarships.length > 0 && (
              <StudentScholarships scholarships={detailData.scholarships} />
            )}
            {detailData?.healthRecords && detailData.healthRecords.length > 0 && (
              <StudentHealthInfo records={detailData.healthRecords} />
            )}
          </div>

          {/* ═══ RIGHT COLUMN ═══ */}
          <div
            className="md:col-span-2 xl:col-span-1"
            style={{ display: 'flex', flexDirection: 'column', gap: spacing['4'] }}
          >
            <AcademicPerformance
              averageScore={student.gpa}
              maxScore={4}
              studentName={getDisplayName(student)}
            />
            {detailData?.extracurriculars && detailData.extracurriculars.length > 0 && (
              <StudentExtracurricular activities={detailData.extracurriculars} />
            )}
            {detailData?.behaviorLog && detailData.behaviorLog.length > 0 && (
              <StudentBehaviorLog entries={detailData.behaviorLog} />
            )}
          </div>
        </div>
      )}
    </DetailPageLayout>
  )
}
