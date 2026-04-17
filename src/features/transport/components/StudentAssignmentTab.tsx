import { useState, useMemo, useCallback } from 'react'
import type { ColumnDef, Row } from '@tanstack/react-table'
import { Search, Plus, Download, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tile } from '@/components/tile'
import { StatusPill } from '@/components/ui/status-pill'
import { DataTable } from '@/components/table'
import { DataTableColumnHeader } from '@/components/table/header/DataTableColumnHeader'
import { CompactTable, type CompactTableColumn } from '@/components/ui/compact-table'
import { GridPagination } from '@/components/pagination/GridPagination'
import { ImportDialog, type ImportColumn } from '@/components/shared/ImportDialog'
import { text, accent } from '@/theme/colors'
import { generateCsv, downloadCsv } from '@/lib/csv'
import { toast } from 'sonner'
import { mockStudentAssignments, mockRoutes, mockVehicles } from '@/mocks/transport'
import { FEE_STATUS_COLORS } from '../constants'
import { AssignStudentDialog } from './AssignStudentDialog'
import type { StudentTransportAssignment } from '../types'

type GroupBy = 'none' | 'route' | 'vehicle' | 'pickup-stop' | 'drop-stop'

export function StudentAssignmentTab() {
  const [assignments, setAssignments] = useState<StudentTransportAssignment[]>(mockStudentAssignments)
  const [searchQuery, setSearchQuery] = useState('')
  const [routeFilter, setRouteFilter] = useState<string>('all')
  const [groupBy, setGroupBy] = useState<GroupBy>('none')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<StudentTransportAssignment | null>(null)
  const [importOpen, setImportOpen] = useState(false)

  const filtered = useMemo(() => {
    let result = assignments
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(a =>
        a.studentName.toLowerCase().includes(q) ||
        a.class.toLowerCase().includes(q) ||
        a.routeName.toLowerCase().includes(q) ||
        a.stopName.toLowerCase().includes(q)
      )
    }
    if (routeFilter !== 'all') {
      result = result.filter(a => a.routeId === routeFilter)
    }
    return result
  }, [assignments, searchQuery, routeFilter])

  // Group the filtered data
  const grouped = useMemo(() => {
    if (groupBy === 'none') return null

    const groups: Record<string, StudentTransportAssignment[]> = {}
    filtered.forEach(a => {
      let key: string
      switch (groupBy) {
        case 'route':
          key = a.routeName || 'Unassigned'
          break
        case 'vehicle': {
          const route = mockRoutes.find(r => r.id === a.routeId)
          const vehicle = route ? mockVehicles.find(v => v.id === route.vehicleId) : null
          key = vehicle ? `${vehicle.registrationNumber} (${vehicle.type})` : 'Unassigned'
          break
        }
        case 'pickup-stop':
          key = a.stopName ? `${a.stopName} — Pickup ${a.pickupTime}` : 'Unassigned'
          break
        case 'drop-stop':
          key = a.stopName ? `${a.stopName} — Drop ${a.dropTime}` : 'Unassigned'
          break
        default:
          key = 'All'
      }
      if (!groups[key]) groups[key] = []
      groups[key].push(a)
    })

    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  }, [filtered, groupBy])

  const handleSave = useCallback((data: Partial<StudentTransportAssignment>) => {
    setAssignments(prev => {
      const exists = prev.find(a => a.id === data.id)
      if (exists) {
        return prev.map(a => a.id === data.id ? { ...a, ...data } as StudentTransportAssignment : a)
      }
      return [...prev, data as StudentTransportAssignment]
    })
    toast.success(editingAssignment ? 'Assignment updated' : 'Student assigned')
    setEditingAssignment(null)
  }, [editingAssignment])

  const handleExport = useCallback(() => {
    const csv = generateCsv(assignments as any, [
      { key: 'studentName', header: 'Student Name' },
      { key: 'class', header: 'Class' },
      { key: 'section', header: 'Section' },
      { key: 'routeName', header: 'Route' },
      { key: 'stopName', header: 'Stop' },
      { key: 'pickupTime', header: 'Pickup' },
      { key: 'dropTime', header: 'Drop' },
      { key: 'type', header: 'Type' },
      { key: 'feeStatus', header: 'Fee Status' },
    ])
    downloadCsv(csv, 'student-transport-export.csv')
  }, [assignments])

  const importColumns: ImportColumn[] = useMemo(() => [
    { csvHeader: 'Student Name', fieldKey: 'studentName', label: 'Student Name', required: true },
    { csvHeader: 'Student ID', fieldKey: 'studentId', label: 'Student ID', required: true },
    { csvHeader: 'Class', fieldKey: 'class', label: 'Class', required: true },
    { csvHeader: 'Section', fieldKey: 'section', label: 'Section', required: true },
    { csvHeader: 'Route', fieldKey: 'routeName', label: 'Route' },
    { csvHeader: 'Stop', fieldKey: 'stopName', label: 'Stop' },
    { csvHeader: 'Type', fieldKey: 'type', label: 'Type', type: 'enum', enumValues: ['one-way', 'two-way'] },
  ], [])

  const handleImport = useCallback(async (rows: Record<string, string>[]) => {
    const newAssignments = rows.map((row, i) => ({
      id: `STA-IMP-${Date.now()}-${i}`,
      studentId: row['Student ID'] || `S-IMP-${i}`,
      studentName: row['Student Name'] || '',
      class: row['Class'] || '',
      section: row['Section'] || '',
      routeId: '',
      routeName: row['Route'] || '',
      stopId: '',
      stopName: row['Stop'] || '',
      pickupTime: '',
      dropTime: '',
      type: (row['Type'] || 'two-way') as 'one-way' | 'two-way',
      feeStatus: 'Pending' as const,
    }))
    setAssignments(prev => [...prev, ...newAssignments])
    toast.success(`${rows.length} students imported`)
  }, [])

  // DataTable columns (flat view)
  const dtColumns: ColumnDef<StudentTransportAssignment>[] = useMemo(() => [
    {
      accessorKey: 'studentName',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Student Name" />,
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
      accessorKey: 'stopName',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Stop" />,
      cell: ({ row }) => <span className="text-xs">{row.original.stopName}</span>,
    },
    {
      accessorKey: 'pickupTime',
      header: 'Pickup',
      cell: ({ row }) => <span className="text-xs">{row.original.pickupTime}</span>,
      enableSorting: false,
    },
    {
      accessorKey: 'dropTime',
      header: 'Drop',
      cell: ({ row }) => <span className="text-xs">{row.original.dropTime}</span>,
      enableSorting: false,
    },
    {
      accessorKey: 'type',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
      cell: ({ row }) => <span className="text-xs">{row.original.type === 'two-way' ? 'Two-Way' : 'One-Way'}</span>,
    },
    {
      accessorKey: 'feeStatus',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Fee Status" />,
      cell: ({ row }) => <StatusPill label={row.original.feeStatus} config={FEE_STATUS_COLORS[row.original.feeStatus]} />,
    },
  ], [])

  // CompactTable columns (grouped view)
  const groupedColumns: CompactTableColumn<StudentTransportAssignment>[] = useMemo(() => [
    { key: 'studentName', header: 'Student Name', cellWeight: 600, cellColor: text.heading },
    { key: 'class', header: 'Class', render: (row) => <span>{row.class}-{row.section}</span> },
    { key: 'routeName', header: 'Route' },
    { key: 'stopName', header: 'Stop' },
    { key: 'pickupTime', header: 'Pickup', cellNowrap: true },
    { key: 'dropTime', header: 'Drop', cellNowrap: true },
    { key: 'type', header: 'Type', render: (row) => <span className="text-xs">{row.type === 'two-way' ? 'Two-Way' : 'One-Way'}</span> },
    { key: 'feeStatus', header: 'Fee Status', render: (row) => <StatusPill label={row.feeStatus} config={FEE_STATUS_COLORS[row.feeStatus]} /> },
  ], [])

  const renderClickableRow = useCallback((row: Row<StudentTransportAssignment>) => (
    <tr
      key={row.id}
      onClick={() => { setEditingAssignment(row.original); setDialogOpen(true) }}
      className="cursor-pointer hover:bg-muted/50 transition-colors"
    >
      {row.getVisibleCells().map(cell => (
        <td key={cell.id} className="px-3 py-2.5 text-sm">
          {typeof cell.column.columnDef.cell === 'function'
            ? cell.column.columnDef.cell(cell.getContext())
            : cell.getValue() as string}
        </td>
      ))}
    </tr>
  ), [])

  const toolbar = (
    <Tile
      id="students-transport-toolbar"
      layoutMode="block"
      background="default"
      borderRadius="lg"
      padding="p-4"
      className="flex items-center justify-between gap-4 flex-wrap"
    >
      <h2 className="text-page-title text-heading">Student Assignments</h2>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative min-w-[160px] max-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search students"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="h-8 w-full pl-10 bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Route:</span>
          <Select value={routeFilter} onValueChange={setRouteFilter}>
            <SelectTrigger
              className="h-8 w-[160px]"
              style={{ backgroundColor: accent.base, color: text.heading, borderColor: accent.base }}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Routes</SelectItem>
              {mockRoutes.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Group by:</span>
          <Select value={groupBy} onValueChange={v => setGroupBy(v as GroupBy)}>
            <SelectTrigger
              className="h-8 w-[140px]"
              style={{ backgroundColor: accent.base, color: text.heading, borderColor: accent.base }}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="route">Route</SelectItem>
              <SelectItem value="vehicle">Vehicle</SelectItem>
              <SelectItem value="pickup-stop">Pickup Stop</SelectItem>
              <SelectItem value="drop-stop">Drop Stop</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" onClick={handleExport} className="h-8 gap-1.5">
          <Download className="size-3.5" />
          Export
        </Button>

        <Button variant="outline" onClick={() => setImportOpen(true)} className="h-8 gap-1.5">
          <Upload className="size-3.5" />
          Import
        </Button>

        <Button
          onClick={() => { setEditingAssignment(null); setDialogOpen(true) }}
          className="h-8 bg-primary hover:bg-primary/90 text-foreground"
        >
          <Plus className="size-4" />
          Assign Student
        </Button>
      </div>
    </Tile>
  )

  return (
    <div className="space-y-4">
      {toolbar}

      {/* Grouped View — uses CompactTable for section-based layout */}
      {grouped ? (
        <div className="space-y-3">
          {grouped.map(([groupName, items]) => (
            <Tile key={groupName} id={`group-${groupName}`} layoutMode="block" background="card" borderRadius="lg" shadowed padding={0}>
              <div
                className="flex items-center justify-between px-4 py-2.5 border-b"
                style={{ borderColor: accent.base, backgroundColor: accent.soft }}
              >
                <span className="text-sm font-semibold" style={{ color: text.heading }}>
                  {groupName}
                </span>
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: accent.base, color: text.heading }}
                >
                  {items.length} {items.length === 1 ? 'student' : 'students'}
                </span>
              </div>
              <CompactTable
                columns={groupedColumns}
                data={items}
                rowKey={a => a.id}
                onRowClick={(a) => { setEditingAssignment(a); setDialogOpen(true) }}
              />
            </Tile>
          ))}
        </div>
      ) : (
        /* Flat View — uses DataTable for consistency with rest of app */
        <DataTable
          columns={dtColumns}
          data={filtered}
          enableSorting
          enablePagination
          enableFiltering={false}
          showToolbar={false}
          enableGlobalFilter={false}
          tableWrapperClassName="rounded-lg border-0 shadow-sm bg-white overflow-hidden"
          showBorder={false}
          bodyProps={{
            renderRow: renderClickableRow,
          }}
          renderPagination={(table) => (
            <GridPagination
              currentPage={table.getState().pagination.pageIndex + 1}
              totalItems={table.getFilteredRowModel().rows.length}
              pageSize={table.getState().pagination.pageSize}
              onPageChange={(page) => table.setPageIndex(page - 1)}
              onPageSizeChange={(size) => { table.setPageSize(size); table.setPageIndex(0) }}
              pageSizeOptions={[10, 20, 50]}
            />
          )}
        />
      )}

      <AssignStudentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        assignment={editingAssignment}
        onSave={handleSave}
      />

      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        title="Import Student Assignments"
        columns={importColumns}
        templateSampleRows={[
          ['Aarav Sharma', 'S-001', '10A', 'A', 'Route A - Jayanagar', 'Jayanagar 9th Block', 'two-way'],
        ]}
        onImport={handleImport}
      />
    </div>
  )
}
