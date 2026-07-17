import type { DateRange, DateRangePreset } from '@/features/attendance/types'

/**
 * Day name abbreviations for date formatting
 */
export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

/**
 * Month name abbreviations for date formatting
 */
export const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const

/**
 * Format a Date object to YYYY-MM-DD using local timezone (avoids UTC shift from toISOString)
 */
function formatLocalDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Time-of-day salutation for greeting headers (e.g., "Good morning").
 * Boundaries: morning until 12:00, afternoon until 17:00, evening after.
 */
export function getTimeOfDayGreeting(date: Date = new Date()): string {
  const hour = date.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

/**
 * Format a date as a friendly long-form line (e.g., "Monday, 16 March").
 */
export function formatFriendlyDate(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date)
}

/**
 * Format date string to display format for table column headers (e.g., "Thu, Mar 1")
 */
export function formatDateHeader(dateStr: string): string {
  const date = new Date(dateStr)
  const dayName = DAY_NAMES[date.getDay()]
  const monthName = MONTH_NAMES[date.getMonth()]
  const day = date.getDate()

  return `${dayName}, ${monthName} ${day}`
}

/**
 * Format date for display in readable format (e.g., "Mar 1, 2025")
 */
export function formatDateForDisplay(dateStr: string | null): string {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr
    return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
  } catch {
    return dateStr
  }
}

/**
 * Check if a date string falls within the given date range
 */
export function isDateInRange(dateStr: string, range: DateRange): boolean {
  // If both dates are null, show all dates
  if (!range.startDate && !range.endDate) {
    return true
  }

  try {
    const date = new Date(dateStr)
    date.setHours(0, 0, 0, 0)

    // Check start date
    if (range.startDate) {
      const startDate = new Date(range.startDate)
      startDate.setHours(0, 0, 0, 0)
      if (date < startDate) {
        return false
      }
    }

    // Check end date
    if (range.endDate) {
      const endDate = new Date(range.endDate)
      endDate.setHours(23, 59, 59, 999)
      if (date > endDate) {
        return false
      }
    }

    return true
  } catch {
    // Invalid date, exclude it
    return false
  }
}

/**
 * Calculate date range based on preset
 */
export function calculateDateRange(preset: DateRangePreset): DateRange {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let startDate: Date
  let endDate: Date = new Date(today)

  switch (preset) {
    case 'last-14-days': {
      startDate = new Date(today)
      startDate.setDate(today.getDate() - 13)
      break
    }
    case 'last-30-days': {
      startDate = new Date(today)
      startDate.setDate(today.getDate() - 29)
      break
    }
    case 'this-month': {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1)
      break
    }
    case 'last-month': {
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      startDate = new Date(lastMonth)
      endDate = new Date(today.getFullYear(), today.getMonth(), 0) // Last day of previous month
      break
    }
    case 'custom': {
      // For custom, return null dates - caller should set them
      return {
        startDate: null,
        endDate: null,
        preset: 'custom',
      }
    }
    default: {
      // Default to last-14-days
      startDate = new Date(today)
      startDate.setDate(today.getDate() - 13)
    }
  }

  const startDateStr = formatLocalDate(startDate)
  const endDateStr = formatLocalDate(endDate)

  return {
    startDate: startDateStr,
    endDate: endDateStr,
    preset,
  }
}

/**
 * Get default date range (Last 14 Days)
 */
export function getDefaultDateRange(): DateRange {
  return calculateDateRange('last-14-days')
}

