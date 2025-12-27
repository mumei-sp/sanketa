import * as React from 'react'
import type { DateRange } from '../attendance-types'
import { getDefaultDateRange } from '@/utils/date'

/**
 * Hook for managing date range state with default initialization
 */
export function useDateRange(initialRange?: DateRange) {
  const [dateRange, setDateRange] = React.useState<DateRange>(
    () => initialRange || getDefaultDateRange(),
  )

  return {
    dateRange,
    setDateRange,
  }
}
