import * as React from 'react'
import { AttendanceTable } from '../components/AttendanceTable'
import { AttendanceSummary } from '../components/AttendanceSummary'
import { AttendanceOverviewAreaChart } from '@/components/charts/AttendanceOverviewAreaChart'
import { fetchAttendanceRecords } from '@/api/services/attendance-service'
import type { AttendanceRecord } from '../types'
import { Tile } from '@/components/tile'
import { useIsDesktop } from '@/hooks/use-mobile'
import { attendanceOverviewMonthlyData } from '@/data/mocks/attendance-overview'
import { AttendancePageLayout } from '../components/AttendancePageLayout'
import { getAttendanceBreadcrumbs } from '../utils/breadcrumbs'
import { ATTENDANCE_MESSAGES } from '../constants'

/**
 * AttendancePage component that fetches and displays attendance data
 */
export function AttendancePage() {
  const isDesktop = useIsDesktop()
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
      <div className={isDesktop ? 'flex flex-row gap-3 items-stretch' : 'space-y-4'}>
        {/* Attendance Summary - ~60% on desktop, full width otherwise */}
        <div className={isDesktop ? 'w-[60%] shrink-0' : 'w-full'}>
          <AttendanceSummary data={attendanceData} />
        </div>

        {/* Attendance Overview Chart - ~40% on desktop, full width otherwise */}
        <div className={isDesktop ? 'flex-1 min-w-0' : 'w-full'}>
          <Tile
            id="attendance-overview-chart"
            layoutMode="block"
            widthPx="100%"
            heightPx={isDesktop ? '100%' : 280}
            background="card"
            borderRadius="lg"
            shadowed={true}
            padding="p-4"
          >
            <AttendanceOverviewAreaChart data={attendanceOverviewMonthlyData} isLoading={false} />
          </Tile>
        </div>
      </div>

      {/* Attendance Table Section - base layout; AppLayout overflow-x-hidden handles page scroll */}
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

