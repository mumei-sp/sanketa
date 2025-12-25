import * as React from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { EnrollmentTrendsChart } from '@/components/charts/EnrollmentTrendsChart'
import { AttendanceOverviewChart } from '@/components/charts/AttendanceOverviewChart'
import { fetchEnrollmentTrends, fetchAttendanceOverview } from '@/services/dashboardService'
import type { EnrollmentData } from '@/data/enrollmentTrends'
import type { AttendanceData } from '@/data/attendanceOverview'

/**
 * StudentsDashboard - Main dashboard page displaying enrollment trends and attendance overview charts
 */
export default function StudentsDashboard() {
  const [enrollmentData, setEnrollmentData] = React.useState<EnrollmentData[]>([])
  const [attendanceData, setAttendanceData] = React.useState<AttendanceData[]>([])
  const [isLoadingEnrollment, setIsLoadingEnrollment] = React.useState(true)
  const [isLoadingAttendance, setIsLoadingAttendance] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function loadData() {
      try {
        setError(null)

        // Fetch both datasets in parallel
        const [enrollment, attendance] = await Promise.all([
          fetchEnrollmentTrends(),
          fetchAttendanceOverview(),
        ])

        setEnrollmentData(enrollment)
        setAttendanceData(attendance)
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err)
        setError('Failed to load dashboard data. Please try again later.')
      } finally {
        setIsLoadingEnrollment(false)
        setIsLoadingAttendance(false)
      }
    }

    loadData()
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Students' }]}
      />

      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <EnrollmentTrendsChart data={enrollmentData} isLoading={isLoadingEnrollment} />
        <AttendanceOverviewChart data={attendanceData} isLoading={isLoadingAttendance} />
      </div>
    </div>
  )
}
