import { useState, useMemo, useCallback } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, IndianRupee, CheckCircle, Clock, AlertCircle, Download, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  ListToolbar,
  ListToolbarSearch,
  TOOLBAR_CONTROL_HEIGHT,
  TOOLBAR_FILTER_CONTROL,
} from '@/components/table'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TileWrapper, Tile } from '@/components/tile'
import { StatusPill } from '@/components/ui/status-pill'
import { DataTable } from '@/components/table'
import { DataTableColumnHeader } from '@/components/table/header/DataTableColumnHeader'
import { GridPagination } from '@/components/pagination/GridPagination'
import { DashboardStatCard } from '@/features/dashboard/components/DashboardStatCard'
import { text, accent } from '@/theme/colors'
import { useCsvExport } from '@/lib/use-csv-export'
import { usePermissions } from '@/features/auth/PermissionContext'
import { toast } from 'sonner'
import { mockFeeStructures, mockStudentAssignments } from '@/mocks/transport'
import { FEE_STATUS_COLORS } from '../constants'
import { formatCurrency } from '../utils/transport-utils'
import { FeeStructureFormSheet } from './FeeStructureFormSheet'
import type { TransportFeeStructure, TransportStat, StudentTransportAssignment } from '../types'

/** Resolves the fee amount for a student based on their route and type */
function getStudentFee(
  assignment: StudentTransportAssignment,
  structures: TransportFeeStructure[],
): number {
  const fee = structures.find(f => f.routeId === assignment.routeId)
  if (!fee) return 0
  return assignment.type === 'one-way' ? fee.oneWayFee : fee.twoWayFee
}

/** Columns the CSV export writes, in order. */
const EXPORT_COLUMNS = [
      { key: 'studentName' as const, header: 'Student' },
      { key: 'class' as const, header: 'Class' },
      { key: 'routeName' as const, header: 'Route' },
      { key: 'type' as const, header: 'Type' },
      { key: 'feeStatus' as const, header: 'Status' },
]

export function TransportFeesTab() {
  // Viewing routes and rewriting them are different jobs: a principal reads
  // this page, the transport office edits it.
  const { can } = usePermissions()
  const canManage = can('transport.manage')
  const [feeStructures, setFeeStructures] = useState<TransportFeeStructure[]>(mockFeeStructures)
  const [formOpen, setFormOpen] = useState(false)
  const [editingFee, setEditingFee] = useState<TransportFeeStructure | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Accurate per-student fee calculation
  const feeSummary = useMemo(() => {
    let totalExpected = 0
    let totalCollected = 0
    let totalPending = 0
    let paid = 0
    let pending = 0
    let overdue = 0

    mockStudentAssignments.forEach(a => {
      const fee = getStudentFee(a, feeStructures)
      totalExpected += fee
      if (a.feeStatus === 'Paid') { totalCollected += fee; paid++ }
      else if (a.feeStatus === 'Pending') { totalPending += fee; pending++ }
      else { totalPending += fee; overdue++ }
    })

    return { paid, pending, overdue, totalExpected, totalCollected, totalPending }
  }, [feeStructures])

  const feeStats: TransportStat[] = useMemo(() => [
    {
      id: 'total-expected',
      label: 'Total Expected (₹)',
      value: feeSummary.totalExpected,
      icon: IndianRupee,
      iconBg: 'var(--primary)',
      iconColor: 'var(--primary-foreground)',
    },
    {
      id: 'total-collected',
      label: 'Collected (₹)',
      value: feeSummary.totalCollected,
      icon: CheckCircle,
      iconBg: 'var(--heading)',
      iconColor: 'var(--card)',
    },
    {
      id: 'total-pending',
      label: 'Pending (₹)',
      value: feeSummary.totalPending,
      icon: Clock,
      iconBg: 'var(--primary)',
      iconColor: 'var(--primary-foreground)',
    },
    {
      id: 'overdue-count',
      label: 'Overdue Students',
      value: feeSummary.overdue,
      icon: AlertCircle,
      iconBg: 'var(--heading)',
      iconColor: 'var(--card)',
    },
  ], [feeSummary])

  const filteredStudents = useMemo(() => {
    let result = [...mockStudentAssignments]
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(a =>
        a.studentName.toLowerCase().includes(q) ||
        a.class.toLowerCase().includes(q) ||
        a.routeName.toLowerCase().includes(q)
      )
    }
    if (statusFilter !== 'all') {
      result = result.filter(a => a.feeStatus === statusFilter)
    }
    return result
  }, [searchQuery, statusFilter])

  const handleSave = useCallback((data: Partial<TransportFeeStructure>) => {
    setFeeStructures(prev => {
      const exists = prev.find(f => f.id === data.id)
      if (exists) {
        return prev.map(f => f.id === data.id ? { ...f, ...data } as TransportFeeStructure : f)
      }
      return [...prev, data as TransportFeeStructure]
    })
    toast.success(editingFee ? 'Fee structure updated' : 'Fee structure added')
    setEditingFee(null)
  }, [editingFee])

  const handleDeleteFee = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setFeeStructures(prev => prev.filter(f => f.id !== id))
    toast.success('Fee structure removed')
  }, [])

  // Export respects current filters
  const handleExport = useCsvExport({
    rows: filteredStudents,
    columns: EXPORT_COLUMNS,
    filename: 'transport-fees',
    label: 'students',
  })

  const feeColumns: ColumnDef<TransportFeeStructure>[] = useMemo(() => [
    {
      accessorKey: 'routeName',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Route" />,
      cell: ({ row }) => <span className="text-xs font-semibold" style={{ color: text.heading }}>{row.original.routeName}</span>,
    },
    {
      accessorKey: 'distanceSlab',
      header: 'Distance',
      cell: ({ row }) => <span className="text-xs">{row.original.distanceSlab}</span>,
      enableSorting: false,
    },
    {
      accessorKey: 'oneWayFee',
      header: ({ column }) => <DataTableColumnHeader column={column} title="One-way" />,
      cell: ({ row }) => <span className="text-xs text-numeric font-medium">{formatCurrency(row.original.oneWayFee)}</span>,
    },
    {
      accessorKey: 'twoWayFee',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Two-way" />,
      cell: ({ row }) => <span className="text-xs text-numeric font-semibold" style={{ color: text.heading }}>{formatCurrency(row.original.twoWayFee)}</span>,
    },
    {
      accessorKey: 'term',
      header: 'Term',
      cell: ({ row }) => (
        <span
          className="text-[10px] font-medium px-2 py-0.5 rounded-full"
          style={{ backgroundColor: accent.soft, color: text.heading }}
        >
          {row.original.term}
        </span>
      ),
      enableSorting: false,
    },
    {
      id: 'actions',
      header: () => null,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="icon"
            className="size-7 opacity-0 touch:opacity-100 group-hover/row:opacity-100 text-destructive transition-opacity"
            onClick={(e) => handleDeleteFee(row.original.id, e)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ),
      enableSorting: false,
      size: 48,
    },
  ], [handleDeleteFee])

  const studentFeeColumns: ColumnDef<StudentTransportAssignment>[] = useMemo(() => [
    {
      accessorKey: 'studentName',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Student" />,
      cell: ({ row }) => <span className="text-xs font-semibold" style={{ color: text.heading }}>{row.original.studentName}</span>,
    },
    {
      id: 'class',
      accessorFn: (row) => `${row.class}-${row.section}`,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Class" />,
      cell: ({ row }) => <span className="text-xs">{row.original.class}-{row.original.section}</span>,
    },
    {
      accessorKey: 'routeName',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Route" />,
      cell: ({ row }) => <span className="text-xs">{row.original.routeName}</span>,
    },
    {
      accessorKey: 'type',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
      cell: ({ row }) => <span className="text-xs">{row.original.type === 'two-way' ? 'Two-Way' : 'One-Way'}</span>,
    },
    {
      id: 'amount',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
      accessorFn: (row) => getStudentFee(row, feeStructures),
      cell: ({ row }) => {
        const fee = getStudentFee(row.original, feeStructures)
        return <span className="text-xs text-numeric font-medium" style={{ color: text.heading }}>{formatCurrency(fee)}</span>
      },
    },
    {
      accessorKey: 'feeStatus',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => <StatusPill label={row.original.feeStatus} config={FEE_STATUS_COLORS[row.original.feeStatus]} />,
    },
  ], [feeStructures])

  return (
    <div className="space-y-4">
      {/* Stats */}
      <TileWrapper columns={{ default: 2, lg: 4 }} gap={12}>
        {feeStats.map(stat => (
          <DashboardStatCard key={stat.id} stat={stat} />
        ))}
      </TileWrapper>

      {/* Fee Structure */}
      <Tile
        id="fee-structure-tile"
        layoutMode="block"
        background="card"
        borderRadius="lg"
        shadowed
        padding="p-5"
        overflow="auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-section-title" style={{ color: text.heading }}>Fee Structure</h3>
          {canManage && (
            <Button
              onClick={() => { setEditingFee(null); setFormOpen(true) }}
              className="h-8 bg-primary hover:bg-primary/90 text-foreground"
              size="sm"
            >
              <Plus className="size-3.5" />
              Add Fee
            </Button>
          )}
        </div>
        <DataTable
          columns={feeColumns}
          data={feeStructures}
          enableSorting
          enablePagination={false}
          enableFiltering={false}
          showToolbar={false}
          showBorder
          bodyProps={{
            renderRow: (row) => (
              <tr
                key={row.id}
                onClick={
                  canManage
                    ? () => { setEditingFee(row.original); setFormOpen(true) }
                    : undefined
                }
                className={cn(
                  'group/row transition-colors',
                  canManage && 'cursor-pointer hover:bg-muted/50',
                )}
              >
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-3 py-2.5 text-sm">
                    {typeof cell.column.columnDef.cell === 'function'
                      ? cell.column.columnDef.cell(cell.getContext())
                      : cell.getValue() as string}
                  </td>
                ))}
              </tr>
            ),
          }}
        />
      </Tile>

      {/* Student Fee Status */}
      <Tile
        id="student-fee-tile"
        layoutMode="block"
        background="card"
        borderRadius="lg"
        shadowed
        padding="p-5"
        overflow="auto"
      >
        <ListToolbar
          className="mb-4"
          title={<h3 className="text-section-title" style={{ color: text.heading }}>Student Fee Status</h3>}
          search={
            <ListToolbarSearch
              placeholder="Search"
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="md:w-[180px]"
            />
          }
          filters={[
            {
              id: 'status',
              label: 'Status',
              isActive: statusFilter !== 'all',
              control: (
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger
                    className={cn(TOOLBAR_CONTROL_HEIGHT, 'w-[110px] text-xs', TOOLBAR_FILTER_CONTROL)}
                    style={{ backgroundColor: accent.base, color: text.heading, borderColor: accent.base }}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              ),
            },
          ]}
          secondaryActions={[
            { id: 'export', label: 'Export', icon: <Download className="size-3" />, onSelect: handleExport },
          ]}
        />
        <DataTable
          columns={studentFeeColumns}
          data={filteredStudents}
          enableSorting
          enablePagination
          enableFiltering={false}
          showToolbar={false}
          showBorder
          renderPagination={(table) => (
            <div className="mt-4">
              <GridPagination
                currentPage={table.getState().pagination.pageIndex + 1}
                totalItems={table.getFilteredRowModel().rows.length}
                pageSize={table.getState().pagination.pageSize}
                onPageChange={(page) => table.setPageIndex(page - 1)}
                onPageSizeChange={(size) => { table.setPageSize(size); table.setPageIndex(0) }}
                pageSizeOptions={[10, 20]}
              />
            </div>
          )}
        />
      </Tile>

      <FeeStructureFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        feeStructure={editingFee}
        onSave={handleSave}
      />
    </div>
  )
}
