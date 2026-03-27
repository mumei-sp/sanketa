/**
 * Grade feature constants — exam definitions, labels, and messages.
 */

import type { Exam } from './types'

// ============================================================================
// Exam Definitions
// ============================================================================

/** All exams in the academic year, grouped by term */
export const EXAMS: Exam[] = [
  { id: 'ut1',  name: 'Unit Test 1',  termId: 'term-1', termName: 'Term 1', maxMarks: 50,  date: '2035-05-15' },
  { id: 'ut2',  name: 'Unit Test 2',  termId: 'term-1', termName: 'Term 1', maxMarks: 50,  date: '2035-07-10' },
  { id: 'half', name: 'Half Yearly',  termId: 'term-1', termName: 'Term 1', maxMarks: 100, date: '2035-09-20' },
  { id: 'ut3',  name: 'Unit Test 3',  termId: 'term-2', termName: 'Term 2', maxMarks: 50,  date: '2035-11-15' },
  { id: 'ut4',  name: 'Unit Test 4',  termId: 'term-2', termName: 'Term 2', maxMarks: 50,  date: '2036-01-10' },
  { id: 'ann',  name: 'Annual',       termId: 'term-2', termName: 'Term 2', maxMarks: 100, date: '2036-03-15' },
]

/** Get unique term IDs in order */
export const TERM_IDS = [...new Set(EXAMS.map(e => e.termId))]

/** Group exams by term for <optgroup> rendering */
export const EXAMS_BY_TERM = TERM_IDS.map(termId => ({
  termId,
  termName: EXAMS.find(e => e.termId === termId)!.termName,
  exams: EXAMS.filter(e => e.termId === termId),
}))

// ============================================================================
// Subject Filtering
// ============================================================================

/** Academic subject IDs that receive grades (excludes PE, Art, Music, Library) */
export const GRADEABLE_SUBJECT_IDS = ['math', 'eng', 'sci', 'sst', 'hindi', 'cs'] as const

// ============================================================================
// UI Labels & Messages
// ============================================================================

export const GRADE_LABELS = {
  GRADES: 'Grades',
  GRADE_ENTRY: 'Grade Entry',
  GRADE_SHEET: 'Grade Sheet',
  SAVE_DRAFT: 'Save Draft',
  SUBMIT: 'Submit Grades',
  CANCEL: 'Cancel',
  EDIT: 'Edit',
  REPORT_CARD: 'Report Card',
  PRINT: 'Print Report Card',
  VIEW: 'View',
} as const

export const GRADE_MESSAGES = {
  LOADING: 'Loading grades...',
  SAVING: 'Saving...',
  SUBMITTING: 'Submitting...',
  SAVE_SUCCESS: 'Grades saved as draft',
  SUBMIT_SUCCESS: 'Grades submitted successfully',
  SAVE_ERROR: 'Failed to save grades',
  SUBMIT_ERROR: 'Failed to submit grades',
  NO_CLASS: 'Select a class to begin',
  NO_GRADES: 'No grades submitted yet for this selection.',
  EMPTY_SHEET: 'No grade data available for this class and exam.',
  SELECT_STUDENT: 'Select a student to preview their report card.',
  NO_REPORT_DATA: 'No grade data available to generate report cards.',
} as const
