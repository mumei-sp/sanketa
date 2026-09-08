import * as React from 'react'
import { Download, Wallet } from 'lucide-react'
import { useCsvExport } from '@/lib/use-csv-export'
import type { Row, Table as TanStackTable } from '@tanstack/react-table'
import { DataTable, MobileRecordCard } from '@/components/table'
import { GridPagination } from '@/components/pagination/GridPagination'
import { Skeleton } from '@/components/ui/skeleton'
import { createFeeCollectionColumns, FeeStatusPill } from './fee-collection-columns'
import type { FeeCollectionRecord, FeeStatus } from '@/features/fees-collection/types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSchoolConfig } from '@/config/SchoolConfigContext'
import { getClassLabels } from '@/utils/class-section-helpers'
import { cn } from '@/lib/utils'
import {
  ListToolbar,
  ListToolbarSearch,
  TOOLBAR_CONTROL_HEIGHT,
  TOOLBAR_FILTER_CONTROL,
} from '@/components/table'

/** Shared look for the accent filter selects in this toolbar. */
const FILTER_TRIGGER = 'bg-accent text-foreground border-0 hover:bg-accent/80'

interface FeeCollectionTableProps {
  data: FeeCollectionRecord[]
  isLoading?: boolean
  onRowClick?: (record: FeeCollectionRecord) => void
}
const STATUSES: FeeStatus[] = ['Paid', 'Pending', 'Partially Paid', 'Overdue']

const EXPORT_COLUMNS = [
  { key: 'studentId' as const, header: 'Student ID' },
  { key: 'studentName' as const, header: 'Student' },
  { key: 'class' as const, header: 'Class' },
  { key: 'feeCategory' as const, header: 'Fee Category' },
  { key: 'totalAmount' as const, header: 'Total' },
  { key: 'paidAmount' as const, header: 'Paid' },
  { key: 'dueDate' as const, header: 'Due Date' },
  { key: 'status' as const, header: 'Status' },
  { key: 'paymentMethod' as const, header: 'Method' },
  { key: 'transactionId' as const, header: 'Transaction ID' },
  { key: 'receiptId' as const, header: 'Receipt ID' },
]

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

export function FeeCollectionTable({ data, isLoading = false, onRowClick }: FeeCollectionTableProps) {
  const { config } = useSchoolConfig()
  const classLabels = React.useMemo(() => getClassLabels(config.classSections), [config.classSections])
  const [classFilter, setClassFilter] = React.useState<string>('all')
  const [statusFilter, setStatusFilter] = React.useState<string>('all')
  const [timeFilter, setTimeFilter] = React.useState<string>('this-month')

  // Always keep student records grouped together
  const groupedData = React.useMemo(() => ensureStudentGrouping(data ?? []), [data])

  const exportCsv = useCsvExport({
    rows: groupedData,
    columns: EXPORT_COLUMNS,
    filename: 'fees-collection',
    label: 'fee records',
  })

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
      const studentColumn = table.getColumn('studentName')
      const searchValue = (studentColumn?.getFilterValue() as string) || ''

      const handleSearchChange = (value: string) => {
        if (studentColumn) {
          studentColumn.setFilterValue(value || undefined)
        }
      }

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
        <ListToolbar
          title="Fees Collection"
          search={
            <ListToolbarSearch
              placeholder="Search by name or ID"
              value={searchValue}
              onValueChange={v => handleSearchChange(v)}
            />
          }
          filters={[
            {
              id: 'class',
              label: 'Class',
              isActive: classFilter !== 'all',
              control: (
                <Select value={classFilter} onValueChange={handleClassChange}>
                  <SelectTrigger className={cn(TOOLBAR_CONTROL_HEIGHT, FILTER_TRIGGER, 'w-[140px]', TOOLBAR_FILTER_CONTROL)}>
                    <SelectValue placeholder="All Classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classLabels.map(cls => (
                      <SelectItem key={cls} value={cls}>
                        {cls}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ),
            },
            {
              id: 'status',
              label: 'Status',
              isActive: statusFilter !== 'all',
              control: (
                <Select value={statusFilter} onValueChange={handleStatusChange}>
                  <SelectTrigger className={cn(TOOLBAR_CONTROL_HEIGHT, FILTER_TRIGGER, 'w-[140px]', TOOLBAR_FILTER_CONTROL)}>
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
              ),
            },
            {
              id: 'period',
              label: 'Period',
              isActive: timeFilter !== 'this-month',
              control: (
                <Select value={timeFilter} onValueChange={setTimeFilter}>
                  <SelectTrigger className={cn(TOOLBAR_CONTROL_HEIGHT, FILTER_TRIGGER, 'w-[120px]', TOOLBAR_FILTER_CONTROL)}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="this-month">This Month</SelectItem>
                    <SelectItem value="last-month">Last Month</SelectItem>
                    <SelectItem value="this-quarter">This Quarter</SelectItem>
                  </SelectContent>
                </Select>
              ),
            },
          ]}
          secondaryActions={[
            { id: 'export', label: 'Export', icon: <Download className="size-4" />, onSelect: exportCsv },
          ]}
        />
      )
    },
    [classFilter, statusFilter, timeFilter, exportCsv],
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

  // Below `lg` each fee row becomes a card — the six columns can't be read
  // side by side on a phone.
  const renderMobileCard = React.useCallback(
    (row: Row<FeeCollectionRecord>) => {
      const record = row.original
      return (
        <MobileRecordCard
          title={record.studentName}
          subtitle={`${record.studentId} · ${record.class}`}
          trailing={<FeeStatusPill status={record.status} />}
          fields={[
            { label: 'Fee Category', value: record.feeCategory },
            { label: 'Total Amount', value: `₹${record.totalAmount.toLocaleString('en-IN')}` },
            { label: 'Due Date', value: record.dueDate },
          ]}
          onClick={onRowClick ? () => onRowClick(record) : undefined}
        />
      )
    },
    [onRowClick],
  )

  // Zebra-striping + cursor pointer when clickable
  const rowClassName = React.useCallback((row: Row<FeeCollectionRecord>) => {
    const allRows = (row as any).table?.getRowModel?.()?.rows ?? []
    const visualIndex = allRows.findIndex((r: any) => r.id === row.id)
    const zebra = visualIndex % 2 === 1 ? 'bg-accent/30' : ''
    return onRowClick ? `${zebra} cursor-pointer hover:bg-accent/50` : zebra
  }, [onRowClick])

  const handleRowClick = React.useCallback((row: Row<FeeCollectionRecord>) => {
    onRowClick?.(row.original)
  }, [onRowClick])

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
      renderMobileCard={renderMobileCard}
      empty={{
        icon: <Wallet />,
        title: 'No fee records',
        description: 'Fees appear here once they are raised against a student.',
      }}
      bodyProps={{
        rowClassName,
        renderRow: onRowClick ? (row) => (
          <tr
            key={row.id}
            onClick={() => handleRowClick(row)}
            className={typeof rowClassName === 'function' ? rowClassName(row) : rowClassName}
          >
            {row.getVisibleCells().map(cell => (
              <td key={cell.id} className="px-3 py-2.5 text-sm">
                {typeof cell.column.columnDef.cell === 'function'
                  ? cell.column.columnDef.cell(cell.getContext())
                  : cell.getValue() as string}
              </td>
            ))}
          </tr>
        ) : undefined,
      }}
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
