import * as React from 'react'
import { fetchStudentById } from '@/api/services/student-service'
import type { Student } from '../types'

interface UseStudentByIdResult {
  student: Student | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Custom hook for fetching a student by ID
 * Handles loading and error states internally
 *
 * @param id - The student ID to fetch
 * @returns Object containing student data, loading state, error state, and refetch function
 */
export function useStudentById(id: string | undefined): UseStudentByIdResult {
  const [student, setStudent] = React.useState<Student | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const loadStudent = React.useCallback(async () => {
    if (!id) {
      setError('Student ID is required')
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const studentData = await fetchStudentById(id)

      if (!studentData) {
        setError('Student not found')
      } else {
        setStudent(studentData)
      }
    } catch (err) {
      setError('Failed to load student details')
      console.error('Error loading student:', err)
    } finally {
      setIsLoading(false)
    }
  }, [id])

  React.useEffect(() => {
    loadStudent()
  }, [loadStudent])

  return {
    student,
    isLoading,
    error,
    refetch: loadStudent,
  }
}
