import * as React from 'react'
import {
  fetchClassRoster,
  fetchAttendanceSubmission,
  submitAttendance,
} from '@/api/services/attendance-service'
import type {
  ClassRosterStudent,
  AttendanceSubmission,
  AttendanceEntry,
} from '../types'

interface UseDailyAttendanceResult {
  /** Student roster for the selected class */
  roster: ClassRosterStudent[]
  /** Existing submission if already marked (null if not yet) */
  existingSubmission: AttendanceSubmission | null
  /** Loading state */
  isLoading: boolean
  /** Error message */
  error: string | null
  /** Submit or update attendance entries */
  saveAttendance: (entries: AttendanceEntry[], submittedBy: string) => Promise<AttendanceSubmission>
  /** Whether a save is in progress */
  isSaving: boolean
}

/**
 * Hook for fetching class roster and existing submission for a specific class + date.
 * Provides saveAttendance function to submit or update records.
 *
 * When backend is ready, only the service functions need to change.
 */
export function useDailyAttendance(
  classId: string | undefined,
  date: string | undefined,
): UseDailyAttendanceResult {
  const [roster, setRoster] = React.useState<ClassRosterStudent[]>([])
  const [existingSubmission, setExistingSubmission] = React.useState<AttendanceSubmission | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)

  // Fetch roster + existing submission whenever classId or date changes
  React.useEffect(() => {
    if (!classId || !date) {
      setRoster([])
      setExistingSubmission(null)
      setIsLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      try {
        setIsLoading(true)
        setError(null)

        // Fetch both in parallel
        const [rosterData, submissionData] = await Promise.all([
          fetchClassRoster(classId!),
          fetchAttendanceSubmission(classId!, date!),
        ])

        if (!cancelled) {
          setRoster(rosterData)
          setExistingSubmission(submissionData)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load attendance data')
          console.error('Error loading daily attendance:', err)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    load()
    return () => { cancelled = true }
  }, [classId, date])

  const saveAttendance = React.useCallback(
    async (entries: AttendanceEntry[], submittedBy: string): Promise<AttendanceSubmission> => {
      if (!classId || !date) {
        throw new Error('Class and date are required')
      }

      setIsSaving(true)
      try {
        const result = await submitAttendance(classId, date, entries, submittedBy)
        setExistingSubmission(result)
        return result
      } finally {
        setIsSaving(false)
      }
    },
    [classId, date],
  )

  return {
    roster,
    existingSubmission,
    isLoading,
    error,
    saveAttendance,
    isSaving,
  }
}
