import * as React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStudentById } from '@/features/students/hooks/use-student-by-id'
import { getDisplayName } from '@/features/students/utils/formatting'
import { getStudentBreadcrumbs } from '@/features/students/utils/breadcrumbs'
import { StudentPageLayout } from '@/features/students/components/StudentPageLayout'
import { ExtracurricularForm } from '@/features/students/components/ExtracurricularForm'
import { StudentFormActions } from '@/features/students/components/StudentFormActions'
import { useExtracurricularForm } from '@/features/students/hooks/use-extracurricular-form'
import type { ExtracurricularFormValues } from '@/features/students/schemas/extracurricular-schema'
import type { ExtracurricularActivity } from '@/features/students/types'
import { updateStudentExtracurricular } from '@/api/services/student-service'
import { STUDENT_MESSAGES, STUDENT_LABELS } from '@/features/students/constants'

/**
 * EditExtracurricular page – dedicated page for editing only a student's extracurricular activities.
 *
 * Flow:
 * - Loads student by id from URL (useStudentById).
 * - Renders StudentPageLayout (header, breadcrumbs, back, loading/error).
 * - When student is loaded: renders ExtracurricularForm (dynamic list of activities) and
 *   StudentFormActions (Cancel / Save). Save triggers form submit via onHandlersReady.
 * - On submit: currently logs data and navigates back to student details (persist can be wired later).
 */
export default function EditExtracurricular() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { student, isLoading, error } = useStudentById(id)

  // Form hook: initializes React Hook Form with student's current activities (or one empty row)
  const { control, handleSubmit, fieldArray } = useExtracurricularForm(
    student?.extracurricularActivities,
  )

  // Ref to hold the form's submit handler so the Save button (outside the form) can trigger submit
  const formSubmitRef = React.useRef<() => void | undefined>(undefined)

  const handleFormHandlersReady = React.useCallback((handlers: { handleFormSubmit: () => void }) => {
    formSubmitRef.current = handlers.handleFormSubmit
  }, [])

  /** Called when user clicks Save. Builds duration string from startYear and endYear (e.g. "2029 - Present"). */
  const onSubmit = React.useCallback(
    async (data: ExtracurricularFormValues) => {
      if (!id) return
      const activities: ExtracurricularActivity[] = data.activities.map(a => {
        const duration = [a.startYear?.trim(), a.endYear?.trim()].filter(Boolean).join(' - ') || ''
        return {
          club: a.club,
          role: a.role || undefined,
          achievements: a.achievements || undefined,
          duration,
          advisor: a.advisor,
          ...(a.iconKey && String(a.iconKey).trim() !== '' ? { iconKey: a.iconKey as ExtracurricularActivity['iconKey'] } : {}),
        }
      })
      updateStudentExtracurricular(id, activities)
      navigate(`/students/details/${id}`)
    },
    [navigate, id],
  )

  /** Cancel: go back to student details. */
  const handleCancel = React.useCallback(() => {
    if (id) {
      navigate(`/students/details/${id}`)
    } else {
      navigate(-1)
    }
  }, [navigate, id])

  /** Save: trigger the form's submit (validation runs; onSubmit runs only if valid). */
  const handleSaveClick = React.useCallback(() => {
    if (formSubmitRef.current) {
      formSubmitRef.current()
    } else {
      console.warn('Extracurricular form submit not ready yet')
    }
  }, [])

  const displayName = student ? getDisplayName(student) : 'Student'
  const breadcrumbs = React.useMemo(
    () => getStudentBreadcrumbs('extracurricular-edit', displayName, id ?? undefined),
    [displayName, id],
  )

  return (
    <StudentPageLayout
      title="Edit Extracurricular"
      breadcrumbs={breadcrumbs}
      showBackButton
      isLoading={isLoading}
      error={error || (!student && !isLoading ? STUDENT_MESSAGES.NOT_FOUND : null)}
      errorActionLabel={STUDENT_MESSAGES.BACK_TO_STUDENTS}
      onErrorAction={() => navigate('/students')}
      loadingMessage={STUDENT_MESSAGES.LOADING_DETAILS}
    >
      {student && (
        <>
          <ExtracurricularForm
            control={control}
            fieldArray={fieldArray}
            handleSubmit={handleSubmit}
            onSubmit={onSubmit}
            onHandlersReady={handleFormHandlersReady}
          />
          <StudentFormActions
            onCancel={handleCancel}
            onSave={handleSaveClick}
            saveLabel={STUDENT_LABELS.SAVE_CHANGES}
            cancelLabel={STUDENT_LABELS.CANCEL}
          />
        </>
      )}
    </StudentPageLayout>
  )
}
