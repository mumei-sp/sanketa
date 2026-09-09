/**
 * A family's attendance view.
 *
 * The staff attendance screens are a register to fill in and a class overview.
 * Neither is what a parent wants, and both filtered to one child are stranger
 * than useful — a register with a single row invites you to mark it. This is
 * the child's own record, month by month, read only.
 */

import * as React from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { Skeleton } from '@/components/ui/skeleton'
import { border, text } from '@/theme/colors'
import { StudentAttendanceCalendar } from '@/features/students/components/StudentAttendanceCalendar'
import { fetchStudentDetailData } from '@/api/services/student-service'
import { getDisplayName } from '@/features/students/utils/formatting'
import { useFamilyScope } from '../FamilyScopeContext'
import { ChildSwitcher } from '../components/ChildSwitcher'
import type { StudentDetailData } from '@/features/students/types'
import { attendanceMonthKey } from '@/utils/academic-date'

export function FamilyAttendance() {
  const { selected, isLoading } = useFamilyScope()
  const [detail, setDetail] = React.useState<StudentDetailData | null>(null)

  const now = new Date()
  const [year, setYear] = React.useState(now.getFullYear())
  const [month, setMonth] = React.useState(now.getMonth())

  const studentId = selected ? String(selected.id) : null

  React.useEffect(() => {
    if (!studentId) return
    setDetail(null)
    fetchStudentDetailData(studentId)
      .then(setDetail)
      .catch(error => console.error('Failed to load attendance', error))
  }, [studentId])

  const record = detail?.monthlyAttendance[attendanceMonthKey(year, month)]

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Attendance"
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Attendance' }]}
      />

      <ChildSwitcher />

      {isLoading || (studentId && !detail) ? (
        <Skeleton className="h-72 w-full rounded-xl" />
      ) : !selected ? (
        <p
          className="rounded-xl border border-dashed p-8 text-center text-body-muted"
          style={{ borderColor: border.default }}
        >
          This account is not linked to a student yet.
        </p>
      ) : (
        <div
          className="rounded-xl border p-4"
          style={{ borderColor: border.default, backgroundColor: 'var(--card)' }}
        >
          <p className="text-body-muted mb-3" style={{ color: text.muted }}>
            {getDisplayName(selected)}&rsquo;s record. Only registers the school has submitted
            appear here, so a correction made during the day does not reach you as an absence.
          </p>
          <StudentAttendanceCalendar
            year={year}
            month={month}
            highlights={record?.highlights ?? []}
            summary={record?.summary}
            onMonthChange={(nextYear, nextMonth) => {
              setYear(nextYear)
              setMonth(nextMonth)
            }}
          />
          {!record && (
            <p className="mt-3 text-caption" style={{ color: text.muted }}>
              Nothing recorded for this month.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
