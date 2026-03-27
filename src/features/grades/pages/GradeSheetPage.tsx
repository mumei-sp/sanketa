/**
 * GradeSheetPage — Read-only spreadsheet view of all grades for a class + exam.
 *
 * Route: /grades/sheet
 * Supports query params: ?class=9A&exam=ut1
 */

import * as React from 'react'
import { useSearchParams } from 'react-router-dom'
import { FileSpreadsheet } from 'lucide-react'
import { colors } from '@/theme/colors'
import { spacing } from '@/config/spacing'
import PageHeader from '@/components/layout/PageHeader'
import { Tile } from '@/components/tile'
import { GradeSheetTable } from '../components/GradeSheetTable'
import { getGradeBreadcrumbs } from '../utils/breadcrumbs'
import { EXAMS_BY_TERM, GRADE_MESSAGES } from '../constants'
import { useGradeCalculator } from '../hooks/use-grade-calculator'
import {
  fetchAvailableClasses,
  fetchGradeableSubjects,
  fetchGradeSheet,
} from '@/api/services/grade-service'
import type { GradeSheetRow, GradeSheetSummary } from '../types'

export function GradeSheetPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { calculateGrade, passingThreshold } = useGradeCalculator()

  // ── Reference data ──
  const [classes, setClasses] = React.useState<string[]>([])
  const [subjectList, setSubjectList] = React.useState<{ id: string; name: string; shortName: string }[]>([])

  React.useEffect(() => {
    Promise.all([fetchAvailableClasses(), fetchGradeableSubjects()]).then(([cls, subs]) => {
      setClasses(cls)
      setSubjectList(subs)
    })
  }, [])

  // ── Selections ──
  const selectedClass = searchParams.get('class') ?? classes[0] ?? ''
  const selectedExam = searchParams.get('exam') ?? 'ut1'

  const handleParamChange = React.useCallback((key: string, value: string) => {
    setSearchParams(prev => {
      prev.set(key, value)
      return prev
    })
  }, [setSearchParams])

  const examObj = React.useMemo(
    () => EXAMS_BY_TERM.flatMap(t => t.exams).find(e => e.id === selectedExam),
    [selectedExam],
  )

  // ── Data ──
  const [rows, setRows] = React.useState<GradeSheetRow[]>([])
  const [summary, setSummary] = React.useState<GradeSheetSummary>({
    subjectAverages: {}, classAverage: 0, passCount: 0, failCount: 0, totalStudents: 0,
  })
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    if (!selectedClass || !selectedExam) return
    let cancelled = false

    async function load() {
      setIsLoading(true)
      try {
        const data = await fetchGradeSheet(selectedClass, selectedExam, calculateGrade, passingThreshold)
        if (cancelled) return
        setRows(data.rows)
        setSummary(data.summary)
      } catch (err) {
        console.error('Failed to load grade sheet:', err)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [selectedClass, selectedExam, calculateGrade, passingThreshold])

  const breadcrumbs = React.useMemo(() => getGradeBreadcrumbs('sheet'), [])

  return (
    <div className="space-y-4">
      <PageHeader title="Grade Sheet" breadcrumbs={breadcrumbs} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['4'] }}>
        {/* ═══ TOOLBAR ═══ */}
        <div
          className="rounded-lg border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-wrap"
          style={{
            backgroundColor: colors.background.card,
            borderColor: colors.border.default,
            padding: spacing['3'],
          }}
        >
          <div className="flex items-center gap-3 flex-wrap">
            {/* Class selector */}
            <select
              value={selectedClass}
              onChange={e => handleParamChange('class', e.target.value)}
              className="text-sm rounded-md border px-3 py-1.5 outline-none"
              style={{
                borderColor: colors.border.default,
                color: colors.text.heading,
                backgroundColor: colors.background.card,
              }}
            >
              {classes.map(cls => (
                <option key={cls} value={cls}>Class {cls}</option>
              ))}
            </select>

            {/* Exam selector */}
            <select
              value={selectedExam}
              onChange={e => handleParamChange('exam', e.target.value)}
              className="text-sm rounded-md border px-3 py-1.5 outline-none"
              style={{
                borderColor: colors.border.default,
                color: colors.text.heading,
                backgroundColor: colors.background.card,
              }}
            >
              {EXAMS_BY_TERM.map(term => (
                <optgroup key={term.termId} label={term.termName}>
                  {term.exams.map(exam => (
                    <option key={exam.id} value={exam.id}>
                      {exam.name} ({exam.maxMarks}m)
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Info */}
          {examObj && (
            <div className="flex items-center gap-1.5 text-xs text-text-muted">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Class {selectedClass} — {examObj.name}</span>
            </div>
          )}
        </div>

        {/* ═══ CONTENT ═══ */}
        {isLoading ? (
          <Tile id="sheet-loading" layoutMode="block" background="card" borderRadius="lg" padding="p-6">
            <div className="flex items-center justify-center py-16">
              <span className="text-sm text-text-muted">Loading grade sheet...</span>
            </div>
          </Tile>
        ) : rows.length === 0 || rows.every(r => r.total === 0) ? (
          <Tile id="sheet-empty" layoutMode="block" background="card" borderRadius="lg" padding="p-6">
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <FileSpreadsheet className="w-8 h-8" style={{ color: colors.text.muted }} />
              <span className="text-sm text-text-muted">{GRADE_MESSAGES.EMPTY_SHEET}</span>
            </div>
          </Tile>
        ) : (
          <Tile
            id="grade-sheet-tile"
            layoutMode="block"
            background="card"
            borderRadius="lg"
            shadowed={false}
            padding="p-6"
            overflow="auto"
          >
            <GradeSheetTable
              rows={rows}
              summary={summary}
              subjectList={subjectList}
            />
          </Tile>
        )}
      </div>
    </div>
  )
}

export default GradeSheetPage
