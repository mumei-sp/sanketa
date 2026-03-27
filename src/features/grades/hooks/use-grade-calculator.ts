/**
 * useGradeCalculator — computes grade labels from raw marks using the configured grade scale.
 *
 * Reads config.grading from SchoolConfigContext so grade labels respond reactively
 * when the admin changes the grading preset (CBSE → ICSE, etc.).
 */

import * as React from 'react'
import { useSchoolConfig } from '@/config/SchoolConfigContext'

export interface GradeResult {
  /** Percentage score (0-100) */
  percentage: number
  /** Grade label (e.g., "A1", "1", or "—" if no match) */
  label: string
  /** Grade points (e.g., 10 for A1 in CBSE) */
  points: number
  /** Whether the student passes based on configured threshold */
  isPassing: boolean
}

export function useGradeCalculator() {
  const { config } = useSchoolConfig()
  const { entries, passingThreshold } = config.grading

  const calculateGrade = React.useCallback(
    (marks: number, maxMarks: number): GradeResult => {
      if (maxMarks <= 0) return { percentage: 0, label: '—', points: 0, isPassing: false }
      const pct = (marks / maxMarks) * 100
      const entry = entries.find(e => pct >= e.minPercent && pct <= e.maxPercent)
      return {
        percentage: Math.round(pct * 10) / 10,
        label: entry?.label ?? '—',
        points: entry?.gradePoints ?? 0,
        isPassing: pct >= passingThreshold,
      }
    },
    [entries, passingThreshold],
  )

  const calculateGPA = React.useCallback(
    (pointsList: number[]): number => {
      if (!pointsList.length) return 0
      return Math.round((pointsList.reduce((a, b) => a + b, 0) / pointsList.length) * 10) / 10
    },
    [],
  )

  return { calculateGrade, calculateGPA, passingThreshold }
}
