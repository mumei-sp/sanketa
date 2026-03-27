/**
 * GradeEntryPage — Mark entry page for grades.
 *
 * Route: /grades/entry
 * Supports query params: ?class=9A&exam=ut1&subject=math
 *
 * Pattern mirrors DailyAttendancePage: class/exam/subject selectors,
 * status banner, desktop table + mobile cards, sticky summary bar.
 */

import * as React from 'react'
import { useSearchParams } from 'react-router-dom'
import { CheckCircle, AlertTriangle, FileEdit } from 'lucide-react'
import { colors, darken, baseColors } from '@/theme/colors'
import { spacing } from '@/config/spacing'
import PageHeader from '@/components/layout/PageHeader'
import { Tile } from '@/components/tile'
import { GradeEntryTable } from '../components/GradeEntryTable'
import { GradeEntryCards } from '../components/GradeEntryCards'
import { GradeSummaryBar } from '../components/GradeSummaryBar'
import { getGradeBreadcrumbs } from '../utils/breadcrumbs'
import { EXAMS_BY_TERM } from '../constants'
import {
  fetchAvailableClasses,
  fetchGradeableSubjects,
  fetchGradeSubmission,
  fetchClassRosterEntries,
  saveGradeDraft,
  submitGrades,
} from '@/api/services/grade-service'
import type { GradeEntry, GradeSubmission } from '../types'

export function GradeEntryPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  // ── Reference data ──
  const [classes, setClasses] = React.useState<string[]>([])
  const [subjects, setSubjects] = React.useState<{ id: string; name: string; shortName: string }[]>([])

  React.useEffect(() => {
    Promise.all([fetchAvailableClasses(), fetchGradeableSubjects()]).then(([cls, subs]) => {
      setClasses(cls)
      setSubjects(subs)
    })
  }, [])

  // ── Selections from URL params ──
  const selectedClass = searchParams.get('class') ?? classes[0] ?? ''
  const selectedExam = searchParams.get('exam') ?? 'ut1'
  const selectedSubject = searchParams.get('subject') ?? subjects[0]?.id ?? 'math'

  const handleParamChange = React.useCallback((key: string, value: string) => {
    setSearchParams(prev => {
      prev.set(key, value)
      return prev
    })
  }, [setSearchParams])

  // ── Get exam metadata ──
  const examObj = React.useMemo(
    () => EXAMS_BY_TERM.flatMap(t => t.exams).find(e => e.id === selectedExam),
    [selectedExam],
  )
  const maxMarks = examObj?.maxMarks ?? 100

  // ── Grade entries + existing submission ──
  const [entries, setEntries] = React.useState<GradeEntry[]>([])
  const [existingSubmission, setExistingSubmission] = React.useState<GradeSubmission | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)

  // Load data when selection changes
  React.useEffect(() => {
    if (!selectedClass || !selectedExam || !selectedSubject) return
    let cancelled = false

    async function load() {
      setIsLoading(true)
      try {
        const [submission, roster] = await Promise.all([
          fetchGradeSubmission(selectedClass, selectedExam, selectedSubject),
          fetchClassRosterEntries(selectedClass, maxMarks),
        ])

        if (cancelled) return

        setExistingSubmission(submission)

        // Merge: use submission entries if they exist, else blank from roster
        if (submission) {
          setEntries(submission.entries.map(e => ({ ...e })))
        } else {
          setEntries(roster)
        }
      } catch (err) {
        console.error('Failed to load grade data:', err)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [selectedClass, selectedExam, selectedSubject, maxMarks])

  // ── Handlers ──

  const handleMarksChange = React.useCallback((studentId: string, marks: number | null) => {
    setEntries(prev => prev.map(e =>
      e.studentId === studentId ? { ...e, marksObtained: marks } : e,
    ))
  }, [])

  const handleRemarksChange = React.useCallback((studentId: string, remarks: string) => {
    setEntries(prev => prev.map(e =>
      e.studentId === studentId ? { ...e, remarks } : e,
    ))
  }, [])

  const handleSaveDraft = React.useCallback(async () => {
    setIsSaving(true)
    try {
      const sub = await saveGradeDraft(selectedClass, selectedExam, selectedSubject, entries)
      setExistingSubmission(sub)
    } catch (err) {
      console.error('Failed to save draft:', err)
    } finally {
      setIsSaving(false)
    }
  }, [selectedClass, selectedExam, selectedSubject, entries])

  const handleSubmit = React.useCallback(async () => {
    setIsSaving(true)
    try {
      const sub = await submitGrades(selectedClass, selectedExam, selectedSubject, entries)
      setExistingSubmission(sub)
    } catch (err) {
      console.error('Failed to submit grades:', err)
    } finally {
      setIsSaving(false)
    }
  }, [selectedClass, selectedExam, selectedSubject, entries])

  // ── Breadcrumbs ──
  const breadcrumbs = React.useMemo(() => getGradeBreadcrumbs('entry'), [])

  // ── Subject display name ──
  const subjectName = subjects.find(s => s.id === selectedSubject)?.name ?? ''

  return (
    <div className="space-y-4">
      <PageHeader title="Grade Entry" breadcrumbs={breadcrumbs} />

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

            {/* Exam selector (grouped by term) */}
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

            {/* Subject selector */}
            <select
              value={selectedSubject}
              onChange={e => handleParamChange('subject', e.target.value)}
              className="text-sm rounded-md border px-3 py-1.5 outline-none"
              style={{
                borderColor: colors.border.default,
                color: colors.text.heading,
                backgroundColor: colors.background.card,
              }}
            >
              {subjects.map(sub => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </select>
          </div>

          {/* Exam info badge */}
          {examObj && (
            <div className="flex items-center gap-1.5 text-xs text-text-muted">
              <FileEdit className="w-3.5 h-3.5" />
              <span>Max marks: {examObj.maxMarks}</span>
            </div>
          )}
        </div>

        {/* ═══ STATUS BANNER ═══ */}
        {selectedClass && (
          <div
            className="rounded-lg border flex items-center gap-2 text-sm"
            style={{
              padding: `${spacing['2.5']} ${spacing['3']}`,
              borderColor: darken(baseColors.blue, 10),
              backgroundColor: colors.accent.base,
              color: colors.text.heading,
            }}
          >
            {existingSubmission?.status === 'submitted' ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>
                  Submitted by <strong>{existingSubmission.submittedBy}</strong>
                  {existingSubmission.submittedAt && (
                    <> on {new Date(existingSubmission.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</>
                  )}
                </span>
              </>
            ) : existingSubmission?.status === 'draft' ? (
              <>
                <FileEdit className="w-4 h-4" />
                <span>
                  Draft saved — {subjectName} grades for Class {selectedClass} ({examObj?.name})
                </span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4" />
                <span>
                  Grades not yet entered — {subjectName} for Class {selectedClass} ({examObj?.name})
                </span>
              </>
            )}
          </div>
        )}

        {/* ═══ CONTENT ═══ */}
        {isLoading ? (
          <Tile id="grade-loading" layoutMode="block" background="card" borderRadius="lg" padding="p-6">
            <div className="flex items-center justify-center py-16">
              <span className="text-sm text-text-muted">Loading grades...</span>
            </div>
          </Tile>
        ) : entries.length === 0 ? (
          <Tile id="grade-empty" layoutMode="block" background="card" borderRadius="lg" padding="p-6">
            <div className="flex items-center justify-center py-16">
              <span className="text-sm text-text-muted">No students found for Class {selectedClass}</span>
            </div>
          </Tile>
        ) : (
          <>
            <Tile
              id="grade-entry-tile"
              layoutMode="block"
              background="card"
              borderRadius="lg"
              shadowed={false}
              padding="p-6"
              overflow="auto"
            >
              {/* Desktop: table */}
              <div className="hidden lg:block">
                <GradeEntryTable
                  entries={entries}
                  onMarksChange={handleMarksChange}
                  onRemarksChange={handleRemarksChange}
                  disabled={isSaving}
                />
              </div>

              {/* Mobile/Tablet: cards */}
              <div className="block lg:hidden">
                <GradeEntryCards
                  entries={entries}
                  onMarksChange={handleMarksChange}
                  onRemarksChange={handleRemarksChange}
                  disabled={isSaving}
                />
              </div>
            </Tile>

            {/* Summary bar — outside Tile so sticky works against viewport */}
            <GradeSummaryBar
              entries={entries}
              isSaving={isSaving}
              onSaveDraft={handleSaveDraft}
              onSubmit={handleSubmit}
            />
          </>
        )}
      </div>
    </div>
  )
}

export default GradeEntryPage
