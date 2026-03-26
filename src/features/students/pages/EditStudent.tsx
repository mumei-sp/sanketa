import * as React from 'react'
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

export default function EditStudent() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { student, isLoading, error } = useStudentById(id)
  const { handleHandlersReady, handleSaveClick } = useStudentFormHandlers()
  const { showSuccess, showError } = useAppToast()

  const onSubmit = React.useCallback(
    async (data: StudentFormValues) => {
      if (!id) return
      try {
        const studentData = formToStudent(data)
        await updateStudent(id, studentData)
        showSuccess('Student updated', { description: `${data.firstName} ${data.lastName}'s details have been saved.` })
        navigate(`/students/details/${id}`)
      } catch {
        showError('Failed to update student', { description: 'Please try again.' })
      }
    },
    [navigate, id, showSuccess, showError],
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
          <StudentForm
            defaultValues={defaultValues}
            onSubmit={onSubmit}
            onHandlersReady={handleHandlersReady}
          />

          <StudentFormActions
            onCancel={handleCancel}
            onSave={handleSaveClick}
            saveLabel={STUDENT_LABELS.SAVE_CHANGES}
            cancelLabel={STUDENT_LABELS.CANCEL}
          />
        </>
      )}
    </DetailPageLayout>
  )
}
