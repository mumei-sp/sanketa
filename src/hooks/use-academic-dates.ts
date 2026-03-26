/**
 * Convenience hook bridging SchoolConfig context → academic date utilities.
 *
 * Consumer components call this instead of importing both the context hook
 * and individual utility functions.
 *
 * @example
 * const { academicYear, terms, currentTerm, getRange, academicMonthLabels } = useAcademicDates()
 * const range = getRange('this-semester')
 */

import * as React from 'react'
import { useSchoolConfig } from '@/config/SchoolConfigContext'
import {
  getAcademicYear,
  getAcademicMonths,
  getAcademicMonthLabels,
  getTerms,
  getCurrentTerm,
  getDateRangeForPeriod,
  type AcademicYear,
  type TermInfo,
  type DateRange,
} from '@/utils/academic-date'

interface UseAcademicDatesResult {
  /** Current academic year info (start/end dates, label) */
  academicYear: AcademicYear
  /** All terms in the current academic year */
  terms: TermInfo[]
  /** Which term we're currently in */
  currentTerm: TermInfo
  /** Month indices in academic order */
  academicMonths: number[]
  /** Month labels (short) in academic order e.g. ["Apr", "May", ...] */
  academicMonthLabels: string[]
  /** Get a date range for a named period (respects config) */
  getRange: (period: string) => DateRange
  /** Academic year start month from config */
  startMonth: number
}

export function useAcademicDates(): UseAcademicDatesResult {
  const { config } = useSchoolConfig()
  const { academicYearStartMonth: startMonth, termStructure } = config

  return React.useMemo(() => {
    const now = new Date()
    return {
      academicYear: getAcademicYear(now, startMonth),
      terms: getTerms(startMonth, termStructure),
      currentTerm: getCurrentTerm(now, startMonth, termStructure),
      academicMonths: getAcademicMonths(startMonth),
      academicMonthLabels: getAcademicMonthLabels(startMonth, true),
      getRange: (period: string) => getDateRangeForPeriod(period, startMonth, termStructure),
      startMonth,
    }
  }, [startMonth, termStructure])
}
