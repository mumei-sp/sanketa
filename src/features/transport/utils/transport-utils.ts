import { status, statusVivid } from '@/theme/colors'
import { EXPIRY_THRESHOLDS } from '../constants'
import type { StatusPillConfig } from '@/components/ui/status-pill'

/**
 * Returns the number of days until a date string (YYYY-MM-DD).
 * Negative means already expired.
 */
export function daysUntil(dateStr: string): number {
  const target = new Date(dateStr)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

/**
 * Returns a color-coded config for document expiry:
 * - green (>30 days), amber (7-30 days), red (<7 days / expired)
 */
export function getExpiryConfig(dateStr: string): StatusPillConfig & { label: string } {
  const days = daysUntil(dateStr)

  if (days < 0) {
    return { ...statusVivid.danger, label: 'Expired' }
  }
  if (days <= EXPIRY_THRESHOLDS.danger) {
    return { ...statusVivid.danger, label: `${days}d left` }
  }
  if (days <= EXPIRY_THRESHOLDS.warning) {
    return { ...statusVivid.warning, label: `${days}d left` }
  }
  return { ...statusVivid.success, label: 'Valid' }
}

/**
 * Returns the occupancy color based on percentage.
 * green (<75%), amber (75-90%), red (>90%)
 */
export function getOccupancyColor(assigned: number, capacity: number): string {
  if (capacity === 0) return status.danger.base
  const pct = (assigned / capacity) * 100
  if (pct > 90) return status.danger.base
  if (pct >= 75) return status.warning.base
  return status.success.base
}

/**
 * Returns occupancy percentage, capped at 100 for display.
 */
export function getOccupancyPercent(assigned: number, capacity: number): number {
  if (capacity === 0) return 0
  return Math.min(100, Math.round((assigned / capacity) * 100))
}

/**
 * Format a driver's full name.
 */
export function getDriverName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim()
}

/**
 * Format currency in INR.
 */
export function formatCurrency(amount: number): string {
  return amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
}

/**
 * Format date string (YYYY-MM-DD) to locale display.
 */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
