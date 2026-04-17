import { useState, useMemo, useCallback } from 'react'
import { Search, Plus, Download } from 'lucide-react'
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
import { GridPagination } from '@/components/pagination/GridPagination'
import { text, accent } from '@/theme/colors'
import { generateCsv, downloadCsv } from '@/lib/csv'
import { toast } from 'sonner'
import { mockVehicles } from '@/mocks/transport'
import { VEHICLE_STATUS_OPTIONS } from '../constants'
import { VehicleCard } from './VehicleCard'
import { VehicleDialog } from './VehicleDialog'
import type { Vehicle } from '../types'

export function VehiclesTab() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(mockVehicles)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(8)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)

  const filtered = useMemo(() => {
    let result = vehicles
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(v =>
        v.registrationNumber.toLowerCase().includes(q) ||
        v.routeName.toLowerCase().includes(q) ||
        v.driverName.toLowerCase().includes(q) ||
        v.make.toLowerCase().includes(q)
      )
    }
    if (statusFilter !== 'all') {
      result = result.filter(v => v.status === statusFilter)
    }
    return result
  }, [vehicles, searchQuery, statusFilter])

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, currentPage, pageSize])

  const handleEdit = useCallback((vehicle: Vehicle) => {
    setEditingVehicle(vehicle)
    setDialogOpen(true)
  }, [])

  const handleDelete = useCallback((id: string) => {
    setVehicles(prev => prev.filter(v => v.id !== id))
    toast.success('Vehicle removed')
  }, [])

  const handleSave = useCallback((data: Partial<Vehicle>) => {
    setVehicles(prev => {
      const exists = prev.find(v => v.id === data.id)
      if (exists) {
        return prev.map(v => v.id === data.id ? { ...v, ...data } as Vehicle : v)
      }
      return [...prev, { ...mockVehicles[0], ...data } as Vehicle]
    })
    toast.success(editingVehicle ? 'Vehicle updated' : 'Vehicle added')
    setEditingVehicle(null)
  }, [editingVehicle])

  const handleExport = useCallback(() => {
    const csv = generateCsv(vehicles as any, [
      { key: 'registrationNumber', header: 'Registration' },
      { key: 'type', header: 'Type' },
      { key: 'make', header: 'Make' },
      { key: 'model', header: 'Model' },
      { key: 'capacity', header: 'Capacity' },
      { key: 'driverName', header: 'Driver' },
      { key: 'routeName', header: 'Route' },
      { key: 'status', header: 'Status' },
    ])
    downloadCsv(csv, 'vehicles-export.csv')
  }, [vehicles])

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Tile
        id="vehicles-toolbar"
        layoutMode="block"
        background="default"
        borderRadius="lg"
        padding="p-4"
        className="flex items-center justify-between gap-4 flex-wrap"
      >
        <h2 className="text-page-title text-heading">Vehicles</h2>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative min-w-[160px] max-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search vehicles"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1) }}
              className="h-8 w-full pl-10 bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Status:</span>
            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setCurrentPage(1) }}>
              <SelectTrigger
                className="h-8 w-[150px]"
                style={{ backgroundColor: accent.base, color: text.heading, borderColor: accent.base }}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {VEHICLE_STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" onClick={handleExport} className="h-8 gap-1.5">
            <Download className="size-3.5" />
            Export
          </Button>

          <Button
            onClick={() => { setEditingVehicle(null); setDialogOpen(true) }}
            className="h-8 bg-primary hover:bg-primary/90 text-foreground"
          >
            <Plus className="size-4" />
            Add Vehicle
          </Button>
        </div>
      </Tile>

      {/* Vehicle Cards Grid */}
      {paginated.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">
            {searchQuery || statusFilter !== 'all' ? 'No vehicles found matching your filters.' : 'No vehicles available.'}
          </div>
        </div>
      ) : (
        <>
          <TileWrapper columns={{ default: 1, md: 2, lg: 4 }} gap={12}>
            {paginated.map(vehicle => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </TileWrapper>

          {filtered.length > pageSize && (
            <GridPagination
              currentPage={currentPage}
              totalItems={filtered.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={s => { setPageSize(s); setCurrentPage(1) }}
              pageSizeOptions={[8, 16, 24]}
            />
          )}
        </>
      )}

      <VehicleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        vehicle={editingVehicle}
        onSave={handleSave}
      />
    </div>
  )
}
