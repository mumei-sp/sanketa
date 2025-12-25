import * as React from 'react'
import { StudentsTable } from './StudentsTable'
import { fetchStudents } from './student.service'
import type { Student } from './student.types'
import { Tile } from '@/components/tile'
import { EnrollmentTrendsChart } from '@/components/charts/EnrollmentTrendsChart'
import { AttendanceOverviewChart } from '@/components/charts/AttendanceOverviewChart'
import { fetchEnrollmentTrends, fetchAttendanceOverview } from '@/services/dashboardService'
import type { EnrollmentData } from '@/data/enrollmentTrends'
import type { AttendanceData } from '@/data/attendanceOverview'

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
    <div className="flex gap-6">
      {/* Table - 70% width */}
      <Tile
        id="students-table-tile"
        layoutMode="block"
        widthPx="70%"
        background="card"
        borderRadius="lg"
        shadowed={false}
        padding="p-6"
        overflow="auto"
        className="ml-0"
      >
        <StudentsTable data={students} isLoading={isLoading} />
      </Tile>

      {/* Charts - 30% width, stacked vertically */}
      <div className="flex flex-col gap-6" style={{ width: '30%' }}>
        <EnrollmentTrendsChart data={enrollmentData} isLoading={isLoadingEnrollment} />
        <AttendanceOverviewChart data={attendanceData} isLoading={isLoadingAttendance} />
      </div>
    </div>
  )
}
