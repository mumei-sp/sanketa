/**
 * A family's marks view.
 *
 * The staff grade sheet is a class in a table, and the entry screen is a form.
 * Neither belongs to a parent. This is one child's published marks, by exam.
 *
 * "Published" is doing real work: a submission the school has not published is
 * refused at the service, so a sheet a teacher is still amending does not
 * reach a family mid-edit. That means this page is empty until someone
 * publishes, which is correct and worth saying on the page rather than leaving
 * as a blank panel that looks broken.
 */

import * as React from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { Skeleton } from '@/components/ui/skeleton'
import { border, text } from '@/theme/colors'
import { useSchoolConfig } from '@/config/SchoolConfigContext'
import { useGradeCalculator } from '@/features/grades/hooks/use-grade-calculator'
import { fetchExams, fetchGradeSubmission } from '@/api/services/grade-service'
import { getDisplayName } from '@/features/students/utils/formatting'
import { classSectionOf } from '@/utils/class-section-helpers'
import { useFamilyScope } from '../FamilyScopeContext'
import { ChildSwitcher } from '../components/ChildSwitcher'
import type { Exam, GradeEntry } from '@/features/grades/types'

interface SubjectMark {
  subjectId: string
  subjectName: string
  entry: GradeEntry
}

export function FamilyGrades() {
  const { selected, isLoading } = useFamilyScope()
  const { config } = useSchoolConfig()
  const { calculateGrade } = useGradeCalculator()

  const [exams, setExams] = React.useState<Exam[]>([])
  const [examId, setExamId] = React.useState<string | null>(null)
  const [marks, setMarks] = React.useState<SubjectMark[] | null>(null)

  const studentId = selected ? String(selected.id) : null
  const classSection = selected ? classSectionOf(selected) : undefined

  React.useEffect(() => {
    fetchExams()
      .then(rows => {
        setExams(rows)
        setExamId(current => current ?? rows[0]?.id ?? null)
      })
      .catch(error => console.error('Failed to load exams', error))
  }, [])

  React.useEffect(() => {
    if (!studentId || !classSection || !examId) return
    let cancelled = false
    setMarks(null)

    Promise.all(
      config.subjects.map(async subject => {
        const submission = await fetchGradeSubmission(classSection, examId, subject.id)
        // Refused submissions come back null, and a subject with no line for
        // this child comes back with no entry — both mean "nothing to show"
        // rather than a zero.
        const entry = submission?.entries.find(row => row.studentId === studentId)
        return entry ? { subjectId: subject.id, subjectName: subject.name, entry } : null
      }),
    )
      .then(rows => {
        if (!cancelled) setMarks(rows.filter((row): row is SubjectMark => row !== null))
      })
      .catch(error => console.error('Failed to load marks', error))

    return () => {
      cancelled = true
    }
  }, [studentId, classSection, examId, config.subjects])

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Marks"
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Marks' }]}
      />

      <ChildSwitcher />

      {exams.length > 1 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Choose an exam">
          {exams.map(exam => (
            <button
              key={exam.id}
              type="button"
              aria-pressed={examId === exam.id}
              onClick={() => setExamId(exam.id)}
              className="rounded-full border px-3 py-1 text-caption font-medium transition-colors"
              style={{
                borderColor: examId === exam.id ? 'var(--heading)' : border.default,
                backgroundColor: examId === exam.id ? 'var(--heading)' : 'transparent',
                color: examId === exam.id ? 'var(--card)' : 'var(--heading)',
              }}
            >
              {exam.name}
            </button>
          ))}
        </div>
      )}

      {isLoading || (studentId && marks === null) ? (
        <Skeleton className="h-56 w-full rounded-xl" />
      ) : !selected ? (
        <p
          className="rounded-xl border border-dashed p-8 text-center text-body-muted"
          style={{ borderColor: border.default }}
        >
          This account is not linked to a student yet.
        </p>
      ) : marks && marks.length === 0 ? (
        <p
          className="rounded-xl border border-dashed p-8 text-center text-body-muted"
          style={{ borderColor: border.default, color: text.muted }}
        >
          Nothing published yet. Marks appear here once the school releases them, which is
          usually after every subject has been entered and checked.
        </p>
      ) : (
        <div
          className="overflow-x-auto rounded-xl border"
          style={{ borderColor: border.default, backgroundColor: 'var(--card)' }}
        >
          <table className="w-full border-collapse text-left">
            <caption className="px-4 pt-4 text-left text-body-muted" style={{ color: text.muted }}>
              {getDisplayName(selected)} &middot; {classSection}
            </caption>
            <thead>
              <tr>
                {['Subject', 'Marks', 'Grade', 'Remarks'].map(heading => (
                  <th
                    key={heading}
                    scope="col"
                    className="px-4 py-2.5 text-caption font-semibold"
                    style={{ color: 'var(--heading)', borderBottom: `1px solid ${border.default}` }}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(marks ?? []).map(({ subjectId, subjectName, entry }) => {
                const scored = entry.marksObtained
                const grade =
                  scored === null ? null : calculateGrade(scored, entry.maxMarks)
                return (
                  <tr key={subjectId} style={{ borderTop: `1px solid ${border.default}` }}>
                    <td className="px-4 py-2.5 text-body" style={{ color: 'var(--heading)' }}>
                      {subjectName}
                    </td>
                    <td className="px-4 py-2.5 text-body tabular-nums">
                      {scored === null ? '—' : `${scored} / ${entry.maxMarks}`}
                    </td>
                    <td className="px-4 py-2.5 text-body font-medium" style={{ color: 'var(--heading)' }}>
                      {grade?.label ?? '—'}
                    </td>
                    <td className="px-4 py-2.5 text-caption" style={{ color: text.muted }}>
                      {entry.remarks || '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
