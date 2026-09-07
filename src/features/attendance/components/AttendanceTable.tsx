import * as React from 'react'
import type { Row, Table as TanStackTable } from '@tanstack/react-table'
import { DataTable, MobileRecordCard, TOOLBAR_HALF } from '@/components/table'
import { cn } from '@/lib/utils'
import { AttendanceStatusBadge } from './AttendanceStatusBadge'
import { formatDateHeader } from '@/utils/date'
import { generateAttendanceColumns } from './attendance-columns'
import type {
  AttendanceTableData,
  AttendanceRecordType,
  AttendanceStatus,
  DateRange,
} from '../types'
import { colors, withOpacity } from '@/theme/colors'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DateRangeSelector } from './DateRangeSelector'
import { DataTablePaginationCustom } from '@/components/table/DataTablePaginationCustom'
import { useAttendanceFilters } from '../hooks/use-attendance-filters'

interface AttendanceTableProps {
  data: AttendanceTableData[]
  isLoading?: boolean
}

const DAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

const STATUS_LABEL: Record<AttendanceStatus, string> = {
  present: 'Present',
  late: 'Late',
  absent: 'Absent',
  na: 'Not recorded',
}

const STATUS_COLOR: Record<AttendanceStatus, string | null> = {
  present: colors.status.success.base,
  late: colors.status.warning.base,
  absent: colors.status.danger.base,
  na: null,
}

/**
 * One day of the mobile attendance strip.
 *
 * The wrapping chips this replaces each carried a full "Mon, Sep 7" label, so
 * every chip was a different width and a week of them broke into a ragged
 * 2/3/2 stack that read in no obvious order. Uniform cells in a seven-column
 * grid line the days up and fit a whole month in four rows.
 */
function AttendanceDayCell({
  dateStr,
  status,
}: {
  dateStr: string
  status: AttendanceStatus
}) {
  const date = new Date(dateStr)
  const tint = STATUS_COLOR[status]

  return (
    <div
      className="flex flex-col items-center gap-0.5 rounded-md border py-1"
      style={{
        borderColor: tint ? withOpacity(tint, 0.35) : colors.border.default,
        backgroundColor: tint ? withOpacity(tint, 0.1) : 'transparent',
      }}
      title={`${formatDateHeader(dateStr)} — ${STATUS_LABEL[status]}`}
    >
      <span className="text-[10px] leading-none" style={{ color: colors.text.muted }}>
        {DAY_INITIALS[date.getDay()]}
      </span>
      <span
        className="text-xs font-semibold leading-none"
        style={{ color: 'var(--heading)', fontVariantNumeric: 'tabular-nums' }}
      >
        {date.getDate()}
      </span>
      <AttendanceStatusBadge status={status} size="sm" />
    </div>
  )
}

/**
 * Attendance table component using TanStack Table
 */
export function AttendanceTable({ data }: AttendanceTableProps) {
  const {
    typeFilter,
    setTypeFilter,
    classFilter,
    setClassFilter,
    dateRangeFilter,
    setDateRangeFilter,
    filteredData,
    uniqueClasses,
  } = useAttendanceFilters(data)

  // Generate columns based on filtered data
  const columns = React.useMemo(() => generateAttendanceColumns(filteredData), [filteredData])

  // Custom toolbar with filters
  const renderToolbar = React.useCallback(
    (_table: TanStackTable<AttendanceTableData>) => {
      const handleTypeChange = (value: string) => {
        setTypeFilter(value as AttendanceRecordType)
      }

      const handleClassChange = (value: string) => {
        setClassFilter(value)
      }

      const handleDateRangeChange = (range: DateRange) => {
        setDateRangeFilter(range)
      }

      return (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4 md:flex-wrap">
            <h2 className="text-section-title text-foreground">Attendance</h2>
            <div className="flex flex-wrap items-center gap-2 max-md:w-full">
              {/* Type filter tabs */}
              <Tabs value={typeFilter} onValueChange={handleTypeChange} className="max-md:w-full">
                <TabsList className="h-9 bg-muted p-0.5 rounded-lg gap-0.5 max-md:w-full">
                  <TabsTrigger
                    value="student"
                    className="h-[calc(100%-4px)] px-5 text-sm font-medium rounded-md flex-none max-md:flex-1 border-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none data-[state=inactive]:bg-background data-[state=inactive]:text-foreground transition-colors"
                  >
                    Students
                  </TabsTrigger>
                  <TabsTrigger
                    value="teacher"
                    className="h-[calc(100%-4px)] px-5 text-sm font-medium rounded-md flex-none max-md:flex-1 border-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none data-[state=inactive]:bg-background data-[state=inactive]:text-foreground transition-colors"
                  >
                    Teachers
                  </TabsTrigger>
                  <TabsTrigger
                    value="staff"
                    className="h-[calc(100%-4px)] px-5 text-sm font-medium rounded-md flex-none max-md:flex-1 border-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none data-[state=inactive]:bg-background data-[state=inactive]:text-foreground transition-colors"
                  >
                    Staff
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Class dropdown (only show for students) */}
              {typeFilter === 'student' ? (
                <Select value={classFilter} onValueChange={handleClassChange}>
                  {/* h-8 never applied — SelectTrigger's own
                      data-[size=default]:h-9 outranks it, so this has always
                      drawn at 36px, matching the tabs beside it. */}
                  <SelectTrigger
                    className={cn(
                      'h-9 w-[120px] bg-accent text-foreground border-0 hover:bg-accent/80',
                      TOOLBAR_HALF,
                    )}
                  >
                    <SelectValue placeholder="All Classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {uniqueClasses.map(cls => (
                      <SelectItem key={cls} value={cls}>
                        {cls}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}

              {/* Month selector */}
              <DateRangeSelector
                value={dateRangeFilter}
                onChange={handleDateRangeChange}
                records={data}
                className={TOOLBAR_HALF}
              />
            </div>
          </div>
        </div>
      )
    },
    [typeFilter, classFilter, dateRangeFilter, uniqueClasses, setTypeFilter, setClassFilter, setDateRangeFilter, data],
  )

  // Custom pagination using shared component
  const renderPagination = React.useCallback((table: TanStackTable<AttendanceTableData>) => {
    return <DataTablePaginationCustom table={table} />
  }, [])

  // Below `lg` the person x date matrix becomes one card per person, with the
  // dates as a calendar-like strip instead of marching off the right edge.
  const renderMobileCard = React.useCallback((row: Row<AttendanceTableData>) => {
    const record = row.original
    const id = record.studentId || record.teacherId || record.staffId || 'N/A'
    // Chronological, so the strip reads left to right like a calendar.
    const dates = Object.keys(record.attendance).sort()

    return (
      <MobileRecordCard
        title={record.name}
        subtitle={record.class ? `${id} · ${record.class}` : id}
        footer={
          // Capped so a tablet's extra width stretches the days into letterbox
          // slabs — the cap keeps them near square, and every card shares it,
          // so the same weekday still lines up down the list.
          <div className="grid w-full max-w-md grid-cols-7 gap-1">
            {dates.map(dateStr => (
              <AttendanceDayCell
                key={dateStr}
                dateStr={dateStr}
                status={record.attendance[dateStr] || 'na'}
              />
            ))}
          </div>
        }
      />
    )
  }, [])

  return (
    <DataTable
      columns={columns}
      data={filteredData}
      enableSorting
      enablePagination
      enableFiltering
      enableGlobalFilter={false}
      showToolbar={true}
      renderToolbar={renderToolbar}
      renderPagination={renderPagination}
      renderMobileCard={renderMobileCard}
      mobileEmptyMessage="No attendance records for this selection."
      bodyProps={{
        rowProps: {
          className: 'h-12',
        },
      }}
      tableOptions={{
        initialState: {
          pagination: {
            pageSize: 10,
          },
        },
      }}
    />
  )
}

