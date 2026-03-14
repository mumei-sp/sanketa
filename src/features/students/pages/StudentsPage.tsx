import * as React from 'react'
import { StudentsTable } from '../components/StudentsTable'
import { fetchStudents } from '@/api/services/student-service'
import type { Student } from '@/features/students/types'
import { Tile, TileWrapper } from '@/components/tile'
import { EnrollmentTrendsChart } from '@/components/charts/EnrollmentTrendsChart'
import { AttendanceOverviewChart } from '@/components/charts/AttendanceOverviewChart'
import { fetchEnrollmentTrends, fetchAttendanceOverview } from '@/api/services/student-service'
import type { EnrollmentData, AttendanceData } from '@/data/dashboard'

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
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading students...</div>
      </div>
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

