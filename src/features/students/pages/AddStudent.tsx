import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { StudentForm } from '../components/StudentForm'
import type { StudentFormValues } from '../schemas/student-schema'
import { StudentPageLayout } from '../components/StudentPageLayout'
import { StudentFormActions } from '../components/StudentFormActions'
import { getStudentBreadcrumbs } from '../utils/breadcrumbs'
import { useStudentFormHandlers } from '../hooks/use-student-form-handlers'
import { STUDENT_LABELS } from '../constants'

export default function AddStudent() {
  const navigate = useNavigate()
  const { handleHandlersReady, handleSaveClick } = useStudentFormHandlers()

  const onSubmit = React.useCallback(async (data: StudentFormValues) => {
    console.log('Form submitted:', data)
    console.log('Form data (JSON):', JSON.stringify(data, null, 2))
    // TODO: Implement save and add student logic
    // After successful save, navigate or show a success message
  }, [])

  const handleCancel = React.useCallback(() => {
    navigate(-1)
  }, [navigate])

  const breadcrumbs = React.useMemo(() => getStudentBreadcrumbs('add'), [])

  return (
    <StudentPageLayout
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
    </StudentPageLayout>
  )
}
