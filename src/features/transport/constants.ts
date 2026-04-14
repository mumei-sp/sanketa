import { status, accent, primary } from '@/theme/colors'
import type { StatusPillConfig } from '@/components/ui/status-pill'

// ============================================================================
// Vehicle constants
// ============================================================================

export const VEHICLE_TYPES = ['Bus', 'Van', 'Mini Bus'] as const

export const VEHICLE_STATUS_OPTIONS = ['Active', 'Under Maintenance', 'Inactive'] as const

export const VEHICLE_STATUS_COLORS: Record<string, StatusPillConfig> = {
  Active: { bg: status.success.soft, color: status.success.text },
  'Under Maintenance': { bg: status.warning.soft, color: status.warning.text },
  Inactive: { bg: status.danger.soft, color: status.danger.text },
}

// ============================================================================
// Driver constants
// ============================================================================

export const DRIVER_STATUS_OPTIONS = ['Active', 'On Leave', 'Inactive'] as const

export const DRIVER_STATUS_COLORS: Record<string, StatusPillConfig> = {
  Active: { bg: status.success.soft, color: status.success.text },
  'On Leave': { bg: status.warning.soft, color: status.warning.text },
  Inactive: { bg: status.danger.soft, color: status.danger.text },
}

// ============================================================================
// Route constants
// ============================================================================

export const ROUTE_STATUS_OPTIONS = ['Active', 'Inactive'] as const

export const ROUTE_STATUS_COLORS: Record<string, StatusPillConfig> = {
  Active: { bg: status.success.soft, color: status.success.text },
  Inactive: { bg: status.danger.soft, color: status.danger.text },
}

export const ROUTE_TYPE_OPTIONS = ['one-way', 'two-way'] as const

// ============================================================================
// Fee constants
// ============================================================================

export const FEE_STATUS_COLORS: Record<string, StatusPillConfig> = {
  Paid: { bg: status.success.soft, color: status.success.text },
  Pending: { bg: status.warning.soft, color: status.warning.text },
  Overdue: { bg: status.danger.soft, color: status.danger.text },
}

export const FEE_TERMS = ['Term 1', 'Term 2', 'Term 3', 'Annual'] as const

// ============================================================================
// Alert severity colors
// ============================================================================

export const ALERT_SEVERITY_COLORS: Record<string, StatusPillConfig> = {
  danger: { bg: status.danger.soft, color: status.danger.text },
  warning: { bg: status.warning.soft, color: status.warning.text },
  info: { bg: status.info.soft, color: status.info.text },
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
  primary.base,
  accent.base,
  status.success.base,
  status.info.base,
  status.warning.base,
  status.danger.soft,
  primary.soft,
  accent.soft,
]

// ============================================================================
// Document expiry thresholds (days)
// ============================================================================

export const EXPIRY_THRESHOLDS = {
  danger: 7,   // < 7 days or expired
  warning: 30, // 7-30 days
  safe: 30,    // > 30 days
} as const
