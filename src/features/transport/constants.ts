import { status, statusVivid } from '@/theme/colors'
import type { StatusPillConfig } from '@/components/ui/status-pill'

// Re-export for backwards compatibility within transport module.
// Prefer importing `statusVivid` directly from `@/theme/colors` in new code.
export { statusVivid as VIVID_STATUS }

// ============================================================================
// Vehicle constants
// ============================================================================

export const VEHICLE_TYPES = ['Bus', 'Van', 'Mini Bus'] as const

export const VEHICLE_STATUS_OPTIONS = ['Active', 'Under Maintenance', 'Inactive'] as const

export const VEHICLE_STATUS_COLORS: Record<string, StatusPillConfig> = {
  Active: statusVivid.success,
  'Under Maintenance': statusVivid.warning,
  Inactive: statusVivid.danger,
}

// ============================================================================
// Driver constants
// ============================================================================

export const DRIVER_STATUS_OPTIONS = ['Active', 'On Leave', 'Inactive'] as const

export const DRIVER_STATUS_COLORS: Record<string, StatusPillConfig> = {
  Active: statusVivid.success,
  'On Leave': statusVivid.warning,
  Inactive: statusVivid.danger,
}

// ============================================================================
// Route constants
// ============================================================================

export const ROUTE_STATUS_OPTIONS = ['Active', 'Inactive'] as const

export const ROUTE_STATUS_COLORS: Record<string, StatusPillConfig> = {
  Active: statusVivid.success,
  Inactive: statusVivid.danger,
}

export const ROUTE_TYPE_OPTIONS = ['one-way', 'two-way'] as const

// ============================================================================
// Fee constants
// ============================================================================

export const FEE_STATUS_COLORS: Record<string, StatusPillConfig> = {
  Paid: statusVivid.success,
  Pending: statusVivid.warning,
  Overdue: statusVivid.danger,
}

export const FEE_TERMS = ['Term 1', 'Term 2', 'Term 3', 'Annual'] as const

// ============================================================================
// Alert severity colors
// ============================================================================

export const ALERT_SEVERITY_COLORS: Record<string, StatusPillConfig> = {
  danger: statusVivid.danger,
  warning: statusVivid.warning,
  info: statusVivid.info,
}

// ============================================================================
// Chart colors
// ============================================================================

export const VEHICLE_STATUS_CHART_COLORS: Record<string, string> = {
  Active: status.success.base,
  'Under Maintenance': status.warning.base,
  Inactive: status.danger.base,
}

export const ROUTE_CHART_COLORS = [
  'var(--primary)',
  'var(--accent)',
  status.success.base,
  status.info.base,
  status.warning.base,
  status.danger.soft,
  'color-mix(in srgb, var(--primary) 55%, white)',
  'color-mix(in srgb, var(--accent) 55%, white)',
]

// ============================================================================
// Document expiry thresholds (days)
// ============================================================================

export const EXPIRY_THRESHOLDS = {
  danger: 7,   // < 7 days or expired
  warning: 30, // 7-30 days
  safe: 30,    // > 30 days
} as const
