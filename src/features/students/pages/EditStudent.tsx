import * as React from 'react'
import { Lock } from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import { StudentForm } from '../components/StudentForm'
import type { StudentFormValues } from '../schemas/student-schema'
import { studentToForm } from '../utils/transform'
import { useStudentById } from '../hooks/use-student-by-id'
import { DetailPageLayout } from '@/components/ui/detail-page-layout'
import { StudentFormActions } from '../components/StudentFormActions'
import { getStudentBreadcrumbs } from '../utils/breadcrumbs'
import { useStudentFormHandlers } from '../hooks/use-student-form-handlers'
import { updateStudent } from '@/api/services/student-service'
import { formToStudent } from '../utils/transform'
import { STUDENT_MESSAGES, STUDENT_LABELS } from '../constants'
import { useAppToast } from '@/hooks/use-app-toast'
import { usePermissions } from '@/features/auth/PermissionContext'
import { canWriteStudent, classSectionOf } from '@/utils/class-section-helpers'

export default function EditStudent() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { student, isLoading, error } = useStudentById(id)
  const { handleHandlersReady, handleSaveClick } = useStudentFormHandlers()
  const { showSuccess, showError } = useAppToast()
  const { can, role } = usePermissions()

  /**
   * Whether this particular student may be edited.
   *
   * The route only asks "may you edit students at all"; a scoped holder also
   * has to own the class this one is in. Checked against the *stored* class
   * rather than the form's, so moving a student out of your class does not
   * grant you the edit — and against the form's on save, so you cannot move
   * one into a class that is not yours either.
   */
  const canEditThisStudent =
    canWriteStudent(student, scope => can('students.update', scope), role?.scopeBy === 'classes')

  const onSubmit = React.useCallback(
    async (data: StudentFormValues) => {
      if (!id) return
      if (!canEditThisStudent) {
        showError('This student is not in one of your classes')
        return
      }
      const destination = classSectionOf(formToStudent(data))
      if (!can('students.update', { classSection: destination })) {
        showError('That class is not yours', {
          description: `You cannot move a student into ${destination ?? 'that class'}.`,
        })
        return
      }
      try {
        const studentData = formToStudent(data)
        await updateStudent(id, studentData)
        showSuccess('Student updated', { description: `${data.personalInfo.firstName} ${data.personalInfo.lastName}'s details have been saved.` })
        navigate(`/students/details/${id}`)
      } catch {
        showError('Failed to update student', { description: 'Please try again.' })
      }
    },
    [navigate, id, can, canEditThisStudent, showSuccess, showError],
  )

  const handleCancel = React.useCallback(() => {
    if (id) {
      navigate(`/students/details/${id}`)
    } else {
      navigate(-1)
    }
  }, [navigate, id])

  const handleErrorAction = React.useCallback(() => {
    navigate('/students')
  }, [navigate])

  const breadcrumbs = React.useMemo(() => getStudentBreadcrumbs('edit'), [])
  const defaultValues = student ? studentToForm(student) : undefined

  return (
    <DetailPageLayout
      title="Edit Student"
      breadcrumbs={breadcrumbs}
      showBackButton
      isLoading={isLoading}
      error={error || (!student && !isLoading ? STUDENT_MESSAGES.NOT_FOUND : null)}
      errorActionLabel={STUDENT_MESSAGES.BACK_TO_STUDENTS}
      onErrorAction={handleErrorAction}
      loadingMessage={STUDENT_MESSAGES.LOADING_DETAILS}
    >
      {defaultValues && (
        <>
          {/* Said once, up front, rather than only when Save is pressed —
              filling in a form you were never allowed to submit is the worst
              way to find out. */}
          {!canEditThisStudent && (
            <div
              role="status"
              className="mb-4 flex items-start gap-2 rounded-lg border px-3 py-2.5"
              style={{ borderColor: 'var(--border)' }}
            >
              <Lock className="mt-0.5 size-4 shrink-0" style={{ color: 'var(--heading)' }} />
              <p className="text-caption text-muted-foreground">
                This student is not in one of your assigned classes, so you can read their
                record but not change it.
              </p>
            </div>
          )}

          <StudentForm
            defaultValues={defaultValues}
            onSubmit={onSubmit}
            onHandlersReady={handleHandlersReady}
          />

          {canEditThisStudent && (
            <StudentFormActions
              onCancel={handleCancel}
              onSave={handleSaveClick}
              saveLabel={STUDENT_LABELS.SAVE_CHANGES}
              cancelLabel={STUDENT_LABELS.CANCEL}
            />
          )}
        </>
      )}
    </DetailPageLayout>
  )
}
