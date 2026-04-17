/**
 * Timetable API Service
 *
 * Mock path + HTTP path per endpoint.
 */

import type {
  ClassSection,
  ClassTimetable,
  TimetableSlot,
  TimetableException,
  Subject,
} from '@/features/timetable/types'
import apiClient from '@/api/client'
import { mockOrHttp } from './_adapter'
import { withLatency, newId, currentAcademicYear, isoDate } from '@/mocks/_shared'
import {
  classSections,
  classTimetables,
  timetableExceptions,
  subjects,
} from '@/mocks/timetable/timetable'

/** @apiRoute GET /api/v1/classes/sections */
export async function fetchClassSections(): Promise<ClassSection[]> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 200, max: 450 })
      return [...classSections]
    },
    async () => {
      const { data } = await apiClient.get<ClassSection[]>('/classes/sections')
      return data
    },
  )
}

/** @apiRoute GET /api/v1/subjects */
export async function fetchSubjects(): Promise<Subject[]> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 100, max: 250 })
      return [...subjects]
    },
    async () => {
      const { data } = await apiClient.get<Subject[]>('/subjects')
      return data
    },
  )
}

/** @apiRoute GET /api/v1/timetable/{classSectionId} */
export async function fetchClassTimetable(classSectionId: string): Promise<ClassTimetable | null> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 200, max: 450 })
      const timetable = classTimetables.find(t => t.classSectionId === classSectionId)
      return timetable ? { ...timetable, slots: [...timetable.slots] } : null
    },
    async () => {
      try {
        const { data } = await apiClient.get<ClassTimetable>(`/timetable/${classSectionId}`)
        return data
      } catch (err: any) {
        if (err?.status === 404) return null
        throw err
      }
    },
  )
}

/** @apiRoute PUT /api/v1/timetable/{classSectionId} */
export async function updateClassTimetable(
  classSectionId: string,
  slots: TimetableSlot[],
): Promise<ClassTimetable> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 250, max: 500 })
      const idx = classTimetables.findIndex(t => t.classSectionId === classSectionId)
      if (idx >= 0) {
        classTimetables[idx] = { ...classTimetables[idx], slots: [...slots] }
        return classTimetables[idx]
      }
      const newTimetable: ClassTimetable = {
        id: newId(`tt-${classSectionId}`),
        classSectionId,
        academicYear: currentAcademicYear(),
        effectiveFrom: isoDate(),
        slots: [...slots],
      }
      classTimetables.push(newTimetable)
      return newTimetable
    },
    async () => {
      const { data } = await apiClient.put<ClassTimetable>(`/timetable/${classSectionId}`, {
        slots,
      })
      return data
    },
  )
}

/** @apiRoute GET /api/v1/timetable/{classSectionId}/exceptions?start={start}&end={end} */
export async function fetchExceptions(
  classSectionId: string,
  startDate: string,
  endDate: string,
): Promise<TimetableException[]> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 100, max: 250 })
      return timetableExceptions.filter(
        e => e.classSectionId === classSectionId && e.date >= startDate && e.date <= endDate,
      )
    },
    async () => {
      const { data } = await apiClient.get<TimetableException[]>(
        `/timetable/${classSectionId}/exceptions`,
        { params: { start: startDate, end: endDate } },
      )
      return data
    },
  )
}

/** @apiRoute GET /api/v1/timetable */
export async function fetchAllClassTimetables(): Promise<ClassTimetable[]> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 100, max: 250 })
      return classTimetables.map(t => ({ ...t, slots: [...t.slots] }))
    },
    async () => {
      const { data } = await apiClient.get<ClassTimetable[]>('/timetable')
      return data
    },
  )
}

/** @apiRoute POST /api/v1/timetable/exceptions */
export async function createException(
  exception: Omit<TimetableException, 'id'>,
): Promise<TimetableException> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 200, max: 400 })
      const newException: TimetableException = {
        ...exception,
        id: newId('exc'),
      }
      timetableExceptions.push(newException)
      return newException
    },
    async () => {
      const { data } = await apiClient.post<TimetableException>('/timetable/exceptions', exception)
      return data
    },
  )
}
