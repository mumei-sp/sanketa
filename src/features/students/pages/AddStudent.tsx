import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { StudentForm } from '../components/StudentForm'
import type { StudentFormValues } from '../schemas/student-schema'
import { DetailPageLayout } from '@/components/ui/detail-page-layout'
import { StudentFormActions } from '../components/StudentFormActions'
import { getStudentBreadcrumbs } from '../utils/breadcrumbs'
import { useStudentFormHandlers } from '../hooks/use-student-form-handlers'
import { createStudent } from '@/api/services/student-service'
import { formToStudent } from '../utils/transform'
import { STUDENT_LABELS } from '../constants'

export default function AddStudent() {
  const navigate = useNavigate()
  const { handleHandlersReady, handleSaveClick } = useStudentFormHandlers()

  const onSubmit = React.useCallback(async (data: StudentFormValues) => {
    const studentData = formToStudent(data)
    const created = await createStudent(studentData)
    navigate(`/students/details/${created.id}`)
  }, [navigate])

  const handleCancel = React.useCallback(() => {
    navigate(-1)
  }, [navigate])

  const breadcrumbs = React.useMemo(() => getStudentBreadcrumbs('add'), [])

  return (
    <DetailPageLayout
      title="Add New Student"
      breadcrumbs={breadcrumbs}
      showBackButton
    >
      <StudentForm onSubmit={onSubmit} onHandlersReady={handleHandlersReady} />

      <StudentFormActions
        onCancel={handleCancel}
        onSave={handleSaveClick}
        saveLabel={STUDENT_LABELS.SAVE_AND_ADD}
        cancelLabel={STUDENT_LABELS.CANCEL}
      />
    </DetailPageLayout>
  )
}
