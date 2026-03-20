import * as React from 'react'
import { fetchTeacherById } from '@/api/services/teacher-service'
import type { TeacherDetail } from '../types/teacher-detail'
import { getTeacherDetailById } from '@/data/mocks/teacher-details'

interface UseTeacherByIdResult {
  teacher: TeacherDetail | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Custom hook for fetching a teacher by ID
 * Merges basic teacher data with extended detail data
 */
export function useTeacherById(id: string | undefined): UseTeacherByIdResult {
  const [teacher, setTeacher] = React.useState<TeacherDetail | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const loadTeacher = React.useCallback(async () => {
    if (!id) {
      setError('Teacher ID is required')
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const basicTeacher = await fetchTeacherById(id)

      if (!basicTeacher) {
        setError('Teacher not found')
      } else {
        // Merge basic teacher data with extended detail data
        const detailData = getTeacherDetailById(id)
        if (detailData) {
          setTeacher(detailData)
        } else {
          // Fallback: create a basic TeacherDetail from the Teacher
          setTeacher({
            ...basicTeacher,
            employmentType: 'Full-Time',
            address: 'N/A',
            classAssignments: [],
            documents: [],
            schedule: [],
            workloadData: [],
            trainingEvents: [],
            leaveRequests: [],
            performanceMetrics: [],
            calendarHighlights: [],
            attendanceSummary: { present: 0, late: 0, onLeave: 0 },
          })
        }
      }
    } catch (err) {
      setError('Failed to load teacher details')
      console.error('Error loading teacher:', err)
    } finally {
      setIsLoading(false)
    }
  }, [id])

  React.useEffect(() => {
    loadTeacher()
  }, [loadTeacher])

  return {
    teacher,
    isLoading,
    error,
    refetch: loadTeacher,
  }
}
