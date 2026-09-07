import { useState, useMemo, useCallback } from 'react'
import type { ColumnDef, Row } from '@tanstack/react-table'
import { Plus, Download, ChevronDown, ChevronRight, MapPin, Bus as BusIcon, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  ListToolbar,
  ListToolbarSearch,
  TOOLBAR_CONTROL_HEIGHT,
  TOOLBAR_FILTER_CONTROL,
  TOOLBAR_PRIMARY_ACTION,
} from '@/components/table'
import { cn } from '@/lib/utils'
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
import { GridPagination } from '@/components/pagination/GridPagination'
import { text, accent, border } from '@/theme/colors'
import { generateCsv, downloadCsv } from '@/lib/csv'
import { toast } from 'sonner'
import { mockRoutes } from '@/mocks/transport'
import { ROUTE_STATUS_OPTIONS, ROUTE_STATUS_COLORS } from '../constants'
import { getOccupancyColor, getOccupancyPercent } from '../utils/transport-utils'
import { RouteFormSheet } from './RouteFormSheet'
import type { TransportRoute } from '../types'

export function RoutesTab() {
  const [routes, setRoutes] = useState<TransportRoute[]>(mockRoutes)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [expandedRouteId, setExpandedRouteId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingRoute, setEditingRoute] = useState<TransportRoute | null>(null)

  const filtered = useMemo(() => {
    let result = routes
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q) ||
        r.driverName.toLowerCase().includes(q) ||
        r.vehicleName.toLowerCase().includes(q)
      )
    }
    if (statusFilter !== 'all') {
      result = result.filter(r => r.status === statusFilter)
    }
    return result
  }, [routes, searchQuery, statusFilter])

  const handleSave = useCallback((data: Partial<TransportRoute>) => {
    setRoutes(prev => {
      const exists = prev.find(r => r.id === data.id)
      if (exists) {
        return prev.map(r => r.id === data.id ? { ...r, ...data } as TransportRoute : r)
      }
      return [...prev, data as TransportRoute]
    })
    toast.success(editingRoute ? 'Route updated' : 'Route added')
    setEditingRoute(null)
  }, [editingRoute])

  const handleExport = useCallback(() => {
    const csv = generateCsv(routes as any, [
      { key: 'code', header: 'Code' },
      { key: 'name', header: 'Name' },
      { key: 'startLocation', header: 'Start' },
      { key: 'endLocation', header: 'End' },
      { key: 'type', header: 'Type' },
      { key: 'distanceKm', header: 'Distance (km)' },
      { key: 'vehicleName', header: 'Vehicle' },
      { key: 'driverName', header: 'Driver' },
      { key: 'studentsAssigned', header: 'Students' },
      { key: 'capacity', header: 'Capacity' },
      { key: 'status', header: 'Status' },
    ])
    downloadCsv(csv, 'routes-export.csv')
  }, [routes])

  const toggleExpand = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedRouteId(prev => prev === id ? null : id)
  }, [])

  const columns: ColumnDef<TransportRoute>[] = useMemo(() => [
    {
      accessorKey: 'code',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Code" />,
      cell: ({ row }) => (
        <span className="text-xs font-semibold" style={{ color: text.heading }}>{row.original.code}</span>
      ),
    },
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Route Name" />,
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium">{row.original.name}</span>
          <span className="text-[10px] text-muted-foreground">
            {row.original.type === 'two-way' ? 'Two-Way' : 'One-Way'} &middot; {row.original.distanceKm} km &middot; {row.original.estimatedDuration}
          </span>
        </div>
      ),
    },
    {
      id: 'startEnd',
      header: 'Start / End',
      cell: ({ row }) => <span className="text-xs">{row.original.startLocation} → {row.original.endLocation}</span>,
      enableSorting: false,
    },
    {
      id: 'stops',
      header: 'Stops',
      cell: ({ row }) => {
        const isExpanded = expandedRouteId === row.original.id
        return (
          <button
            onClick={e => toggleExpand(row.original.id, e)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all hover:shadow-sm"
            style={{
              backgroundColor: isExpanded ? accent.base : accent.soft,
              color: text.heading,
              border: `1.5px solid ${isExpanded ? accent.active : accent.base}`,
            }}
          >
            <MapPin className="size-3.5" style={{ color: text.heading }} />
            {row.original.stops.length} stops
            {isExpanded
              ? <ChevronDown className="size-4" strokeWidth={2.5} style={{ color: text.heading }} />
              : <ChevronRight className="size-4" strokeWidth={2.5} style={{ color: text.heading }} />}
          </button>
        )
      },
      enableSorting: false,
    },
    {
      accessorKey: 'vehicleName',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Vehicle" />,
      cell: ({ row }) => <span className="text-xs">{row.original.vehicleName || '—'}</span>,
    },
    {
      accessorKey: 'driverName',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Driver" />,
      cell: ({ row }) => <span className="text-xs">{row.original.driverName || '—'}</span>,
    },
    {
      id: 'occupancy',
      header: 'Occupancy',
      cell: ({ row }) => {
        const pct = getOccupancyPercent(row.original.studentsAssigned, row.original.capacity)
        const color = getOccupancyColor(row.original.studentsAssigned, row.original.capacity)
        return (
          <div className="flex items-center gap-2 min-w-[100px]">
            <div className="flex-1 h-1.5 rounded-full bg-muted">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
            </div>
            <span className="text-xs whitespace-nowrap">{row.original.studentsAssigned}/{row.original.capacity}</span>
          </div>
        )
      },
      enableSorting: false,
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => <StatusPill label={row.original.status} config={ROUTE_STATUS_COLORS[row.original.status]} />,
    },
  ], [expandedRouteId, toggleExpand])

  const renderToolbar = useCallback(() => (
    <Tile
      id="routes-toolbar"
      layoutMode="block"
      background="default"
      borderRadius="lg"
      padding="p-4"
    >
      <ListToolbar
        title={<h2 className="text-page-title text-heading">Routes</h2>}
        search={
          <ListToolbarSearch
            placeholder="Search routes"
            value={searchQuery}
            onValueChange={v => { setSearchQuery(v) }}
            className="md:min-w-[160px] md:max-w-[300px]"
          />
        }
        filters={[
          {
            id: 'status',
            label: 'Status',
            inlineLabel: true,
            isActive: statusFilter !== 'all',
            control: (
              <Select value={statusFilter} onValueChange={v => { setStatusFilter(v) }}>
                <SelectTrigger
                  className={cn(TOOLBAR_CONTROL_HEIGHT, 'w-[120px]', TOOLBAR_FILTER_CONTROL)}
                  style={{ backgroundColor: accent.base, color: text.heading, borderColor: accent.base }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {ROUTE_STATUS_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            ),
          },
        ]}
        secondaryActions={[
          { id: 'export', label: 'Export', icon: <Download className="size-3.5" />, onSelect: handleExport },
        ]}
        primaryAction={
          <Button
            onClick={() => { setEditingRoute(null); setFormOpen(true) }}
            className={cn(TOOLBAR_PRIMARY_ACTION, 'bg-primary hover:bg-primary/90 text-foreground')}
          >
            <Plus className="size-4" />
            Add Route
          </Button>
        }
      />
    </Tile>
  ), [searchQuery, statusFilter, handleExport])

  const handleRowClick = useCallback((row: Row<TransportRoute>) => {
    setEditingRoute(row.original)
    setFormOpen(true)
  }, [])

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={filtered}
        enableSorting
        enablePagination
        enableFiltering={false}
        showToolbar
        renderToolbar={() => renderToolbar()}
        containerClassName="space-y-4"
        tableWrapperClassName="rounded-lg border-0 shadow-sm bg-white overflow-hidden"
        showBorder={false}
        bodyProps={{
          renderRow: (row) => {
            const route = row.original
            const isExpanded = expandedRouteId === route.id
            return (
              <>
                <tr
                  key={row.id}
                  onClick={() => handleRowClick(row)}
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
                {isExpanded && (
                  <tr key={`detail-${row.id}`}>
                    <td colSpan={row.getVisibleCells().length} className="p-0">
                      <div
                        className="px-6 py-4 border-t"
                        style={{ backgroundColor: accent.soft, borderColor: border.default }}
                      >
                        {/* Route summary */}
                        <div className="flex items-center gap-6 mb-3">
                          <div className="flex items-center gap-1.5">
                            <BusIcon className="size-3.5 text-muted-foreground" />
                            <span className="text-xs" style={{ color: text.heading }}>{route.vehicleName || 'No vehicle'}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <User className="size-3.5 text-muted-foreground" />
                            <span className="text-xs" style={{ color: text.heading }}>{route.driverName || 'No driver'}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {route.studentsAssigned}/{route.capacity} students
                          </span>
                        </div>

                        {/* Stops mini-table */}
                        <div className="rounded-lg overflow-hidden bg-white border" style={{ borderColor: border.default }}>
                          <table className="w-full">
                            <thead>
                              <tr style={{ backgroundColor: accent.base }}>
                                <th className="text-[10px] font-medium text-left px-3 py-2 w-8" style={{ color: text.heading }}>#</th>
                                <th className="text-[10px] font-medium text-left px-3 py-2" style={{ color: text.heading }}>Stop Name</th>
                                <th className="text-[10px] font-medium text-center px-3 py-2 w-20" style={{ color: text.heading }}>Pickup</th>
                                <th className="text-[10px] font-medium text-center px-3 py-2 w-20" style={{ color: text.heading }}>Drop</th>
                                <th className="text-[10px] font-medium text-right px-3 py-2 w-20" style={{ color: text.heading }}>Students</th>
                              </tr>
                            </thead>
                            <tbody>
                              {route.stops.map(stop => (
                                <tr key={stop.id} className="border-t" style={{ borderColor: border.subtle }}>
                                  <td className="text-xs text-muted-foreground px-3 py-2">{stop.sequence}</td>
                                  <td className="text-xs font-medium px-3 py-2" style={{ color: text.heading }}>{stop.name}</td>
                                  <td className="text-xs text-center text-muted-foreground px-3 py-2">{stop.pickupTime}</td>
                                  <td className="text-xs text-center text-muted-foreground px-3 py-2">{stop.dropTime}</td>
                                  <td className="text-xs text-right font-medium px-3 py-2" style={{ color: text.heading }}>{stop.studentsCount}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            )
          },
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

      <RouteFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        route={editingRoute}
        onSave={handleSave}
      />
    </div>
  )
}
