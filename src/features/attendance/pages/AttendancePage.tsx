import * as React from 'react'
import { AttendanceTable } from '../components/AttendanceTable'
import { AttendanceSummary } from '../components/AttendanceSummary'
import { AttendanceOverviewAreaChart } from '@/components/charts/AttendanceOverviewAreaChart'
import { fetchAttendanceRecords } from '@/api/services/attendance-service'
import type { AttendanceRecord } from '../types'
import { Tile, TileWrapper } from '@/components/tile'
import { useIsMobile } from '@/hooks/use-mobile'
import { attendanceOverviewMonthlyData } from '@/data/mocks/attendance-overview'
import { AttendancePageLayout } from '../components/AttendancePageLayout'
import { getAttendanceBreadcrumbs } from '../utils/breadcrumbs'
import { ATTENDANCE_MESSAGES } from '../constants'

/**
 * AttendancePage component that fetches and displays attendance data
 */
export function AttendancePage() {
  const isMobile = useIsMobile()
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
      {/* Attendance Summary and Chart Section - Side by side on desktop */}
      <div className="w-full flex flex-row gap-3 items-stretch">
        {/* Attendance Summary - 65% width on desktop, full width on mobile */}
        <div 
          className={isMobile ? 'w-full' : ''}
          style={{ 
            width: isMobile ? '100%' : '65%', 
            flexShrink: 0,
            flexGrow: 0
          }}
        >
          <AttendanceSummary data={attendanceData} />
        </div>

        {/* Attendance Overview Chart - 35% width on desktop, full width on mobile */}
        {!isMobile && (
          <div
            style={{ 
              width: '35%', 
              flexShrink: 0,
              flexGrow: 0,
              alignSelf: 'stretch'
            }}
          >
            <Tile
              id="attendance-overview-chart-wrapper"
              layoutMode="block"
              widthPx="100%"
              heightPx="100%"
              background="card"
              borderRadius="lg"
              shadowed={true}
              padding="p-4"
            >
              <AttendanceOverviewAreaChart data={attendanceOverviewMonthlyData} isLoading={false} />
            </Tile>
          </div>
        )}
      </div>

      {/* Attendance Overview Chart Section - Full width on mobile */}
      {isMobile && (
        <TileWrapper mode="flex" gap={0} className="w-full">
          <Tile
            id="attendance-overview-chart-mobile"
            layoutMode="block"
            widthPx="100%"
            background="card"
            borderRadius="lg"
            shadowed={true}
            padding="p-6"
          >
            <AttendanceOverviewAreaChart data={attendanceOverviewMonthlyData} isLoading={false} />
          </Tile>
        </TileWrapper>
      )}

      {/* Attendance Table Section */}
      <TileWrapper mode="grid" columns={12} gap={12}>
        <Tile
          id="attendance-table-tile"
          layoutMode="grid"
          width={12}
          background="card"
          borderRadius="lg"
          shadowed={false}
          padding="p-6"
          overflow="auto"
        >
          <AttendanceTable data={attendanceData} isLoading={isLoading} />
        </Tile>
      </TileWrapper>
    </AttendancePageLayout>
  )
}

