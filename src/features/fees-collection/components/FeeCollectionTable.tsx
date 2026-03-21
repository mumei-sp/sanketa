import * as React from 'react'
import type { Row, Table as TanStackTable } from '@tanstack/react-table'
import { DataTable } from '@/components/table'
import { GridPagination } from '@/components/pagination/GridPagination'
import { Skeleton } from '@/components/ui/skeleton'
import { createFeeCollectionColumns } from './fee-collection-columns'
import type { FeeCollectionRecord, FeeStatus } from '@/features/fees-collection/types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface FeeCollectionTableProps {
  data: FeeCollectionRecord[]
  isLoading?: boolean
}

const CLASSES = ['7A', '7B', '7C', '8A', '8B']
const STATUSES: FeeStatus[] = ['Paid', 'Pending', 'Partially Paid', 'Overdue']

/**
 * Group records by studentId, preserving category order within each group.
 */
function ensureStudentGrouping(data: FeeCollectionRecord[]): FeeCollectionRecord[] {
  const groups = new Map<string, FeeCollectionRecord[]>()
  for (const record of data) {
    const existing = groups.get(record.studentId)
    if (existing) {
      existing.push(record)
    } else {
      groups.set(record.studentId, [record])
    }
  }
  return Array.from(groups.values()).flat()
}

export function FeeCollectionTable({ data, isLoading = false }: FeeCollectionTableProps) {
  const [classFilter, setClassFilter] = React.useState<string>('all')
  const [statusFilter, setStatusFilter] = React.useState<string>('all')
  const [timeFilter, setTimeFilter] = React.useState<string>('this-month')

  // Always keep student records grouped together
  const groupedData = React.useMemo(() => ensureStudentGrouping(data ?? []), [data])

  // Build a map of studentId → first record (for group-level sort comparisons)
  // Columns use this via closure so same-student rows stay together during sort
  const columns = React.useMemo(() => {
    const firstRecords = new Map<string, FeeCollectionRecord>()
    for (const record of groupedData) {
      if (!firstRecords.has(record.studentId)) {
        firstRecords.set(record.studentId, record)
      }
    }
    return createFeeCollectionColumns(firstRecords)
  }, [groupedData])

  const renderToolbar = React.useCallback(
    (table: TanStackTable<FeeCollectionRecord>) => {
      const handleClassChange = (value: string) => {
        setClassFilter(value)
        const classColumn = table.getColumn('class')
        if (classColumn) {
          classColumn.setFilterValue(value === 'all' ? undefined : value)
        }
      }

      const handleStatusChange = (value: string) => {
        setStatusFilter(value)
        const statusColumn = table.getColumn('status')
        if (statusColumn) {
          statusColumn.setFilterValue(value === 'all' ? undefined : value)
        }
      }

      return (
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-page-title text-foreground">Fees Collection</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={classFilter} onValueChange={handleClassChange}>
              <SelectTrigger className="h-8 w-[140px] bg-accent text-foreground border-0 hover:bg-accent/80">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {CLASSES.map(cls => (
                  <SelectItem key={cls} value={cls}>
                    {cls}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="h-8 w-[140px] bg-accent text-foreground border-0 hover:bg-accent/80">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {STATUSES.map(st => (
                  <SelectItem key={st} value={st}>
                    {st}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="h-8 w-[120px] bg-accent text-foreground border-0 hover:bg-accent/80">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this-month">This Month</SelectItem>
                <SelectItem value="last-month">Last Month</SelectItem>
                <SelectItem value="this-quarter">This Quarter</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )
    },
    [classFilter, statusFilter, timeFilter],
  )

  const renderPagination = React.useCallback((table: TanStackTable<FeeCollectionRecord>) => {
    const { pageIndex, pageSize: currentPageSize } = table.getState().pagination
    const totalRows = table.getFilteredRowModel().rows.length
    return (
      <GridPagination
        currentPage={pageIndex + 1}
        totalItems={totalRows}
        pageSize={currentPageSize}
        onPageChange={(page) => table.setPageIndex(page - 1)}
        onPageSizeChange={(size) => table.setPageSize(size)}
        pageSizeOptions={[10, 20, 30, 50]}
      />
    )
  }, [])

  // Zebra-striping: alternate every other row
  const rowClassName = React.useCallback((row: Row<FeeCollectionRecord>) => {
    const allRows = (row as any).table?.getRowModel?.()?.rows ?? []
    const visualIndex = allRows.findIndex((r: any) => r.id === row.id)
    return visualIndex % 2 === 1 ? 'bg-accent/30' : ''
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-[160px]" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-[140px]" />
            <Skeleton className="h-8 w-[140px]" />
            <Skeleton className="h-8 w-[120px]" />
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <DataTable
      columns={columns}
      data={groupedData}
      enableSorting
      enablePagination
      enableFiltering
      enableGlobalFilter={false}
      showToolbar={true}
      renderToolbar={renderToolbar}
      renderPagination={renderPagination}
      bodyProps={{ rowClassName }}
      tableOptions={{
        enableSortingRemoval: true,
        initialState: {
          pagination: {
            pageSize: 10,
          },
        },
      }}
    />
  )
}
