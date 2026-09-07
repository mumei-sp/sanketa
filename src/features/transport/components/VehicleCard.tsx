import { Card } from '@/components/ui/card'
import { Tile } from '@/components/tile'
import { StatusPill } from '@/components/ui/status-pill'
import { Button } from '@/components/ui/button'
import { Bus, Truck, CarFront, MapPin, User, Pencil, Trash2, Wrench } from 'lucide-react'
import { text, accent, status } from '@/theme/colors'
import { VEHICLE_STATUS_COLORS } from '../constants'
import { getExpiryConfig, getOccupancyColor, getOccupancyPercent, formatDate } from '../utils/transport-utils'
import type { Vehicle, VehicleType } from '../types'

const VEHICLE_TYPE_ICON: Record<VehicleType, typeof Bus> = {
  'Bus': Bus,
  'Van': CarFront,
  'Mini Bus': Truck,
}

const VEHICLE_TYPE_COLOR: Record<VehicleType, string> = {
  'Bus': accent.base,
  'Van': status.info.soft,
  'Mini Bus': status.success.soft,
}

interface VehicleCardProps {
  vehicle: Vehicle
  onEdit: (vehicle: Vehicle) => void
  onDelete: (id: string) => void
}

export function VehicleCard({ vehicle, onEdit, onDelete }: VehicleCardProps) {
  const occupancyPct = getOccupancyPercent(vehicle.currentOccupancy, vehicle.capacity)
  const occupancyColor = getOccupancyColor(vehicle.currentOccupancy, vehicle.capacity)
  const insuranceExpiry = getExpiryConfig(vehicle.insuranceExpiry)
  const fitnessExpiry = getExpiryConfig(vehicle.fitnessExpiry)
  const pucExpiry = getExpiryConfig(vehicle.pucExpiry)

  const TypeIcon = VEHICLE_TYPE_ICON[vehicle.type]

  return (
    <Tile id={`vehicle-${vehicle.id}`} layoutMode="block" background="transparent" padding={0}>
      <Card className="flex flex-col gap-3 px-4 py-3 h-full">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div
              className="flex items-center justify-center size-10 rounded-full shrink-0"
              style={{ backgroundColor: VEHICLE_TYPE_COLOR[vehicle.type] }}
            >
              <TypeIcon className="size-5" style={{ color: text.heading }} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold truncate" style={{ color: text.heading }}>
                {vehicle.registrationNumber}
              </span>
              <span className="text-xs text-muted-foreground truncate">{vehicle.make} {vehicle.model} &middot; {vehicle.type}</span>
            </div>
          </div>
          <div className="shrink-0">
            <StatusPill label={vehicle.status === 'Under Maintenance' ? 'Maintenance' : vehicle.status} config={VEHICLE_STATUS_COLORS[vehicle.status]} />
          </div>
        </div>

        {/* Route & Driver */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <MapPin className="size-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground truncate">{vehicle.routeName || 'Unassigned'}</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="size-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground truncate">{vehicle.driverName || 'Unassigned'}</span>
          </div>
        </div>

        {/* Capacity bar */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Occupancy</span>
            <span className="text-xs font-medium" style={{ color: text.heading }}>
              {vehicle.currentOccupancy}/{vehicle.capacity} ({occupancyPct}%)
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${occupancyPct}%`, backgroundColor: occupancyColor }}
            />
          </div>
        </div>

        {/* Documents — compact grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center gap-0.5 p-1.5 rounded-md bg-muted/40">
            <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wide">Insurance</span>
            <StatusPill label={insuranceExpiry.label} config={insuranceExpiry} />
          </div>
          <div className="flex flex-col items-center gap-0.5 p-1.5 rounded-md bg-muted/40">
            <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wide">Fitness</span>
            <StatusPill label={fitnessExpiry.label} config={fitnessExpiry} />
          </div>
          <div className="flex flex-col items-center gap-0.5 p-1.5 rounded-md bg-muted/40">
            <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wide">PUC</span>
            <StatusPill label={pucExpiry.label} config={pucExpiry} />
          </div>
        </div>

        {/* Next Maintenance */}
        <div className="flex items-center gap-2">
          <Wrench className="size-3.5 text-muted-foreground shrink-0" />
          <span className="text-[11px] text-muted-foreground">
            Next service: <span className="font-medium" style={{ color: text.heading }}>{formatDate(vehicle.nextMaintenanceDate)}</span>
          </span>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-1 pt-2 border-t border-border/50 mt-auto">
          <Button variant="ghost" size="icon" className="size-7" onClick={() => onEdit(vehicle)}>
            <Pencil className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="size-7 text-destructive" onClick={() => onDelete(vehicle.id)}>
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </Card>
    </Tile>
  )
}
