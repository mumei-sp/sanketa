import * as React from 'react'
import { AttendanceTable } from '../components/AttendanceTable'
import { AttendanceSummary } from '../components/AttendanceSummary'
import { AttendanceOverviewAreaChart } from '@/components/charts/AttendanceOverviewAreaChart'
import { fetchAttendanceRecords } from '@/api/services/attendance-service'
import type { AttendanceRecord } from '../types'
import { TileWrapper, Tile } from '@/components/tile'
import { attendanceOverviewMonthlyData } from '@/data/mocks/attendance-overview'
import { AttendancePageLayout } from '../components/AttendancePageLayout'
import { getAttendanceBreadcrumbs } from '../utils/breadcrumbs'
import { ATTENDANCE_MESSAGES } from '../constants'

/**
 * AttendancePage component that fetches and displays attendance data
 */
export function AttendancePage() {
  const [attendanceData, setAttendanceData] = React.useState<AttendanceRecord[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true)
        const data = await fetchAttendanceRecords(21)
        setAttendanceData(data)
      } catch (error) {
        console.error('Failed to fetch attendance data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const breadcrumbs = React.useMemo(() => getAttendanceBreadcrumbs('list'), [])

  return (
    <AttendancePageLayout
      title="Attendance"
      breadcrumbs={breadcrumbs}
      isLoading={isLoading}
      loadingMessage={ATTENDANCE_MESSAGES.LOADING}
    >
      {/* Attendance Summary and Chart Section - Side by side on desktop (lg+) */}
      <TileWrapper columns={{ default: 1, lg: 12 }} gap={12}>
        <Tile
          id="attendance-summary"
          layoutMode="block"
          width={{ default: 1, lg: 7 }}
        >
          <AttendanceSummary data={attendanceData} />
        </Tile>

        <Tile
          id="attendance-overview-chart"
          layoutMode="block"
          width={{ default: 1, lg: 5 }}
          className="h-[280px] lg:h-full"
          background="card"
          borderRadius="lg"
          shadowed={true}
          padding="pt-4 px-4 pb-2"
        >
          <AttendanceOverviewAreaChart data={attendanceOverviewMonthlyData} isLoading={false} />
        </Tile>
      </TileWrapper>

      {/* Attendance Table Section */}
      <Tile
        id="attendance-table-tile"
        layoutMode="block"
        widthPx="100%"
        background="card"
        borderRadius="lg"
        shadowed={false}
        padding="p-6"
        overflow="auto"
      >
        <AttendanceTable data={attendanceData} isLoading={isLoading} />
      </Tile>
    </AttendancePageLayout>
  )
}

