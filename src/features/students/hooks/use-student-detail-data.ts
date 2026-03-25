import * as React from 'react'
import { fetchStudentDetailData } from '@/api/services/student-service'
import type { StudentDetailData } from '../types'

interface UseStudentDetailDataResult {
  detailData: StudentDetailData | null
  isLoading: boolean
  error: string | null
}

/**
 * Custom hook for fetching student detail data (attendance, scholarships, etc.)
 * Follows the same service → hook → page pattern as useStudentById.
 *
 * When the backend is ready, only `fetchStudentDetailData` in the service
 * layer needs to change — this hook and all consuming components stay the same.
 */
export function useStudentDetailData(id: string | undefined): UseStudentDetailDataResult {
  const [detailData, setDetailData] = React.useState<StudentDetailData | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!id) {
      setIsLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      try {
        setIsLoading(true)
        setError(null)
        const data = await fetchStudentDetailData(id!)
        if (!cancelled) {
          setDetailData(data)
        }
      } catch (err) {
        if (!cancelled) {
          setError('Failed to load student detail data')
          console.error('Error loading student detail data:', err)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    load()
    return () => { cancelled = true }
  }, [id])

  return { detailData, isLoading, error }
}
