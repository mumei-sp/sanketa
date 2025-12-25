import * as React from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { TileWrapper } from '@/components/tile'
import { EnrollmentTrendsChart } from '@/components/charts/EnrollmentTrendsChart'
import { AttendanceOverviewChart } from '@/components/charts/AttendanceOverviewChart'
import { fetchEnrollmentTrends, fetchAttendanceOverview } from '@/services/dashboardService'
import type { EnrollmentData, AttendanceData } from '@/data/dashboard'
import { useIsMobile } from '@/hooks/use-mobile'

/**
 * StudentsDashboard - Main dashboard page displaying enrollment trends and attendance overview charts
 */
export default function StudentsDashboard() {
  const isMobile = useIsMobile()
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

      <TileWrapper mode="grid" columns={12} gap={12}>
        <EnrollmentTrendsChart
          data={enrollmentData}
          isLoading={isLoadingEnrollment}
          tileWidth={isMobile ? 12 : 6}
          tileLayoutMode="grid"
        />
        <AttendanceOverviewChart
          data={attendanceData}
          isLoading={isLoadingAttendance}
          tileWidth={isMobile ? 12 : 6}
          tileLayoutMode="grid"
        />
      </TileWrapper>
    </div>
  )
}
