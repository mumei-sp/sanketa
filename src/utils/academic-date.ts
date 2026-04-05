/**
 * Academic Date Utilities
 *
 * Pure functions for academic-year-aware date calculations.
 * No React dependency — fully testable and usable outside components.
 *
 * All functions take explicit parameters (start month, term structure)
 * so they can be called with values from the SchoolConfig context
 * or independently in tests/utilities.
 */

import type { TermStructure } from '@/config/school-config'
import { MONTH_LABELS, MONTH_SHORT_LABELS, TERM_STRUCTURE_OPTIONS } from '@/config/school-config'

// ============================================================================
// Types
// ============================================================================

export interface AcademicYear {
  /** Start date of the academic year */
  start: Date
  /** End date of the academic year (last day) */
  end: Date
  /** Display label e.g. "2035-36" or "2035" if same calendar year */
  label: string
  /** Start calendar year */
  startYear: number
  /** End calendar year */
  endYear: number
}

export interface TermInfo {
  /** 1-based term number */
  term: number
  /** Display label e.g. "Term 1", "Semester 1", "Q1" */
  label: string
  /** Start month index (0-11) */
  startMonth: number
  /** End month index (0-11) — inclusive */
  endMonth: number
  /** Number of months in this term */
  monthCount: number
}

export interface DateRange {
  startDate: Date
  endDate: Date
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Get the academic year that a given date falls into.
 *
 * @param date - The reference date
 * @param startMonth - Month the academic year begins (0=Jan, 3=Apr, 7=Aug)
 * @returns AcademicYear with start/end dates and label
 *
 * @example
 * getAcademicYear(new Date('2035-02-15'), 3) // April 2034 – March 2035
 * getAcademicYear(new Date('2035-05-15'), 3) // April 2035 – March 2036
 */
export function getAcademicYear(date: Date, startMonth: number): AcademicYear {
  const month = date.getMonth()
  const year = date.getFullYear()

  // If we're before the start month, the academic year started the previous calendar year
  const startYear = month < startMonth ? year - 1 : year
  const endYear = startYear + 1

  const start = new Date(startYear, startMonth, 1)
  const end = new Date(endYear, startMonth, 0) // Last day of month before start

  // Label: "2035-36" if spans two calendar years, "2035" if starts in January
  const label = startMonth === 0
    ? `${startYear}`
    : `${startYear}-${String(endYear).slice(-2)}`

  return { start, end, label, startYear, endYear }
}

/**
 * Get month indices in academic year order.
 *
 * @param startMonth - Month the academic year begins (0-11)
 * @returns Array of 12 month indices in order
 *
 * @example
 * getAcademicMonths(3) // [3, 4, 5, 6, 7, 8, 9, 10, 11, 0, 1, 2]
 * getAcademicMonths(0) // [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
 */
export function getAcademicMonths(startMonth: number): number[] {
  return Array.from({ length: 12 }, (_, i) => (startMonth + i) % 12)
}

/**
 * Get month labels in academic year order.
 *
 * @param startMonth - Month the academic year begins (0-11)
 * @param short - Use short labels (Jan, Feb) instead of full (January, February)
 * @returns Array of 12 month name strings in academic order
 */
export function getAcademicMonthLabels(startMonth: number, short = false): string[] {
  const labels = short ? MONTH_SHORT_LABELS : MONTH_LABELS
  return getAcademicMonths(startMonth).map(m => labels[m])
}

/**
 * Divide the academic year into terms.
 *
 * @param startMonth - Month the academic year begins (0-11)
 * @param termStructure - How to divide the year
 * @returns Array of TermInfo objects
 *
 * @example
 * getTerms(3, 'semester')
 * // [{ term: 1, label: 'Semester 1', startMonth: 3, endMonth: 8 },
 * //  { term: 2, label: 'Semester 2', startMonth: 9, endMonth: 2 }]
 */
export function getTerms(startMonth: number, termStructure: TermStructure): TermInfo[] {
  const option = TERM_STRUCTURE_OPTIONS.find(o => o.value === termStructure)
  const termCount = option?.termCount ?? 2
  const monthsPerTerm = Math.floor(12 / termCount)

  const termLabel = termStructure === 'quarter' ? 'Q' : termStructure === 'trimester' ? 'Term' : 'Semester'

  return Array.from({ length: termCount }, (_, i) => {
    const termStartMonth = (startMonth + i * monthsPerTerm) % 12
    const termEndMonth = (startMonth + (i + 1) * monthsPerTerm - 1) % 12

    return {
      term: i + 1,
      label: `${termLabel} ${i + 1}`,
      startMonth: termStartMonth,
      endMonth: termEndMonth,
      monthCount: monthsPerTerm,
    }
  })
}

/**
 * Find which term a given date falls into.
 *
 * @param date - The reference date
 * @param startMonth - Month the academic year begins (0-11)
 * @param termStructure - How the year is divided
 * @returns TermInfo for the current term, or the first term if date is outside range
 */
export function getCurrentTerm(
  date: Date,
  startMonth: number,
  termStructure: TermStructure,
): TermInfo {
  const month = date.getMonth()
  const terms = getTerms(startMonth, termStructure)
  const academicMonths = getAcademicMonths(startMonth)
  const monthPosition = academicMonths.indexOf(month)
  const monthsPerTerm = Math.floor(12 / terms.length)
  const termIndex = Math.floor(monthPosition / monthsPerTerm)

  return terms[Math.min(termIndex, terms.length - 1)]
}

/**
 * Get term date boundaries for a specific term in a specific academic year.
 *
 * @param term - TermInfo from getTerms()
 * @param academicYear - AcademicYear from getAcademicYear()
 * @returns DateRange with start and end dates
 */
export function getTermDateRange(term: TermInfo, academicYear: AcademicYear): DateRange {
  const { startYear } = academicYear
  const termStartYear = term.startMonth < academicYear.start.getMonth()
    ? startYear + 1
    : startYear
  const termEndYear = term.endMonth < term.startMonth
    ? termStartYear + 1
    : termStartYear

  return {
    startDate: new Date(termStartYear, term.startMonth, 1),
    endDate: new Date(termEndYear, term.endMonth + 1, 0), // Last day of end month
  }
}

/**
 * Map a period label to a concrete date range, respecting academic year settings.
 *
 * This is the key function that replaces all hardcoded date logic in consumer components.
 *
 * @param period - Period identifier
 * @param startMonth - Academic year start month
 * @param termStructure - Term structure
 * @returns DateRange
 *
 * @example
 * getDateRangeForPeriod('this-semester', 3, 'semester')
 * getDateRangeForPeriod('last-3-months', 3, 'semester')
 */
export function getDateRangeForPeriod(
  period: string,
  startMonth: number,
  termStructure: TermStructure,
): DateRange {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (period) {
    case 'this-year': {
      const ay = getAcademicYear(today, startMonth)
      return { startDate: ay.start, endDate: ay.end }
    }

    case 'last-year': {
      // Go back one year from current academic year
      const prevDate = new Date(today)
      prevDate.setFullYear(prevDate.getFullYear() - 1)
      const ay = getAcademicYear(prevDate, startMonth)
      return { startDate: ay.start, endDate: ay.end }
    }

    case 'this-semester':
    case 'this-term': {
      const ay = getAcademicYear(today, startMonth)
      const term = getCurrentTerm(today, startMonth, termStructure)
      return getTermDateRange(term, ay)
    }

    case 'last-semester':
    case 'last-term': {
      // Go back to the previous term
      const terms = getTerms(startMonth, termStructure)
      const currentTerm = getCurrentTerm(today, startMonth, termStructure)
      const currentIdx = terms.findIndex(t => t.term === currentTerm.term)
      const prevIdx = currentIdx > 0 ? currentIdx - 1 : terms.length - 1

      // If we went back to the last term, that's in the previous academic year
      const refDate = currentIdx > 0 ? today : new Date(today.getFullYear() - 1, today.getMonth(), 1)
      const ay = getAcademicYear(refDate, startMonth)
      return getTermDateRange(terms[prevIdx], ay)
    }

    case 'last-month': {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const end = new Date(today.getFullYear(), today.getMonth(), 0)
      return { startDate: start, endDate: end }
    }

    case 'last-3-months': {
      const start = new Date(today.getFullYear(), today.getMonth() - 3, 1)
      return { startDate: start, endDate: today }
    }

    case 'last-6-months': {
      const start = new Date(today.getFullYear(), today.getMonth() - 6, 1)
      return { startDate: start, endDate: today }
    }

    case 'last-12-months': {
      const start = new Date(today.getFullYear(), today.getMonth() - 12, 1)
      return { startDate: start, endDate: today }
    }

    default: {
      // Fallback: last 6 months
      const start = new Date(today.getFullYear(), today.getMonth() - 6, 1)
      return { startDate: start, endDate: today }
    }
  }
}

/**
 * Check if a month name (short or full) falls within a date range.
 *
 * @param monthName - Month name like "Jan", "January", "Feb", etc.
 * @param year - The calendar year
 * @param range - Date range to check against
 * @returns true if the month/year is within the range
 */
/**
 * Reorder and optionally slice a month-based data array to follow academic year order.
 *
 * Data arrays from mocks typically have months in Jan–Dec order.
 * This function reorders them starting from the academic year start month,
 * then optionally slices to the last N months.
 *
 * @param data - Array with a month field (short label like "Jan", "Feb")
 * @param monthKey - Key name for the month field in each data item
 * @param startMonth - Academic year start month (0-11)
 * @param sliceLast - Optional: only return the last N items after reordering
 * @returns Reordered (and optionally sliced) data array
 *
 * @example
 * // Academic year starts April, show last 6 months
 * reorderByAcademicMonth(data, 'month', 3, 6)
 * // Returns data in order: [..., Nov, Dec, Jan, Feb, Mar, Apr] (last 6 from Apr start)
 */
export function reorderByAcademicMonth<T>(
  data: T[],
  monthKey: keyof T,
  startMonth: number,
  sliceLast?: number,
): T[] {
  const academicOrder = getAcademicMonths(startMonth)
  const orderMap = new Map(academicOrder.map((m, i) => [MONTH_SHORT_LABELS[m], i]))

  const sorted = [...data].sort((a, b) => {
    const aMonth = String(a[monthKey]).slice(0, 3)
    const bMonth = String(b[monthKey]).slice(0, 3)
    return (orderMap.get(aMonth as any) ?? 0) - (orderMap.get(bMonth as any) ?? 0)
  })

  if (sliceLast && sliceLast < sorted.length) {
    return sorted.slice(-sliceLast)
  }
  return sorted
}

export function isMonthInRange(monthName: string, year: number, range: DateRange): boolean {
  const shortIdx = MONTH_SHORT_LABELS.findIndex(
    m => m.toLowerCase() === monthName.slice(0, 3).toLowerCase(),
  )
  if (shortIdx === -1) return false

  const monthStart = new Date(year, shortIdx, 1)
  const monthEnd = new Date(year, shortIdx + 1, 0)

  return monthEnd >= range.startDate && monthStart <= range.endDate
}
