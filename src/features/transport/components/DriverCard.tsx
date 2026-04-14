import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { StatusPill } from '@/components/ui/status-pill'
import { Tile } from '@/components/tile'
import { Phone, ShieldCheck, ShieldX, Pencil, Trash2, IdCard, Bus, AlertCircle } from 'lucide-react'
import { primary, accent, text, status } from '@/theme/colors'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { DRIVER_STATUS_COLORS } from '../constants'
import { getExpiryConfig } from '../utils/transport-utils'
import type { TransportDriver } from '../types'

interface DriverCardProps {
  driver: TransportDriver
  onEdit: (driver: TransportDriver) => void
  onDelete: (id: string) => void
}

export function DriverCard({ driver, onEdit, onDelete }: DriverCardProps) {
  const displayName = `${driver.firstName} ${driver.lastName}`
  const initials = `${driver.firstName[0]}${driver.lastName[0]}`.toUpperCase()
  const licenseExpiry = getExpiryConfig(driver.licenseExpiry)

  return (
    <Tile
      id={`driver-card-${driver.id}`}
      layoutMode="block"
      background="card"
      borderRadius="lg"
      shadowed
      padding={16}
      className="relative flex flex-col gap-3 h-full"
    >
      {/* Top-right actions */}
      <div className="absolute top-3 right-3 flex items-center gap-0.5">
        <button
          onClick={() => onEdit(driver)}
          className="w-7 h-7 rounded-md flex items-center justify-center transition-colors"
          style={{ backgroundColor: accent.soft }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = accent.base }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = accent.soft }}
          aria-label="Edit driver"
        >
          <Pencil className="w-3.5 h-3.5" style={{ color: text.heading }} />
        </button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              className="w-7 h-7 rounded-md flex items-center justify-center transition-colors"
              style={{ backgroundColor: accent.soft }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = status.danger.soft }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = accent.soft }}
              aria-label="Delete driver"
            >
              <Trash2 className="w-3.5 h-3.5" style={{ color: text.heading }} />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle style={{ color: text.heading }}>Delete Driver</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &ldquo;{displayName}&rdquo;? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={() => onDelete(driver.id)}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Profile Header */}
      <div className="flex items-center gap-3">
        <Avatar className="w-12 h-12 shrink-0" style={{ backgroundColor: primary.soft }}>
          <AvatarFallback className="text-sm font-semibold" style={{ backgroundColor: primary.soft, color: text.heading }}>
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col min-w-0">
          <h3 className="text-sm font-semibold truncate" style={{ color: text.heading }}>
            {displayName}
          </h3>
          <p className="text-xs text-muted-foreground truncate">
            {driver.id} &middot; {driver.experience} yrs exp
          </p>
        </div>
      </div>

      {/* Contact & Details */}
      <div className="flex flex-col gap-2 flex-1">
        <div className="flex items-center gap-2">
          <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs text-foreground truncate">{driver.phone}</span>
        </div>
        <div className="flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs text-foreground truncate">Emergency: {driver.emergencyContact}</span>
        </div>
        <div className="flex items-center gap-2">
          <IdCard className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs text-foreground truncate">{driver.licenseNumber} ({driver.licenseType})</span>
        </div>
        {driver.assignedVehicleName && (
          <div className="flex items-center gap-2">
            <Bus className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs text-foreground truncate">{driver.assignedVehicleName}</span>
          </div>
        )}
      </div>

      {/* Footer — License expiry + BG check + Status */}
      <div className="flex items-center justify-between gap-2 pt-3 border-t border-border/50 mt-auto">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground">License:</span>
            <StatusPill label={licenseExpiry.label} config={licenseExpiry} />
          </div>
          {driver.backgroundVerified
            ? <StatusPill label="BG Verified" config={{ bg: status.success.soft, color: status.success.text }} />
            : <StatusPill label="BG Pending" config={{ bg: status.danger.soft, color: status.danger.text }} />}
        </div>
        <StatusPill label={driver.status} config={DRIVER_STATUS_COLORS[driver.status]} />
      </div>
    </Tile>
  )
}
