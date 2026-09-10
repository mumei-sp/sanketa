import * as React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MiniCalendar } from '@/components/ui/mini-calendar'
import { DetailPageLayout } from '@/components/ui/detail-page-layout'
import { spacing } from '@/config/spacing'
import { fontSizes } from '@/config/typography'
import { text, border, background } from '@/theme/colors'
import { AttendanceSummaryBadges } from '@/components/ui/attendance-summary-badges'
import { attendanceMonthKey } from '@/utils/academic-date'
import { useTeacherById } from '../hooks/use-teacher-by-id'
import { getDisplayName } from '../utils/formatting'
import { getTeacherBreadcrumbs } from '../utils/breadcrumbs'
import { TeacherProfileCard } from '../components/TeacherProfileCard'
import { TeacherPersonalInfo } from '../components/TeacherPersonalInfo'
import { TeacherDocuments } from '../components/TeacherDocuments'
import { TeacherWorkloadChart } from '../components/TeacherWorkloadChart'
import { TeacherSchedule } from '../components/TeacherSchedule'
import { TeacherDevelopmentTraining } from '../components/TeacherDevelopmentTraining'
import { TeacherPerformance } from '../components/TeacherPerformance'

/**
 * TeacherDetails page
 * Displays comprehensive teacher information in a 3-column layout (desktop),
 * 2-column (tablet), or single column (mobile).
 */
export default function TeacherDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { teacher, isLoading, error } = useTeacherById(id)

  const [calYear, setCalYear] = React.useState(() => new Date().getFullYear())
  const [calMonth, setCalMonth] = React.useState(() => new Date().getMonth())

  const handleBack = React.useCallback(() => {
    navigate('/teachers')
  }, [navigate])

  const handleMonthChange = React.useCallback((year: number, month: number) => {
    setCalYear(year)
    setCalMonth(month)
  }, [])

  // Get attendance data for the currently displayed month
  const monthKey = attendanceMonthKey(calYear, calMonth)
  const currentAttendance = teacher?.monthlyAttendance?.[monthKey]
  const calendarHighlights = currentAttendance?.highlights ?? []
  const attendanceSummary = currentAttendance?.summary

  const displayName = teacher ? getDisplayName(teacher) : 'Teacher Details'
  const breadcrumbs = React.useMemo(
    () => getTeacherBreadcrumbs('details', displayName),
    [displayName],
  )

  return (
    <DetailPageLayout
      title="Teacher Details"
      breadcrumbs={breadcrumbs}
      showBackButton
      isLoading={isLoading}
      error={error || (!teacher && !isLoading ? 'Teacher not found' : null)}
      errorActionLabel="Back to Teachers"
      onErrorAction={handleBack}
      loadingMessage="Loading teacher details..."
    >
      {teacher && (
        <div
          className="grid grid-cols-1 md:grid-cols-[280px_1fr] xl:grid-cols-[25%_1fr_25%]"
          style={{ gap: spacing['4'] }}
        >
          {/* ═══ LEFT COLUMN ═══ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['4'] }}>
            <TeacherProfileCard teacher={teacher} />
            <TeacherPersonalInfo teacher={teacher} />
            {teacher.documents && teacher.documents.length > 0 && (
              <TeacherDocuments documents={teacher.documents} />
            )}
          </div>

          {/* ═══ MIDDLE COLUMN ═══ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['4'] }}>
            {teacher.workloadData && teacher.workloadData.length > 0 && (
              <TeacherWorkloadChart data={teacher.workloadData} workloadByPeriod={teacher.workloadByPeriod} />
            )}
            {teacher.schedule && teacher.schedule.length > 0 && (
              <TeacherSchedule schedule={teacher.schedule} scheduleByView={teacher.scheduleByView} />
            )}
            {teacher.trainingEvents && teacher.trainingEvents.length > 0 && (
              <TeacherDevelopmentTraining events={teacher.trainingEvents} />
            )}
          </div>

          {/* ═══ RIGHT COLUMN ═══ */}
          <div className="md:col-span-2 xl:col-span-1" style={{ display: 'flex', flexDirection: 'column', gap: spacing['4'] }}>
            {/* Calendar with attendance summary */}
            {/*
              The month the calendar shows is the month the state says, and the
              state starts at today. It was pinned to `year={2035} month={2}`,
              so every teacher's attendance calendar opened on March 2035 —
              nine years out, and a month `monthlyAttendance` has no key for,
              which is why the grid was blank while the summary underneath it
              counted a different month's days.
            */}
            <MiniCalendar
              year={calYear}
              month={calMonth}
              highlights={calendarHighlights}
              today={
                calYear === new Date().getFullYear() && calMonth === new Date().getMonth()
                  ? new Date().getDate()
                  : undefined
              }
              onMonthChange={handleMonthChange}
            >
              {attendanceSummary && (
                <div style={{ marginTop: spacing['8'] }}>
                  <AttendanceSummaryBadges
                    items={[
                      { label: 'Present', value: attendanceSummary.present, color: 'var(--accent)' },
                      { label: 'Late', value: attendanceSummary.late, color: 'var(--primary)' },
                      { label: 'On Leave', value: attendanceSummary.onLeave, color: 'var(--heading)' },
                    ]}
                  />
                </div>
              )}

              {/* Leave Requests — inside same card as calendar */}
              {teacher.leaveRequests && teacher.leaveRequests.length > 0 && (() => {
                return (
                  <div
                    style={{
                      marginTop: spacing['8'],
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing['3'] }}>
                      <h3 style={{ fontSize: fontSizes.lg, fontWeight: 600, color: 'var(--heading)', margin: 0 }}>
                        Leave Request
                      </h3>
                      <span style={{ fontSize: fontSizes.base, color: text.body, cursor: 'pointer' }}>···</span>
                    </div>
                    <div
                      style={{
                        maxHeight: '240px',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: spacing['3'],
                      }}
                    >
                      {teacher.leaveRequests.map(request => (
                        <div
                          key={request.id}
                          style={{
                            backgroundColor: background.page,
                            borderRadius: spacing['3'],
                            padding: spacing['4'],
                            display: 'flex',
                            flexDirection: 'column',
                            gap: spacing['3'],
                            flexShrink: 0,
                          }}
                        >
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              alignSelf: 'flex-start',
                              padding: `${spacing['1']} ${spacing['3']}`,
                              borderRadius: spacing['2'],
                              fontSize: fontSizes.xs,
                              fontWeight: 500,
                              backgroundColor: 'var(--primary)',
                              color: 'var(--heading)',
                            }}
                          >
                            {request.type}
                          </span>
                          <p style={{ fontSize: fontSizes.sm, color: text.body, margin: 0, lineHeight: 1.5 }}>
                            {request.reason}
                          </p>
                          {request.status === 'Pending' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: spacing['3'] }}>
                              <button
                                style={{
                                  flex: 1,
                                  padding: `${spacing['2']} ${spacing['3']}`,
                                  fontSize: fontSizes.sm,
                                  fontWeight: 500,
                                  borderRadius: '999rem',
                                  border: `1px solid ${border.default}`,
                                  backgroundColor: background.card,
                                  color: 'var(--heading)',
                                  cursor: 'pointer',
                                }}
                              >
                                Approve
                              </button>
                              <button
                                style={{
                                  flex: 1,
                                  padding: `${spacing['2']} ${spacing['3']}`,
                                  fontSize: fontSizes.sm,
                                  fontWeight: 500,
                                  borderRadius: '999rem',
                                  border: `1px solid ${border.default}`,
                                  backgroundColor: background.card,
                                  color: 'var(--heading)',
                                  cursor: 'pointer',
                                }}
                              >
                                Decline
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}
            </MiniCalendar>

            {teacher.performanceMetrics && teacher.performanceMetrics.length > 0 && (
              <TeacherPerformance
                metrics={teacher.performanceMetrics}
                performanceByPeriod={teacher.performanceByPeriod}
              />
            )}
          </div>
        </div>
      )}
    </DetailPageLayout>
  )
}
