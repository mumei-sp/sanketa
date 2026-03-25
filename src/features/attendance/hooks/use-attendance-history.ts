import * as React from 'react'
import { fetchAttendanceHistory } from '@/api/services/attendance-service'
import type { AttendanceHistoryRow } from '../types'

interface UseAttendanceHistoryResult {
  /** History rows for the selected class + month */
  rows: AttendanceHistoryRow[]
  /** Loading state */
  isLoading: boolean
  /** Error message */
  error: string | null
  /** Re-fetch the history data */
  refetch: () => Promise<void>
}

/**
 * Hook for fetching attendance history rows for a specific class and month.
 * Returns summary per weekday with submission status.
 *
 * When backend is ready, only the service function needs to change.
 */
export function useAttendanceHistory(
  classId: string | undefined,
  year: number,
  month: number,
): UseAttendanceHistoryResult {
  const [rows, setRows] = React.useState<AttendanceHistoryRow[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    if (!classId) {
      setRows([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const data = await fetchAttendanceHistory(classId, year, month)
      setRows(data)
    } catch (err) {
      setError('Failed to load attendance history')
      console.error('Error loading attendance history:', err)
    } finally {
      setIsLoading(false)
    }
  }, [classId, year, month])

  React.useEffect(() => {
    load()
  }, [load])

  return {
    rows,
    isLoading,
    error,
    refetch: load,
  }
}
