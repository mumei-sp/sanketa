import * as React from 'react'
import {
  fetchClassTimetable,
  updateClassTimetable,
} from '@/api/services/timetable-service'
import type { ClassTimetable, TimetableSlot } from '../types'

interface UseClassTimetableResult {
  timetable: ClassTimetable | null
  isLoading: boolean
  error: string | null
  updateSlots: (slots: TimetableSlot[]) => Promise<void>
  isSaving: boolean
}

/**
 * Hook to fetch and manage a class timetable template.
 * Provides updateSlots for saving changes via the service layer.
 */
export function useClassTimetable(classSectionId: string | undefined): UseClassTimetableResult {
  const [timetable, setTimetable] = React.useState<ClassTimetable | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)

  React.useEffect(() => {
    if (!classSectionId) {
      setTimetable(null)
      setIsLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      try {
        setIsLoading(true)
        setError(null)
        const data = await fetchClassTimetable(classSectionId!)
        if (!cancelled) setTimetable(data)
      } catch (err) {
        if (!cancelled) {
          setError('Failed to load timetable')
          console.error('Error loading timetable:', err)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [classSectionId])

  const updateSlots = React.useCallback(async (slots: TimetableSlot[]) => {
    if (!classSectionId) return
    setIsSaving(true)
    try {
      const updated = await updateClassTimetable(classSectionId, slots)
      setTimetable(updated)
    } finally {
      setIsSaving(false)
    }
  }, [classSectionId])

  return { timetable, isLoading, error, updateSlots, isSaving }
}
