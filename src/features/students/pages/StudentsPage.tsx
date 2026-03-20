import * as React from 'react'
import { StudentsTable } from '../components/StudentsTable'
import { fetchStudents } from '@/api/services/student-service'
import type { Student } from '@/features/students/types'
import { Tile, TileWrapper } from '@/components/tile'
import { EnrollmentTrendsChart } from '@/components/charts/EnrollmentTrendsChart'
import { AttendanceOverviewChart } from '@/components/charts/AttendanceOverviewChart'
import { fetchEnrollmentTrends, fetchAttendanceOverview } from '@/api/services/student-service'
import type { EnrollmentData, AttendanceData } from '@/data/dashboard'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * StudentsPage component that fetches and displays student data with charts
 */
export function StudentsPage() {
  const [students, setStudents] = React.useState<Student[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [enrollmentData, setEnrollmentData] = React.useState<EnrollmentData[]>([])
  const [attendanceData, setAttendanceData] = React.useState<AttendanceData[]>([])
  const [isLoadingEnrollment, setIsLoadingEnrollment] = React.useState(true)
  const [isLoadingAttendance, setIsLoadingAttendance] = React.useState(true)

  React.useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true)
        setIsLoadingEnrollment(true)
        setIsLoadingAttendance(true)

        // Fetch all data in parallel
        const [studentsData, enrollment, attendance] = await Promise.all([
          fetchStudents(),
          fetchEnrollmentTrends(),
          fetchAttendanceOverview(),
        ])

        setStudents(studentsData)
        setEnrollmentData(enrollment)
        setAttendanceData(attendance)
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setIsLoading(false)
        setIsLoadingEnrollment(false)
        setIsLoadingAttendance(false)
      }
    }

    loadData()
  }, [])

  if (isLoading) {
    return (
      <TileWrapper columns={12} gap={12}>
        {/* Table skeleton - 8/12 columns on desktop */}
        <Tile
          id="students-table-skeleton"
          layoutMode="grid"
          width={{ default: 12, md: 8 }}
          background="card"
          borderRadius="lg"
          shadowed={false}
          padding="p-6"
        >
          <div className="space-y-4">
            {/* Toolbar skeleton */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <Skeleton className="h-7 w-[100px]" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-[250px] rounded-md" />
                <Skeleton className="h-8 w-[120px] rounded-md" />
                <Skeleton className="h-8 w-[120px] rounded-md" />
              </div>
            </div>
            {/* Table header */}
            <Skeleton className="h-10 w-full rounded" />
            {/* Table rows */}
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded" />
            ))}
            {/* Pagination */}
            <div className="flex items-center justify-between pt-2">
              <Skeleton className="h-4 w-[150px]" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </div>
          </div>
        </Tile>

        {/* Charts skeleton - 4/12 columns on desktop */}
        <Tile
          id="charts-skeleton"
          layoutMode="grid"
          width={{ default: 12, md: 4 }}
          background="transparent"
          padding={0}
        >
          <div className="flex flex-col gap-6">
            {/* Enrollment Trends Chart skeleton */}
            <div className="bg-card rounded-lg shadow-xs p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-[140px]" />
                <Skeleton className="h-8 w-[110px] rounded-md" />
              </div>
              <Skeleton className="h-[204px] w-full rounded" />
            </div>
            {/* Attendance Overview Chart skeleton */}
            <div className="bg-card rounded-lg shadow-xs p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-[160px]" />
                <Skeleton className="h-8 w-[110px] rounded-md" />
              </div>
              <Skeleton className="h-[204px] w-full rounded" />
            </div>
          </div>
        </Tile>
      </TileWrapper>
    )
  }

  return (
    <TileWrapper columns={12} gap={12}>
      {/* Table - 8/12 columns on desktop, full width on mobile */}
      <Tile
        id="students-table-tile"
        layoutMode="grid"
        width={{ default: 12, md: 8 }}
        background="card"
        borderRadius="lg"
        shadowed={false}
        padding="p-6"
        overflow="auto"
      >
        <StudentsTable data={students} isLoading={isLoading} />
      </Tile>

      {/* Charts - 4/12 columns on desktop, full width on mobile, stacked vertically */}
      <Tile
        id="charts-container-tile"
        layoutMode="grid"
        width={{ default: 12, md: 4 }}
        background="transparent"
        padding={0}
      >
        <div className="flex flex-col gap-6">
          <EnrollmentTrendsChart data={enrollmentData} isLoading={isLoadingEnrollment} />
          <AttendanceOverviewChart data={attendanceData} isLoading={isLoadingAttendance} />
        </div>
      </Tile>
    </TileWrapper>
  )
}

