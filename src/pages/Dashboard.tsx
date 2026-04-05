import * as React from 'react'
import { Settings } from 'lucide-react'
import PageHeader from '@/components/layout/PageHeader'
import { TileWrapper, Tile, TileCustomizeModal } from '@/components/tile'
import { Card } from '@/components/ui/card'
import { accent, colors } from '@/theme/colors'
import { useTileSelection } from '@/hooks/use-tile-selection'
import {
  dashboardTileRegistry,
  DEFAULT_DASHBOARD_TILE_IDS,
  toTileOptions,
} from '@/features/dashboard/config/dashboard-tile-registry'
import {
  DashboardStatCard,
  StudentPerformanceChart,
  EarningsChart,
  DashboardCalendar,
  EventsList,
  StudentsByGenderChart,
  StudentAttendanceChart,
  DashboardTodoList,
  NoticeBoard,
  RecentActivity,
} from '@/features/dashboard/components'
import type { HighlightedDate } from '@/features/dashboard/components/DashboardCalendar'
import {
  fetchStudentPerformance,
  fetchEarnings,
  fetchGenderDistribution,
  fetchStudentAttendance,
  fetchCalendarEvents,
  fetchTodoItems,
  fetchRecentActivity,
} from '@/api/services/dashboard-service'
import { fetchNoticeBoardEntries } from '@/api/services/notice-board-service'
import type {
  PerformanceDataset,
  EarningsDataset,
  GenderDataset,
  AttendanceDataset,
  CalendarEvent,
  TodoItem,
  RecentActivityItem,
} from '@/features/dashboard/types'
import type { NoticeBoardEntry } from '@/features/notice-board/types'

export default function Dashboard() {
  // Configurable tile selection (persisted to localStorage)
  const {
    selectedTiles,
    selectedIds,
    toggle: toggleTile,
    reset: resetTiles,
  } = useTileSelection(dashboardTileRegistry, {
    storageKey: 'sanketa:dashboard-tiles',
    defaults: DEFAULT_DASHBOARD_TILE_IDS,
    maxSelections: 4,
  })
  const [customizeOpen, setCustomizeOpen] = React.useState(false)

  const [performance, setPerformance] = React.useState<PerformanceDataset[]>([])
  const [earnings, setEarnings] = React.useState<EarningsDataset[]>([])
  const [gender, setGender] = React.useState<GenderDataset[]>([])
  const [attendance, setAttendance] = React.useState<AttendanceDataset[]>([])
  const [events, setEvents] = React.useState<CalendarEvent[]>([])
  const [todos, setTodos] = React.useState<TodoItem[]>([])
  const [notices, setNotices] = React.useState<NoticeBoardEntry[]>([])
  const [activity, setActivity] = React.useState<RecentActivityItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [calendarDate, setCalendarDate] = React.useState(new Date(2035, 2, 1))

  React.useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true)
        const [
          perfData,
          earnData,
          genderData,
          attendData,
          eventsData,
          todosData,
          noticesData,
          activityData,
        ] = await Promise.all([
          fetchStudentPerformance(),
          fetchEarnings(),
          fetchGenderDistribution(),
          fetchStudentAttendance(),
          fetchCalendarEvents(),
          fetchTodoItems(),
          fetchNoticeBoardEntries(),
          fetchRecentActivity(),
        ])
        setPerformance(perfData)
        setEarnings(earnData)
        setGender(genderData)
        setAttendance(attendData)
        setEvents(eventsData)
        setTodos(todosData)
        setNotices(noticesData)
        setActivity(activityData)
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]

  const filteredEvents = React.useMemo(() => {
    const monthName = MONTH_NAMES[calendarDate.getMonth()]
    return events.filter(e => e.date.startsWith(monthName))
  }, [events, calendarDate])

  const highlightedDates: HighlightedDate[] = React.useMemo(() => {
    return filteredEvents.map(e => {
      const match = e.date.match(/\d+/)
      const day = match ? parseInt(match[0], 10) : 0
      return { day, color: e.bgColor }
    }).filter(h => h.day > 0)
  }, [filteredEvents])

  return (
    <div className="space-y-4">
      <PageHeader title="Dashboard" breadcrumbs={[{ label: 'Dashboard' }]} />

      {/* ───── Unified Dashboard Grid ───── */}
      {/*
        Desktop (lg): 12-col grid, calendar/events on right spanning 3 rows
          Row 1: Stat cards (9 cols, nested 4-col grid) + Calendar/Events (3, row-span-3)
          Row 2: Performance (5) + Earnings (4)
          Row 3: Gender (3) + Attendance (3) + TodoList (3)
        Tablet (md): 12-col grid
          Row 1: Stat cards (full width, nested 4-col grid)
          Row 2: Performance (7) + Gender (5)
          Row 3: Earnings (6) + Attendance (6)
          Row 4: Calendar (5) + Events (7)
          Row 5: TodoList (full)
        Mobile: single column, stat cards 2×2
      */}
      <TileWrapper columns={{ default: 1, md: 12 }} gap={12}>
        {/* Stat Cards — Desktop: 9 cols nested grid | Tablet: full width */}
        <Tile id="stats-container" width={{ default: 1, md: 12, lg: 9 }} className="lg:col-start-1 lg:row-start-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex-1" />
            <button
              type="button"
              onClick={() => setCustomizeOpen(true)}
              className="flex items-center gap-1.5 text-xs font-medium rounded-md px-2.5 py-1 transition-colors hover:opacity-80"
              style={{
                color: colors.text.heading,
                backgroundColor: colors.accent.soft,
                border: `1px solid ${colors.border.default}`,
              }}
            >
              <Settings className="w-3.5 h-3.5" />
              Customize
            </button>
          </div>
          <TileWrapper columns={{ default: 2, md: 4 }} gap={12}>
            {selectedTiles.map(stat => (
              <DashboardStatCard key={stat.id} stat={stat} />
            ))}
          </TileWrapper>
        </Tile>

        {/* Tile customize modal */}
        <TileCustomizeModal
          open={customizeOpen}
          onOpenChange={setCustomizeOpen}
          options={toTileOptions(dashboardTileRegistry)}
          selectedIds={selectedIds}
          onToggle={toggleTile}
          onReset={resetTiles}
          maxSelections={4}
          title="Customize Dashboard Tiles"
        />

        {/* Calendar + Events — Desktop: row1-3 col10-12 | Tablet: row4 (single card) */}
        <Tile
          id="calendar-events-grid"
          width={{ default: 1, md: 5, lg: 3 }}
          height={{ default: 1, lg: 3 }}
          className="lg:col-start-10 lg:row-start-1"
        >
          <Card
            className="pt-4 pb-2 flex flex-col gap-3 h-full"
            style={{ backgroundColor: accent.base }}
          >
            <DashboardCalendar
              embedded
              selectedDate={new Date(2035, 2, 8)}
              highlightedDates={highlightedDates}
              currentDate={calendarDate}
              onMonthChange={setCalendarDate}
            />
            <div className="bg-white rounded-xl mx-2 px-2 pt-3 pb-3 flex-1 min-h-0 flex flex-col">
              <EventsList embedded events={filteredEvents} isLoading={isLoading} />
            </div>
          </Card>
        </Tile>

        {/* Student Performance — Desktop: row2 col1-4 | Tablet: row2 col1-7 */}
        <Tile id="perf-grid" width={{ default: 1, md: 7, lg: 4 }} className="lg:col-start-1 lg:row-start-2">
          <StudentPerformanceChart datasets={performance} isLoading={isLoading} />
        </Tile>

        {/* Earnings — Desktop: row2 col5-9 | Tablet: row3 col1-6 */}
        <Tile id="earnings-grid" width={{ default: 1, md: 6, lg: 5 }} className="lg:col-start-5 lg:row-start-2">
          <EarningsChart datasets={earnings} isLoading={isLoading} />
        </Tile>

        {/* Students by Gender — Desktop: row3 col1-3 | Tablet: row2 col8-12 */}
        <Tile id="gender-grid" width={{ default: 1, md: 5, lg: 3 }} className="lg:col-start-1 lg:row-start-3">
          <StudentsByGenderChart datasets={gender} isLoading={isLoading} />
        </Tile>

        {/* Student Attendance — Desktop: row3 col4-6 | Tablet: row3 col7-12 */}
        <Tile id="attendance-grid" width={{ default: 1, md: 6, lg: 3 }} className="lg:col-start-4 lg:row-start-3">
          <StudentAttendanceChart datasets={attendance} isLoading={isLoading} />
        </Tile>

        {/* Events — tablet only (separate from calendar) */}
        <Tile id="events-tablet-grid" width={{ default: 1, md: 7 }} className="hidden md:block lg:hidden">
          <EventsList events={filteredEvents} isLoading={isLoading} />
        </Tile>

        {/* To Do List — Desktop: row3 col7-9 | Tablet: full width */}
        <Tile id="todo-grid" width={{ default: 1, md: 12, lg: 3 }} className="lg:col-start-7 lg:row-start-3">
          <DashboardTodoList items={todos} isLoading={isLoading} />
        </Tile>
      </TileWrapper>

      {/* ───── Row 3: Notice Board + Recent Activity ───── */}
      <TileWrapper columns={{ default: 1, md: 12 }} gap={12}>
        <Tile id="notice-grid" width={{ default: 1, md: 9 }}>
          <NoticeBoard items={notices} isLoading={isLoading} />
        </Tile>
        <Tile id="activity-grid" width={{ default: 1, md: 3 }}>
          <RecentActivity items={activity} isLoading={isLoading} />
        </Tile>
      </TileWrapper>
    </div>
  )
}
