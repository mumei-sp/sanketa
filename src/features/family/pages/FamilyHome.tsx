/**
 * What a family sees instead of the school dashboard.
 *
 * The staff dashboard answers "how is the school doing" — enrolment, earnings,
 * gender split, collection rates. Filtered to one student it answers nothing,
 * and the numbers that survive are meaningless at that size. So this is a
 * different page rather than the same one narrowed: attendance, recent marks,
 * and what the school has put on the notice board.
 */

import * as React from 'react'
import { CalendarCheck, GraduationCap, Clock } from 'lucide-react'
import PageHeader from '@/components/layout/PageHeader'
import { Skeleton } from '@/components/ui/skeleton'
import { border, text } from '@/theme/colors'
import { useCurrentUser } from '@/hooks/use-current-user'
import { getTimeOfDayGreeting, formatFriendlyDate } from '@/utils/date'
import { getDisplayName } from '@/features/students/utils/formatting'
import { classSectionOf, rollNumberOf } from '@/utils/class-section-helpers'
import { fetchStudentDetailData } from '@/api/services/student-service'
import { fetchNoticeBoardEntries } from '@/api/services/notice-board-service'
import { useFamilyScope } from '../FamilyScopeContext'
import { ChildSwitcher } from '../components/ChildSwitcher'
import type { StudentDetailData } from '@/features/students/types'
import type { NoticeBoardEntry } from '@/features/notice-board/types'
import { attendanceMonthKey } from '@/utils/academic-date'

/** One number, said plainly. */
function Figure({
  icon: Icon,
  value,
  label,
  hint,
}: {
  icon: typeof CalendarCheck
  value: React.ReactNode
  label: string
  hint?: string
}) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl border p-4"
      style={{ borderColor: border.default, backgroundColor: 'var(--card)' }}
    >
      <span
        aria-hidden
        className="flex size-10 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: 'var(--muted)' }}
      >
        <Icon className="size-5" style={{ color: 'var(--heading)' }} />
      </span>
      <span className="min-w-0">
        <span
          className="block text-xl font-semibold leading-none tabular-nums"
          style={{ color: 'var(--heading)' }}
        >
          {value}
        </span>
        <span className="block text-caption" style={{ color: text.muted }}>
          {label}
        </span>
        {hint && (
          <span className="block text-caption" style={{ color: text.muted, opacity: 0.75 }}>
            {hint}
          </span>
        )}
      </span>
    </div>
  )
}

export function FamilyHome() {
  const currentUser = useCurrentUser()
  const { selected, isLoading, children } = useFamilyScope()
  const [detail, setDetail] = React.useState<StudentDetailData | null>(null)
  const [notices, setNotices] = React.useState<NoticeBoardEntry[]>([])

  const studentId = selected ? String(selected.id) : null

  React.useEffect(() => {
    if (!studentId) return
    setDetail(null)
    fetchStudentDetailData(studentId)
      .then(setDetail)
      .catch(error => console.error('Failed to load the record', error))
  }, [studentId])

  React.useEffect(() => {
    fetchNoticeBoardEntries()
      .then(rows => setNotices(rows.filter(row => row.status === 'Active').slice(0, 4)))
      .catch(error => console.error('Failed to load notices', error))
  }, [])

  /**
   * This month's attendance, which is the figure a parent actually checks.
   *
   * Read by this month's key rather than by taking the last one on file. The
   * keys are `2026-8` — zero-indexed and unpadded — so sorting them as strings
   * puts October before September, and a tile labelled "this month" would have
   * quietly shown last month's number for two months of every year.
   */
  const attendance = React.useMemo(() => {
    if (!detail) return null
    const now = new Date()
    return detail.monthlyAttendance[attendanceMonthKey(now.getFullYear(), now.getMonth())]?.summary ?? null
  }, [detail])

  const roll = rollNumberOf(selected?.rollNumber)

  const attended = attendance ? attendance.present + attendance.late : 0
  const total = attendance
    ? attendance.present + attendance.late + attendance.absent + attendance.sick
    : 0

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={`${getTimeOfDayGreeting()}, ${currentUser?.fullName?.split(' ')[0] ?? ''}`.trim()}
        breadcrumbs={[{ label: formatFriendlyDate() }]}
      />

      <ChildSwitcher />

      {isLoading ? (
        <Skeleton className="h-24 w-full rounded-xl" />
      ) : !selected ? (
        <p
          className="rounded-xl border border-dashed p-8 text-center text-body-muted"
          style={{ borderColor: border.default }}
        >
          {children.length === 0
            ? 'This account is not linked to a student yet. The school office can do that.'
            : 'Choose a child to see their records.'}
        </p>
      ) : (
        <>
          <div
            className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-xl border p-4"
            style={{ borderColor: border.default, backgroundColor: 'var(--card)' }}
          >
            <span className="text-section-title" style={{ color: 'var(--heading)' }}>
              {getDisplayName(selected)}
            </span>
            <span className="text-body-muted" style={{ color: text.muted }}>
              {classSectionOf(selected) ?? 'No class'}
              {roll ? ` · Roll ${roll}` : ''}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Figure
              icon={CalendarCheck}
              value={total > 0 ? `${Math.round((attended / total) * 100)}%` : '—'}
              label="Attendance this month"
              hint={total > 0 ? `${attended} of ${total} days` : 'Nothing recorded yet'}
            />
            <Figure
              icon={Clock}
              value={attendance?.late ?? '—'}
              label="Late arrivals"
              hint="This month"
            />
            <Figure
              icon={GraduationCap}
              value={attendance ? attendance.absent + attendance.sick : '—'}
              label="Days missed"
              hint="Absent or unwell"
            />
          </div>

          {notices.length > 0 && (
            <div
              className="rounded-xl border p-4"
              style={{ borderColor: border.default, backgroundColor: 'var(--card)' }}
            >
              <h3 className="text-section-title mb-3" style={{ color: 'var(--heading)' }}>
                From the school
              </h3>
              <ul className="flex flex-col gap-3">
                {notices.map(notice => (
                  <li key={notice.id} className="border-t pt-3 first:border-0 first:pt-0"
                      style={{ borderColor: border.default }}>
                    <p className="text-body font-medium" style={{ color: 'var(--heading)' }}>
                      {notice.title}
                    </p>
                    <p className="text-caption" style={{ color: text.muted }}>
                      {notice.audience} &middot; {notice.postDate}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  )
}
