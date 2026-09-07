/**
 * GradeSheetPage — Read-only spreadsheet view of all grades for a class + exam.
 *
 * Includes report card preview via Sheet overlay when clicking a student row.
 *
 * Route: /grades/sheet
 * Supports query params: ?class=9A&exam=ut1
 */

import * as React from 'react'
import { useSearchParams } from 'react-router-dom'
import { FileSpreadsheet, Download } from 'lucide-react'
import { colors } from '@/theme/colors'
import { spacing } from '@/config/spacing'
import PageHeader from '@/components/layout/PageHeader'
import { Tile } from '@/components/tile'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet'
import { GradeSheetTable } from '../components/GradeSheetTable'
import { ReportCardPreview } from '../components/ReportCardPreview'
import { getGradeBreadcrumbs } from '../utils/breadcrumbs'
import { EXAMS_BY_TERM, GRADE_MESSAGES } from '../constants'
import { useGradeCalculator } from '../hooks/use-grade-calculator'
import { useSchoolConfig } from '@/config/SchoolConfigContext'
import { getClassLabels } from '@/utils/class-section-helpers'
import { ClassWorkspaceStrip } from '@/components/shared/ClassWorkspaceStrip'
import { TOOLBAR_CONTROL_HEIGHT, TOOLBAR_FULL } from '@/components/table'
import { cn } from '@/lib/utils'
import {
  fetchGradeableSubjects,
  fetchGradeSheet,
  fetchStudentReportCard,
} from '@/api/services/grade-service'
import { generateCsv, downloadCsv } from '@/lib/csv'
import type { GradeSheetRow, GradeSheetSummary } from '../types'
import type { ReportCardData } from '@/api/services/grade-service'

export function GradeSheetPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { calculateGrade, passingThreshold } = useGradeCalculator()

  // ── Reference data ──
  const { config } = useSchoolConfig()
  const classes = React.useMemo(() => getClassLabels(config.classSections), [config.classSections])
  const [subjectList, setSubjectList] = React.useState<{ id: string; name: string; shortName: string }[]>([])

  React.useEffect(() => {
    fetchGradeableSubjects().then(setSubjectList)
  }, [])

  // ── Class workspace ──
  // Principals + class teachers often compare sections of the same grade
  // (e.g. "9A vs 9B average GPA on UT1"). `loadedClasses` holds the set
  // they've picked; `selectedClass` is the one currently rendered in the
  // sheet. Switching is a single click on the workspace chips.
  const [loadedClasses, setLoadedClasses] = React.useState<string[]>([])

  // ── Selections ──
  const urlClass = searchParams.get('class')
  const selectedClass =
    urlClass && (loadedClasses.length === 0 || loadedClasses.includes(urlClass))
      ? urlClass
      : loadedClasses[0] ?? classes[0] ?? ''
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

  // ── Report card overlay ──
  const [selectedStudentId, setSelectedStudentId] = React.useState<string | null>(null)
  const [reportData, setReportData] = React.useState<ReportCardData | null>(null)
  const [isStudentLoading, setIsStudentLoading] = React.useState(false)

  const handleViewReportCard = React.useCallback(async (studentId: string) => {
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

  const breadcrumbs = React.useMemo(() => getGradeBreadcrumbs('sheet'), [])

  return (
    <div className="space-y-4">
      <PageHeader title="Grade Sheet" breadcrumbs={breadcrumbs} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['4'] }}>
        {/* ═══ TOOLBAR ═══ */}
        <div
          className="rounded-lg border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 flex-wrap"
          style={{
            backgroundColor: colors.background.card,
            borderColor: colors.border.default,
            padding: spacing['3'],
          }}
        >
          <div className="flex items-center gap-3 flex-wrap max-md:w-full max-md:gap-2">
            {/* Class workspace — flip between loaded classes with one click. */}
            <ClassWorkspaceStrip
              storageKey="grade-sheet-workspace"
              classes={classes}
              loadedClasses={loadedClasses}
              selectedClass={selectedClass}
              onSelect={cls => handleParamChange('class', cls)}
              onLoadedChange={setLoadedClasses}
              className={TOOLBAR_FULL}
            />


            <select
              value={selectedExam}
              onChange={e => handleParamChange('exam', e.target.value)}
              className={cn('rounded-md border px-3 text-sm outline-none', TOOLBAR_CONTROL_HEIGHT, TOOLBAR_FULL)}
              style={{
                borderColor: colors.border.default,
                color: 'var(--heading)',
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

          <div className="flex items-center gap-3 max-md:w-full max-md:justify-between">
            {examObj && (
              <div className="flex items-center gap-1.5 text-xs text-text-muted">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Class {selectedClass} — {examObj.name}</span>
              </div>
            )}
            {rows.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const csvCols = [
                    { key: 'rollNumber' as const, header: 'Roll #' },
                    { key: 'studentName' as const, header: 'Student' },
                    ...subjectList.map(s => ({ key: `sub_${s.id}` as string, header: s.name })),
                    { key: 'total' as const, header: 'Total' },
                    { key: 'percentage' as const, header: '%' },
                    { key: 'overallGrade' as const, header: 'Grade' },
                    { key: 'gpa' as const, header: 'GPA' },
                  ]
                  const csvData = rows.map(r => {
                    const flat: Record<string, unknown> = { ...r }
                    subjectList.forEach(s => { flat[`sub_${s.id}`] = r.subjects[s.id]?.marks ?? '' })
                    return flat
                  })
                  const csv = generateCsv(csvData as Record<string, unknown>[], csvCols as { key: string; header: string }[])
                  downloadCsv(csv, `grades-${selectedClass}-${selectedExam}.csv`)
                }}
                className="tap-target flex items-center justify-center gap-1.5 text-xs font-medium rounded-md px-3 py-1.5 cursor-pointer transition-colors"
                style={{ backgroundColor: 'var(--accent)', color: 'var(--heading)' }}
              >
                <Download className="w-3.5 h-3.5" />
                Export
              </button>
            )}
          </div>
        </div>

        {/* ═══ CONTENT ═══ */}
        {isLoading ? (
          <Tile id="sheet-loading" layoutMode="block" background="card" borderRadius="lg" padding="p-6">
            <div className="space-y-4">
              {/* Toolbar skeleton */}
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-[160px]" />
                <Skeleton className="h-8 w-[120px]" />
              </div>
              {/* Table header skeleton */}
              <Skeleton className="h-10 w-full rounded" />
              {/* Row skeletons */}
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded" />
              ))}
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
              onViewReportCard={handleViewReportCard}
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

export default GradeSheetPage
