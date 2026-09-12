import * as React from 'react'
import { FamilyHome } from '@/features/family/pages/FamilyHome'
import { useFamilyScope } from '@/features/family/FamilyScopeContext'
import { useContexts } from '@/features/tenancy/ContextsProvider'
import { Settings } from 'lucide-react'
import PageHeader from '@/components/layout/PageHeader'
import { TileWrapper, Tile, TileCustomizeModal, MAX_TILE_SELECTIONS } from '@/components/tile'
import { useCurrentUser } from '@/hooks/use-current-user'
import { usePermissions } from '@/features/auth/PermissionContext'
import { getTimeOfDayGreeting, formatFriendlyDate } from '@/utils/date'
import { Card } from '@/components/ui/card'
import { SortableList, SortableItem } from '@/components/ui/sortable-list'
import { colors } from '@/theme/colors'
import { useTileSelection } from '@/hooks/use-tile-selection'
import {
  buildDashboardTileRegistry,
  visibleTiles,
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
} from '@/api/services/dashboard-service'
import { fetchNoticeBoardEntries } from '@/api/services/notice-board-service'
import type {
  PerformanceDataset,
  EarningsDataset,
  GenderDataset,
  AttendanceDataset,
  CalendarEvent,
  TodoItem,
} from '@/features/dashboard/types'
import type { NoticeBoardEntry } from '@/features/notice-board/types'

/**
 * Module scope, not the render body.
 *
 * A fresh array every render is a new identity every render, which is exactly
 * the kind of value a `useMemo` below cannot list in its dependencies without
 * defeating itself — so it was silently omitted instead. Constant data that
 * never depends on props or state belongs out here, where the omission is
 * correct rather than a lint rule being dodged.
 */

export default function Dashboard() {
  // Families get their own home page; see the note in FamilyHome. The school
  // dashboard's tiles — enrolment, earnings, gender split — say nothing at the
  // size of one child.
  const { isFamily, isStaff } = useFamilyScope()
  // Family *only*. Somebody who is both — the teacher whose child attends —
  // keeps the staff page and reaches her son through the child switcher, rather
  // than trading her job for a parent's view of it.
  if (isFamily && !isStaff) return <FamilyHome />
  return <SchoolDashboard />
}

function SchoolDashboard() {
  // Greeting header — all derived (auth user + clock), nothing hard-coded
  const currentUser = useCurrentUser()
  const greeting = getTimeOfDayGreeting()
  const firstName = currentUser?.fullName.split(' ')[0]

  // Only the tiles this caller may see, and the same list feeds the customize
  // modal — a menu should not offer a dish that is off. Memoised rather than
  // recomputed per render, because `useTileSelection` treats a new array as a
  // new registry.
  //
  // Rebuilt when the SCHOOL changes as well as when the permissions do. The
  // registry counts the student and staff tables, which are per-school and drop
  // their rows on a switch; built once at module load it kept serving the
  // enrolment of whichever school was active when the bundle first loaded.
  const { can, canSeeEveryRow } = usePermissions()
  const { active } = useContexts()
  const tenantKey = active?.tenantSchema ?? null
  const tiles = React.useMemo(
    () => visibleTiles(buildDashboardTileRegistry(), can),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tenantKey is the
    // signal that the underlying tables have changed; it is not read in here.
    [can, tenantKey],
  )

  /**
   * Which panels this caller can actually be shown something in.
   *
   * A panel is absent, not empty. Every chart below is an *aggregate*, and the
   * dashboard services refuse to compute one for a caller who may not see
   * every row — so a refused panel used to render a chart of the `[]` it was
   * handed. An Accountant was shown an empty Student Attendance chart; a
   * Teacher an empty Earnings one. That is not a permission working, it is a
   * page pretending it has data.
   *
   * Each is asked about the subject the service actually SUMS, which is not
   * always the subject its rows are about — that mismatch was itself the bug.
   * `fetchStudentPerformance` sums marks, so it spends `grades.read`, and
   * `fetchStudentAttendance` sums registers, so it spends `attendance.read`;
   * both used to ask about `Student`, which let an Accountant holding only
   * `students.read` read the school's results and its attendance.
   *
   * Asked with `canSeeEveryRow` rather than `can` on purpose: `can` with a bare
   * permission answers "anywhere?", which a caller narrowed to their own
   * records also answers yes to. The gate has to ask the question the service
   * asks, and it is the same predicate on both sides so the two cannot drift.
   *
   * The last two are different in kind and asked differently. Calendar events
   * and notices are *rows*, not sums — their services filter rather than refuse
   * — so a plain permission is the right test. The to-do list and the activity
   * feed carry no test at all: the feed is already filtered to what its reader
   * may know about, and the to-do list is the school's own.
   */
  const panels = React.useMemo(
    () => ({
      performance: canSeeEveryRow('read', 'Grade'),
      earnings: canSeeEveryRow('read', 'Finance'),
      gender: canSeeEveryRow('read', 'Student'),
      attendance: canSeeEveryRow('read', 'Attendance'),
      calendar: can('calendar.read'),
      notices: can('notices.read'),
    }),
    [can, canSeeEveryRow],
  )

  /**
   * The four to start with, from the tiles this caller actually has.
   *
   * The shipped defaults are a staff dashboard's — enrolment, faculty, staff,
   * awards — and a role that holds none of them would have opened on an empty
   * strip where four cards belong. Falling back to the first of whatever they
   * *can* see means every role gets a filled row on first load, and the picker
   * is there for the rest.
   */
  const defaults = React.useMemo(() => {
    const kept = DEFAULT_DASHBOARD_TILE_IDS.filter(id => tiles.some(tile => tile.id === id))
    return kept.length > 0 ? kept : tiles.slice(0, MAX_TILE_SELECTIONS).map(tile => tile.id)
  }, [tiles])

  // Configurable tile selection (persisted to localStorage)
  const {
    selectedTiles,
    selectedIds,
    toggle: toggleTile,
    reset: resetTiles,
    setOrder: setTileOrder,
  } = useTileSelection(tiles, {
    storageKey: 'sanketa:dashboard-tiles',
    defaults,
    maxSelections: MAX_TILE_SELECTIONS,
  })
  const [customizeOpen, setCustomizeOpen] = React.useState(false)

  const [performance, setPerformance] = React.useState<PerformanceDataset[]>([])
  const [earnings, setEarnings] = React.useState<EarningsDataset[]>([])
  const [gender, setGender] = React.useState<GenderDataset[]>([])
  const [attendance, setAttendance] = React.useState<AttendanceDataset[]>([])
  const [events, setEvents] = React.useState<CalendarEvent[]>([])
  const [todos, setTodos] = React.useState<TodoItem[]>([])
  const [notices, setNotices] = React.useState<NoticeBoardEntry[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [calendarDate, setCalendarDate] = React.useState(() => new Date())
  // Held steady for the life of the page, so a re-render cannot move which day
  // the calendar calls today.
  const today = React.useMemo(() => new Date(), [])

  React.useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true)
        // Not fetched when not drawn. The services would answer `[]` anyway,
        // so this is four round trips a teacher no longer waits through.
        const [perfData, earnData, genderData, attendData, eventsData, todosData, noticesData] =
          await Promise.all([
            panels.performance ? fetchStudentPerformance() : [],
            panels.earnings ? fetchEarnings() : [],
            panels.gender ? fetchGenderDistribution() : [],
            panels.attendance ? fetchStudentAttendance() : [],
            panels.calendar ? fetchCalendarEvents() : [],
            fetchTodoItems(),
            panels.notices ? fetchNoticeBoardEntries() : [],
          ])
        setPerformance(perfData)
        setEarnings(earnData)
        setGender(genderData)
        setAttendance(attendData)
        setEvents(eventsData)
        setTodos(todosData)
        setNotices(noticesData)
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [panels])

  // The month on screen, matched on the event's own date rather than on the
  // words printed on its badge. `startsWith(monthName)` also ignored the YEAR,
  // so paging to September of any other year showed this September's events.
  const filteredEvents = React.useMemo(() => {
    const month = calendarDate.getMonth()
    const year = calendarDate.getFullYear()
    return events.filter(event => {
      const start = new Date(event.start)
      return start.getMonth() === month && start.getFullYear() === year
    })
  }, [events, calendarDate])

  const highlightedDates: HighlightedDate[] = React.useMemo(
    () =>
      filteredEvents.map(event => ({
        day: new Date(event.start).getDate(),
        color: event.bgColor,
      })),
    [filteredEvents],
  )

  return (
    <div className="space-y-4">
      <PageHeader
        title={currentUser ? `${greeting}, ${firstName}` : 'Dashboard'}
        subtitle={`${formatFriendlyDate()} · Here's what's happening across campus today`}
      />

      {/* ───── Unified Dashboard Grid ───── */}
      {/*
        Placement is by ORDER and width, never by col-start/row-start.
        Pinning a panel to a cell means a panel this caller may not see leaves
        a hole in the grid, and the row below does not move up to fill it. With
        auto-placement the same widths produce the same layout when everything
        is present, and close up when something is not — which is the whole
        point of the `panels` gate above.

        Desktop (lg): 12-col grid, calendar/events on right spanning 3 rows
          Row 1: Stat cards (9 cols, nested 4-col grid) + Calendar/Events (3, row-span-3)
          Row 2: Performance (4) + Earnings (5)
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
        {/*
          From `lg` this is two columns, not one grid: the nine-column main area
          and the three-column rail each own their own rows.

          It was a single twelve-column grid with the rail spanning three rows,
          which meant the rail's CONTENT set the main area's row heights — add
          four events and the bottom row of charts stretched to a height nothing
          in it filled. A panel must never be able to resize a panel beside it.

          Below `lg` both wrappers are `display: contents`, so they dissolve and
          every tile is a direct child of this grid exactly as before — which is
          what keeps the phone and tablet arrangements, and the `order-*` classes
          that express them, working untouched.
        */}
        <div className="contents lg:col-span-9 lg:grid lg:grid-cols-9 lg:gap-3 lg:self-start">
        {/* Stat Cards — Desktop: 9 cols nested grid | Tablet: full width */}
        <Tile
          id="stats-container"
          width={{ default: 1, md: 12, lg: 9 }}
          className="order-1 md:order-1 lg:order-1"
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="flex-1" />
            <button
              type="button"
              onClick={() => setCustomizeOpen(true)}
              className="tap-target flex items-center justify-center gap-1.5 text-xs font-medium rounded-md px-2.5 py-1 transition-colors hover:opacity-80"
              style={{
                color: 'var(--foreground)',
                backgroundColor: 'var(--wash-control)',
                border: `1px solid ${colors.border.default}`,
              }}
            >
              <Settings className="w-3.5 h-3.5" />
              Customize
            </button>
          </div>
          {/*
            Reordering is dnd-kit, not HTML5 drag.

            `draggable` + `onDragStart` is a mouse-only API: it does not fire on
            touch at all, and it has no keyboard path whatsoever, so on a phone
            the row could not be reordered and with a keyboard it could not be
            reached. `SortableList` already ships with a `KeyboardSensor` and a
            `PointerSensor` — the settings sections have used it all along — and
            `asHandle` puts dnd-kit's `role`/`tabIndex`/`aria-roledescription`
            on the card itself, so a card is picked up with Space, moved with
            the arrow keys and dropped with Space.

            `grid` rather than the default list strategy: this row is two
            columns on a phone and four from `md`, and the vertical strategy
            assumes a single column and picks the wrong drop target once a row
            wraps.
          */}
          <SortableList
            items={selectedTiles}
            onReorder={next => setTileOrder(next.map(tile => tile.id))}
            keyExtractor={tile => tile.id}
            layout="grid"
            className="grid grid-cols-2 md:grid-cols-4 gap-3"
          >
            {stat => (
              <SortableItem
                key={stat.id}
                id={stat.id}
                asHandle
                className="cursor-grab touch-none active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <DashboardStatCard stat={stat} />
              </SortableItem>
            )}
          </SortableList>
        </Tile>

        {/* Tile customize modal */}
        <TileCustomizeModal
          open={customizeOpen}
          onOpenChange={setCustomizeOpen}
          options={toTileOptions(tiles)}
          selectedIds={selectedIds}
          onToggle={toggleTile}
          onReset={resetTiles}
          maxSelections={MAX_TILE_SELECTIONS}
          title="Customize Dashboard Tiles"
        />

        {/* Student Performance — Desktop: row2 col1-4 | Tablet: row2 col1-7 */}
        {panels.performance && (
  <Tile
            id="perf-grid"
            width={{ default: 1, md: 7, lg: 4 }}
            className="order-3 md:order-2 lg:order-3"
          >
            <StudentPerformanceChart datasets={performance} isLoading={isLoading} />
          </Tile>
        )}

        {/* Earnings — Desktop: row2 col5-9 | Tablet: row3 col1-6 */}
        {panels.earnings && (
  <Tile
            id="earnings-grid"
            width={{ default: 1, md: 6, lg: 5 }}
            className="order-4 md:order-4 lg:order-4"
          >
            <EarningsChart datasets={earnings} isLoading={isLoading} />
          </Tile>
        )}

        {/* Students by Gender — Desktop: row3 col1-3 | Tablet: row2 col8-12 */}
        {panels.gender && (
  <Tile
            id="gender-grid"
            width={{ default: 1, md: 5, lg: 3 }}
            className="order-5 md:order-3 lg:order-5"
          >
            <StudentsByGenderChart datasets={gender} isLoading={isLoading} />
          </Tile>
        )}

        {/* Student Attendance — Desktop: row3 col4-6 | Tablet: row3 col7-12 */}
        {panels.attendance && (
  <Tile
            id="attendance-grid"
            width={{ default: 1, md: 6, lg: 3 }}
            className="order-6 md:order-5 lg:order-6"
          >
            <StudentAttendanceChart datasets={attendance} isLoading={isLoading} />
          </Tile>
        )}

        {/* Events — tablet only, beside the calendar: row4 col6-12 */}
        {panels.calendar && (
  <Tile
            id="events-tablet-grid"
            width={{ default: 1, md: 7 }}
            // `md:self-start` so it keeps its own height instead of being
            // stretched to the calendar card beside it — measured at 253px of
            // dead card. Per-tile rather than `align="start"` on the wrapper:
            // wrapper-wide, the same change left the performance and gender
            // charts 35px out of step for no gain.
            className="order-7 hidden md:order-7 md:block md:self-start lg:hidden"
          >
            <EventsList events={filteredEvents} isLoading={isLoading} />
          </Tile>
        )}

        {/* To Do List — Desktop: row3 col7-9 | Tablet: row5, full width */}
        <Tile
          id="todo-grid"
          width={{ default: 1, md: 12, lg: 3 }}
          className="order-8 md:order-8 lg:order-7"
        >
          <DashboardTodoList items={todos} isLoading={isLoading} />
        </Tile>
        </div>

        {/* The rail. `lg:self-start` so a long events list grows downward rather
            than stretching the row it shares with the main area. */}
        <div className="contents lg:col-span-3 lg:block lg:self-start">
        {/* Calendar + Events — Desktop: row1-3 col10-12 | Tablet: row4 col1-5 */}
        {panels.calendar && (
  <Tile
            id="calendar-events-grid"
            width={{ default: 1, md: 5, lg: 3 }}
            className="order-2 md:order-6 lg:order-2"
          >
            <Card
              className="pt-4 pb-2 flex flex-col gap-3 h-full"
              style={{
                backgroundColor: 'var(--wash-rail)',
              }}
            >
              {/* `selectedDate` was 8 March 2035 — a day the calendar can never
                  land on, so no day was ever marked as selected. */}
              <DashboardCalendar
                embedded
                selectedDate={today}
                highlightedDates={highlightedDates}
                currentDate={calendarDate}
                onMonthChange={setCalendarDate}
              />
              <div
                className="rounded-xl mx-2 px-2 pt-3 pb-3 flex-1 min-h-0 flex flex-col"
                style={{ backgroundColor: 'var(--card)' }}
              >
                <EventsList embedded events={filteredEvents} isLoading={isLoading} />
              </div>
            </Card>
          </Tile>
        )}
        </div>
      </TileWrapper>

      {/* ───── Row 3: Notice Board + Recent Activity ───── */}
      <TileWrapper columns={{ default: 1, md: 12 }} gap={12}>
        {panels.notices && (
          <Tile id="notice-grid" width={{ default: 1, md: 9 }}>
            <NoticeBoard items={notices} isLoading={isLoading} />
          </Tile>
        )}
        {/* Takes the whole row when there is no notice board beside it, rather
            than sitting in a quarter of one. The feed needs no permission of
            its own — it is already filtered to what its reader may know. */}
        <Tile id="activity-grid" width={{ default: 1, md: panels.notices ? 3 : 12 }}>
          <RecentActivity />
        </Tile>
      </TileWrapper>
    </div>
  )
}
