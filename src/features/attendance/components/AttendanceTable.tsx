import * as React from 'react'
import type { Row, Table as TanStackTable } from '@tanstack/react-table'
import { DataTable, MobileRecordCard } from '@/components/table'
import { AttendanceStatusBadge } from './AttendanceStatusBadge'
import { formatDateHeader } from '@/utils/date'
import { generateAttendanceColumns } from './attendance-columns'
import type { AttendanceTableData, AttendanceRecordType, DateRange } from '../types'
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:flex-wrap">
            <h2 className="text-section-title text-foreground">Attendance</h2>
            <div className="flex flex-wrap items-center gap-2">
              {/* Type filter tabs */}
              <Tabs value={typeFilter} onValueChange={handleTypeChange}>
                <TabsList className="h-9 bg-muted p-0.5 rounded-lg gap-0.5">
                  <TabsTrigger
                    value="student"
                    className="h-[calc(100%-4px)] px-5 text-sm font-medium rounded-md flex-none border-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none data-[state=inactive]:bg-background data-[state=inactive]:text-foreground transition-colors"
                  >
                    Students
                  </TabsTrigger>
                  <TabsTrigger
                    value="teacher"
                    className="h-[calc(100%-4px)] px-5 text-sm font-medium rounded-md flex-none border-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none data-[state=inactive]:bg-background data-[state=inactive]:text-foreground transition-colors"
                  >
                    Teachers
                  </TabsTrigger>
                  <TabsTrigger
                    value="staff"
                    className="h-[calc(100%-4px)] px-5 text-sm font-medium rounded-md flex-none border-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none data-[state=inactive]:bg-background data-[state=inactive]:text-foreground transition-colors"
                  >
                    Staff
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Class dropdown (only show for students) */}
              {typeFilter === 'student' ? (
                <Select value={classFilter} onValueChange={handleClassChange}>
                  <SelectTrigger className="h-8 w-[120px] bg-accent text-foreground border-0 hover:bg-accent/80">
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
              <DateRangeSelector value={dateRangeFilter} onChange={handleDateRangeChange} records={data} />
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
  // dates wrapping as chips instead of marching off the right edge.
  const renderMobileCard = React.useCallback((row: Row<AttendanceTableData>) => {
    const record = row.original
    const id = record.studentId || record.teacherId || record.staffId || 'N/A'
    const dates = Object.keys(record.attendance).sort().reverse()

    return (
      <MobileRecordCard
        title={record.name}
        subtitle={record.class ? `${id} · ${record.class}` : id}
        footer={
          <div className="flex flex-wrap gap-2">
            {dates.map(dateStr => (
              <div
                key={dateStr}
                className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1"
              >
                <span className="text-caption text-muted-foreground">
                  {formatDateHeader(dateStr)}
                </span>
                <AttendanceStatusBadge status={record.attendance[dateStr] || 'na'} />
              </div>
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

