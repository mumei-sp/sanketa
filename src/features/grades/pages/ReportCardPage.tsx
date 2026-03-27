/**
 * ReportCardPage — Select a class + exam, view student list, preview & print report cards.
 *
 * Route: /grades/report-card
 * Supports query params: ?class=9A&exam=ut1
 */

import * as React from 'react'
import { useSearchParams } from 'react-router-dom'
import { ScrollText } from 'lucide-react'
import { colors } from '@/theme/colors'
import { spacing } from '@/config/spacing'
import PageHeader from '@/components/layout/PageHeader'
import { Tile } from '@/components/tile'
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet'
import { ReportCardStudentList } from '../components/ReportCardStudentList'
import { ReportCardPreview } from '../components/ReportCardPreview'
import { getGradeBreadcrumbs } from '../utils/breadcrumbs'
import { EXAMS_BY_TERM, GRADE_MESSAGES } from '../constants'
import { useGradeCalculator } from '../hooks/use-grade-calculator'
import {
  fetchAvailableClasses,
  fetchGradeSheet,
  fetchStudentReportCard,
} from '@/api/services/grade-service'
import type { GradeSheetRow, GradeSheetSummary } from '../types'
import type { ReportCardData } from '@/api/services/grade-service'

export function ReportCardPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { calculateGrade, passingThreshold } = useGradeCalculator()

  // ── Reference data ──
  const [classes, setClasses] = React.useState<string[]>([])

  React.useEffect(() => {
    fetchAvailableClasses().then(setClasses)
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

  // ── Grade sheet data ──
  const [rows, setRows] = React.useState<GradeSheetRow[]>([])
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
      } catch (err) {
        console.error('Failed to load grade data:', err)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [selectedClass, selectedExam, calculateGrade, passingThreshold])

  // ── Selected student + report card data ──
  const [selectedStudentId, setSelectedStudentId] = React.useState<string | null>(null)
  const [reportData, setReportData] = React.useState<ReportCardData | null>(null)
  const [isStudentLoading, setIsStudentLoading] = React.useState(false)

  const handleSelectStudent = React.useCallback(async (studentId: string) => {
    setSelectedStudentId(studentId)
    setIsStudentLoading(true)
    try {
      const data = await fetchStudentReportCard(studentId, selectedClass, selectedExam, calculateGrade, passingThreshold)
      setReportData(data)
    } catch (err) {
      console.error('Failed to load report card:', err)
    } finally {
      setIsStudentLoading(false)
    }
  }, [selectedClass, selectedExam, calculateGrade, passingThreshold])

  const handleCloseSheet = React.useCallback(() => {
    setSelectedStudentId(null)
    setReportData(null)
  }, [])

  const handlePrint = React.useCallback(() => {
    window.print()
  }, [])

  const breadcrumbs = React.useMemo(() => getGradeBreadcrumbs('report-card'), [])

  const hasData = rows.length > 0 && rows.some(r => r.total > 0)

  return (
    <div className="space-y-4">
      <PageHeader title="Report Card" breadcrumbs={breadcrumbs} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['4'] }}>
        {/* ═══ TOOLBAR ═══ */}
        <div
          className="rounded-lg border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-wrap no-print"
          style={{
            backgroundColor: colors.background.card,
            borderColor: colors.border.default,
            padding: spacing['3'],
          }}
        >
          <div className="flex items-center gap-3 flex-wrap">
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

          {examObj && (
            <div className="flex items-center gap-1.5 text-xs text-text-muted">
              <ScrollText className="w-3.5 h-3.5" />
              <span>Class {selectedClass} — {examObj.name}</span>
            </div>
          )}
        </div>

        {/* ═══ CONTENT ═══ */}
        {isLoading ? (
          <Tile id="rc-loading" layoutMode="block" background="card" borderRadius="lg" padding="p-6">
            <div className="flex items-center justify-center py-16">
              <span className="text-sm text-text-muted">Loading students...</span>
            </div>
          </Tile>
        ) : !hasData ? (
          <Tile id="rc-empty" layoutMode="block" background="card" borderRadius="lg" padding="p-6">
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <ScrollText className="w-8 h-8" style={{ color: colors.text.muted }} />
              <span className="text-sm text-text-muted">{GRADE_MESSAGES.NO_REPORT_DATA}</span>
            </div>
          </Tile>
        ) : (
          <Tile
            id="rc-student-list"
            layoutMode="block"
            background="card"
            borderRadius="lg"
            shadowed={false}
            padding="p-6"
            overflow="auto"
          >
            <div className="mb-3">
              <p className="text-xs text-text-muted">
                {rows.length} student{rows.length !== 1 ? 's' : ''} — click a row to preview their report card.
              </p>
            </div>
            <ReportCardStudentList
              rows={rows}
              onSelectStudent={handleSelectStudent}
              selectedStudentId={selectedStudentId}
            />
          </Tile>
        )}
      </div>

      {/* ═══ REPORT CARD SHEET ═══ */}
      <Sheet open={selectedStudentId !== null} onOpenChange={open => { if (!open) handleCloseSheet() }}>
        <SheetContent
          side="right"
          size="2xl"
          className="flex flex-col p-0 gap-0"
        >
          <SheetTitle className="sr-only">Report Card Preview</SheetTitle>
          {isStudentLoading ? (
            <div className="flex items-center justify-center py-16 flex-1">
              <span className="text-sm text-text-muted">Loading report card...</span>
            </div>
          ) : reportData ? (
            <ReportCardPreview
              gradeRow={reportData.gradeRow}
              subjects={reportData.subjects}
              classId={selectedClass}
              examName={reportData.exam.name}
              maxMarks={reportData.maxMarks}
              attendance={reportData.attendance}
              onPrint={handlePrint}
            />
          ) : (
            <div className="flex items-center justify-center py-16 flex-1">
              <span className="text-sm text-text-muted">No data available</span>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default ReportCardPage
