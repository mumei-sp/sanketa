import { useState, useMemo, useCallback } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, IndianRupee, CheckCircle, Clock, AlertCircle, Search, Download, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { text, accent, status } from '@/theme/colors'
import { generateCsv, downloadCsv } from '@/lib/csv'
import { toast } from 'sonner'
import { mockFeeStructures, mockStudentAssignments } from '../mocks'
import { FEE_STATUS_COLORS } from '../constants'
import { formatCurrency } from '../utils/transport-utils'
import { FeeStructureDialog } from './FeeStructureDialog'
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

export function TransportFeesTab() {
  const [feeStructures, setFeeStructures] = useState<TransportFeeStructure[]>(mockFeeStructures)
  const [dialogOpen, setDialogOpen] = useState(false)
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
      iconBg: accent.base,
      iconColor: text.heading,
    },
    {
      id: 'total-collected',
      label: 'Collected (₹)',
      value: feeSummary.totalCollected,
      icon: CheckCircle,
      iconBg: status.success.soft,
      iconColor: status.success.text,
    },
    {
      id: 'total-pending',
      label: 'Pending (₹)',
      value: feeSummary.totalPending,
      icon: Clock,
      iconBg: status.warning.soft,
      iconColor: status.warning.text,
    },
    {
      id: 'overdue-count',
      label: 'Overdue Students',
      value: feeSummary.overdue,
      icon: AlertCircle,
      iconBg: status.danger.soft,
      iconColor: status.danger.text,
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
  const handleExport = useCallback(() => {
    const csv = generateCsv(filteredStudents as any, [
      { key: 'studentName', header: 'Student' },
      { key: 'class', header: 'Class' },
      { key: 'routeName', header: 'Route' },
      { key: 'type', header: 'Type' },
      { key: 'feeStatus', header: 'Status' },
    ])
    downloadCsv(csv, 'transport-fees-export.csv')
  }, [filteredStudents])

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
            className="size-7 opacity-0 group-hover/row:opacity-100 text-destructive transition-opacity"
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
          <Button
            onClick={() => { setEditingFee(null); setDialogOpen(true) }}
            className="h-8 bg-primary hover:bg-primary/90 text-foreground"
            size="sm"
          >
            <Plus className="size-3.5" />
            Add Fee
          </Button>
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
                onClick={() => { setEditingFee(row.original); setDialogOpen(true) }}
                className="group/row cursor-pointer hover:bg-muted/50 transition-colors"
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
        <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
          <h3 className="text-section-title" style={{ color: text.heading }}>Student Fee Status</h3>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative min-w-[140px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-8 w-full pl-9 bg-white text-xs"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger
                className="h-8 w-[110px] text-xs"
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
            <Button variant="outline" onClick={handleExport} className="h-8 gap-1 text-xs">
              <Download className="size-3" />
              Export
            </Button>
          </div>
        </div>
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

      <FeeStructureDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        feeStructure={editingFee}
        onSave={handleSave}
      />
    </div>
  )
}
