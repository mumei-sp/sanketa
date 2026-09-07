import { useState, useMemo, useCallback } from 'react'
import { Plus, Download } from 'lucide-react'
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
import { TileWrapper, Tile } from '@/components/tile'
import { GridPagination } from '@/components/pagination/GridPagination'
import { text, accent } from '@/theme/colors'
import { generateCsv, downloadCsv } from '@/lib/csv'
import { toast } from 'sonner'
import { mockDrivers } from '@/mocks/transport'
import { DRIVER_STATUS_OPTIONS } from '../constants'
import { DriverCard } from './DriverCard'
import { DriverFormSheet } from './DriverFormSheet'
import type { TransportDriver } from '../types'

export function DriversTab() {
  const [drivers, setDrivers] = useState<TransportDriver[]>(mockDrivers)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(8)
  const [formOpen, setFormOpen] = useState(false)
  const [editingDriver, setEditingDriver] = useState<TransportDriver | null>(null)

  const filtered = useMemo(() => {
    let result = drivers
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(d =>
        `${d.firstName} ${d.lastName}`.toLowerCase().includes(q) ||
        d.licenseNumber.toLowerCase().includes(q) ||
        d.phone.includes(q)
      )
    }
    if (statusFilter !== 'all') {
      result = result.filter(d => d.status === statusFilter)
    }
    return result
  }, [drivers, searchQuery, statusFilter])

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, currentPage, pageSize])

  const handleEdit = useCallback((driver: TransportDriver) => {
    setEditingDriver(driver)
    setFormOpen(true)
  }, [])

  const handleDelete = useCallback((id: string) => {
    setDrivers(prev => prev.filter(d => d.id !== id))
    toast.success('Driver removed')
  }, [])

  const handleSave = useCallback((data: Partial<TransportDriver>) => {
    setDrivers(prev => {
      const exists = prev.find(d => d.id === data.id)
      if (exists) {
        return prev.map(d => d.id === data.id ? { ...d, ...data } as TransportDriver : d)
      }
      return [...prev, { ...mockDrivers[0], ...data } as TransportDriver]
    })
    toast.success(editingDriver ? 'Driver updated' : 'Driver added')
    setEditingDriver(null)
  }, [editingDriver])

  const handleExport = useCallback(() => {
    const csv = generateCsv(drivers as any, [
      { key: 'firstName', header: 'First Name' },
      { key: 'lastName', header: 'Last Name' },
      { key: 'phone', header: 'Phone' },
      { key: 'licenseNumber', header: 'License No' },
      { key: 'licenseExpiry', header: 'License Expiry' },
      { key: 'experience', header: 'Experience (yrs)' },
      { key: 'status', header: 'Status' },
    ])
    downloadCsv(csv, 'drivers-export.csv')
  }, [drivers])

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Tile
        id="drivers-toolbar"
        layoutMode="block"
        background="default"
        borderRadius="lg"
        padding="p-4"
        >
        <ListToolbar
          title={<h2 className="text-page-title text-heading">Drivers</h2>}
          search={
            <ListToolbarSearch
              placeholder="Search drivers"
              value={searchQuery}
              onValueChange={v => { setCurrentPage(1); setSearchQuery(v) }}
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
                <Select value={statusFilter} onValueChange={v => { setCurrentPage(1); setStatusFilter(v) }}>
                  <SelectTrigger
                    className={cn(TOOLBAR_CONTROL_HEIGHT, 'w-[120px]', TOOLBAR_FILTER_CONTROL)}
                    style={{ backgroundColor: accent.base, color: text.heading, borderColor: accent.base }}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {DRIVER_STATUS_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
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
              onClick={() => { setEditingDriver(null); setFormOpen(true) }}
              className={cn(TOOLBAR_PRIMARY_ACTION, 'bg-primary hover:bg-primary/90 text-foreground')}
            >
              <Plus className="size-4" />
              Add Driver
            </Button>
          }
        />
      </Tile>

      {/* Driver Cards Grid */}
      {paginated.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">
            {searchQuery || statusFilter !== 'all' ? 'No drivers found matching your filters.' : 'No drivers available.'}
          </div>
        </div>
      ) : (
        <>
          <TileWrapper columns={{ default: 1, md: 2, lg: 4 }} gap={12}>
            {paginated.map(driver => (
              <DriverCard
                key={driver.id}
                driver={driver}
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

      <DriverFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        driver={editingDriver}
        onSave={handleSave}
      />
    </div>
  )
}
