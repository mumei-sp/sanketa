import { useState, useMemo, useCallback, useEffect } from 'react'
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
import { useCsvExport } from '@/lib/use-csv-export'
import { usePermissions } from '@/features/auth/PermissionContext'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import {
  fetchDrivers,
  saveDriver as saveDriverRequest,
  deleteDriver as deleteDriverRequest,
} from '@/api/services/transport-service'
import { DRIVER_STATUS_OPTIONS } from '../constants'
import { DriverCard } from './DriverCard'
import { DriverFormSheet } from './DriverFormSheet'
import type { TransportDriver } from '../types'

/** Columns the CSV export writes, in order. */
const EXPORT_COLUMNS = [
      { key: 'firstName' as const, header: 'First Name' },
      { key: 'lastName' as const, header: 'Last Name' },
      { key: 'phone' as const, header: 'Phone' },
      { key: 'licenseNumber' as const, header: 'License No' },
      { key: 'licenseExpiry' as const, header: 'License Expiry' },
      { key: 'experience' as const, header: 'Experience (yrs)' },
      { key: 'status' as const, header: 'Status' },
]

export function DriversTab() {
  // Viewing routes and rewriting them are different jobs: a principal reads
  // this page, the transport office edits it.
  const { can } = usePermissions()
  const canManage = can('transport.manage')
  const [drivers, setDrivers] = useState<TransportDriver[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Read through the service like every other feature. This tab used to seed
  // itself from the mock array and mutate that copy, so "Driver removed" was a
  // sentence about nothing — the row came back on refresh.
  const reload = useCallback(async () => {
    try {
      setDrivers(await fetchDrivers())
    } catch (error) {
      console.error('Failed to load drivers', error)
      toast.error('Could not load drivers')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])
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

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteDriverRequest(id)
        await reload()
        toast.success('Driver removed')
      } catch (error) {
        console.error('Failed to remove driver', error)
        toast.error('Could not remove that driver')
      }
    },
    [reload],
  )

  const handleSave = useCallback(
    async (data: Partial<TransportDriver>) => {
      const isEdit = Boolean(editingDriver)
      try {
        await saveDriverRequest(data)
        await reload()
        toast.success(isEdit ? 'Driver updated' : 'Driver added')
        setEditingDriver(null)
      } catch (error) {
        console.error('Failed to save driver', error)
        toast.error('Could not save that driver')
      }
    },
    [editingDriver, reload],
  )

  const handleExport = useCsvExport({
    rows: drivers,
    columns: EXPORT_COLUMNS,
    filename: 'drivers',
    label: 'drivers',
  })

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
          primaryAction={!canManage ? undefined : (
            <Button
              onClick={() => { setEditingDriver(null); setFormOpen(true) }}
              className={cn(TOOLBAR_PRIMARY_ACTION, 'bg-primary hover:bg-primary/90 text-foreground')}
            >
              <Plus className="size-4" />
              Add Driver
            </Button>
          )}
        />
      </Tile>

      {/* Driver Cards Grid */}
      {/* "No drivers available" while the fetch is still in flight would be a
          claim about the data rather than about the request. */}
      {isLoading ? (
        <TileWrapper columns={{ default: 1, md: 2, lg: 4 }} gap={12}>
          {[0, 1, 2, 3].map(card => (
            <Skeleton key={card} className="h-44 w-full rounded-xl" />
          ))}
        </TileWrapper>
      ) : paginated.length === 0 ? (
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
