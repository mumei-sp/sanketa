/**
 * Timetable Service Layer
 *
 * Mock implementations with simulated network delay.
 * Replace with real API calls when backend is ready.
 */

import type {
  ClassSection,
  ClassTimetable,
  TimetableSlot,
  TimetableException,
  Subject,
} from '@/features/timetable/types'
import {
  classSections,
  classTimetables,
  timetableExceptions,
  subjects,
} from '@/data/mocks/timetable'

/** Simulated delay helper */
function delay(min = 200, max = 500): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min)) + min
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Fetch all available class sections.
 * Replace with: GET /api/classes/sections
 */
export async function fetchClassSections(): Promise<ClassSection[]> {
  await delay()
  return [...classSections]
}

/**
 * Fetch all subjects.
 * Replace with: GET /api/subjects
 */
export async function fetchSubjects(): Promise<Subject[]> {
  await delay(100, 300)
  return [...subjects]
}

/**
 * Fetch timetable template for a specific class section.
 * Replace with: GET /api/timetable/:classSectionId
 */
export async function fetchClassTimetable(classSectionId: string): Promise<ClassTimetable | null> {
  await delay()
  const timetable = classTimetables.find(t => t.classSectionId === classSectionId)
  return timetable ? { ...timetable, slots: [...timetable.slots] } : null
}

/**
 * Update a class timetable's slots.
 * Replace with: PUT /api/timetable/:classSectionId
 */
export async function updateClassTimetable(
  classSectionId: string,
  slots: TimetableSlot[],
): Promise<ClassTimetable> {
  await delay(300, 600)
  const idx = classTimetables.findIndex(t => t.classSectionId === classSectionId)
  if (idx >= 0) {
    classTimetables[idx] = { ...classTimetables[idx], slots: [...slots] }
    return classTimetables[idx]
  }
  // Create new timetable if none exists
  const newTimetable: ClassTimetable = {
    id: `tt-${classSectionId}-${Date.now()}`,
    classSectionId,
    academicYear: '2035-36',
    effectiveFrom: new Date().toISOString().split('T')[0],
    slots: [...slots],
  }
  classTimetables.push(newTimetable)
  return newTimetable
}

/**
 * Fetch exceptions for a class section within a date range.
 * Replace with: GET /api/timetable/:classSectionId/exceptions?start=X&end=Y
 */
export async function fetchExceptions(
  classSectionId: string,
  startDate: string,
  endDate: string,
): Promise<TimetableException[]> {
  await delay(100, 300)
  return timetableExceptions.filter(
    e => e.classSectionId === classSectionId && e.date >= startDate && e.date <= endDate,
  )
}

/**
 * Fetch all class timetables (summary — used for "duplicate from" feature).
 * Replace with: GET /api/timetable
 */
export async function fetchAllClassTimetables(): Promise<ClassTimetable[]> {
  await delay(100, 300)
  return classTimetables.map(t => ({ ...t, slots: [...t.slots] }))
}

/**
 * Create an exception record.
 * Replace with: POST /api/timetable/exceptions
 */
export async function createException(
  exception: Omit<TimetableException, 'id'>,
): Promise<TimetableException> {
  await delay(200, 400)
  const newException: TimetableException = {
    ...exception,
    id: `exc-${Date.now()}`,
  }
  timetableExceptions.push(newException)
  return newException
}
