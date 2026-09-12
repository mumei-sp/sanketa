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
import { callerMay, callerSeesEveryRow } from '@/mocks/_shared/caller'
import { authUtils } from '@/api/utils/auth'
import { resolveActiveAccess } from '@/mocks/tenant/profiles'
import { findStudent } from '@/mocks/tenant/students/store'
import {
  classSections,
  classTimetables,
  timetableExceptions,
  subjects,
} from '@/mocks/tenant/timetable/timetable'

/**
 * The class sections this caller may look at, or `null` for every one.
 *
 * A timetable is keyed by section and a family's scope is keyed by student, so
 * something has to translate — and it lives here, beside the data with the
 * awkward key, for the same reason the fee ledger translates `S-2101` next to
 * the rows that use it rather than teaching the scope about fee codes.
 *
 * `null` rather than the full list, so a caller who may see everything costs
 * nothing to serve. Staff hold `timetable.read` unconditionally on purpose:
 * looking up another class's grid is an ordinary part of the job, and the
 * permission declares only the `students` axis for exactly that reason.
 */
function visibleSections(): string[] | null {
  const session = authUtils.getUser()
  if (!session) return []
  // An unconditional rule — nothing narrowed it. See `seesEveryRow`.
  if (callerSeesEveryRow('read', 'Timetable')) return null

  const { studentIds } = resolveActiveAccess(session.id)
  return [
    ...new Set(
      studentIds.flatMap(id => {
        const student = findStudent(id)
        if (!student) return []
        // Three spellings of one class in this app: a student carries the
        // label ('9B'), `class_sections` carries grade and section apart, and
        // a timetable is keyed by the row's id ('cls-9b'). Resolved through the
        // table rather than by rebuilding the slug, because the slug's shape is
        // the table's business and not something to guess at from out here.
        const row = classSections.find(
          candidate =>
            candidate.grade === student.gradeLevel && candidate.section === student.section,
        )
        // A child whose section cannot be resolved contributes nothing rather
        // than everything: a scope that cannot be determined withholds, the
        // same way `visibleToCaller` treats a row it cannot attribute.
        return row ? [row.id] : []
      }),
    ),
  ]
}

/** Whether this caller may look at one particular section's grid. */
function maySeeSection(classSectionId: string): boolean {
  const allowed = visibleSections()
  return allowed === null || allowed.includes(classSectionId)
}

/** @apiRoute GET /api/v1/classes/sections */
export async function fetchClassSections(): Promise<ClassSection[]> {
  return mockOrHttp(
    async () => {
      await withLatency({ min: 200, max: 450 })
      const allowed = visibleSections()
      return allowed === null
        ? [...classSections]
        : classSections.filter(section => allowed.includes(section.id))
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
      // Null rather than a refusal: a caller asking for a grid they may not see
      // is told it is not there, which leaks nothing, where "not yours" would
      // confirm the section exists.
      if (!maySeeSection(classSectionId)) return null
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
      // `timetable.manage` is not narrowed by anything, so the bare question is
      // the whole question — and it was not being asked at all: any caller
      // could rewrite any section's week.
      if (!callerMay('manage', 'Timetable')) {
        throw new Error('Not allowed to change this timetable.')
      }
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
      if (!maySeeSection(classSectionId)) return []
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
      const allowed = visibleSections()
      return classTimetables
        .filter(timetable => allowed === null || allowed.includes(timetable.classSectionId))
        .map(t => ({ ...t, slots: [...t.slots] }))
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
      if (!callerMay('manage', 'Timetable')) {
        throw new Error('Not allowed to add a timetable exception.')
      }
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
