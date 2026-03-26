import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { TeacherForm } from '../components/TeacherForm'
import type { TeacherFormValues } from '../schemas/teacher-schema'
import { DetailPageLayout } from '@/components/ui/detail-page-layout'
import { TeacherFormActions } from '../components/TeacherFormActions'
import { getTeacherBreadcrumbs } from '../utils/breadcrumbs'
import { useTeacherFormHandlers } from '../hooks/use-teacher-form-handlers'
import { createTeacher } from '@/api/services/teacher-service'
import { formToTeacher } from '../utils/transform'
import { TEACHER_LABELS } from '../constants'

export default function AddTeacher() {
  const navigate = useNavigate()
  const { handleHandlersReady, handleSaveClick } = useTeacherFormHandlers()

  const onSubmit = React.useCallback(async (data: TeacherFormValues) => {
    const teacherData = formToTeacher(data)
    const created = await createTeacher(teacherData)
    navigate(`/teachers/details/${created.id}`)
  }, [navigate])

  const handleCancel = React.useCallback(() => {
    navigate(-1)
  }, [navigate])

  const breadcrumbs = React.useMemo(() => getTeacherBreadcrumbs('add'), [])

  return (
    <DetailPageLayout
      title="Add New Teacher"
      breadcrumbs={breadcrumbs}
      showBackButton
    >
      <TeacherForm onSubmit={onSubmit} onHandlersReady={handleHandlersReady} />

      <TeacherFormActions
        onCancel={handleCancel}
        onSave={handleSaveClick}
        saveLabel={TEACHER_LABELS.SAVE_AND_ADD}
        cancelLabel={TEACHER_LABELS.CANCEL}
      />
    </DetailPageLayout>
  )
}
