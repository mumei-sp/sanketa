import * as React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { TeacherForm } from '../components/TeacherForm'
import type { TeacherFormValues } from '../schemas/teacher-schema'
import { teacherToForm } from '../utils/transform'
import { useTeacherById } from '../hooks/use-teacher-by-id'
import { DetailPageLayout } from '@/components/ui/detail-page-layout'
import { TeacherFormActions } from '../components/TeacherFormActions'
import { getTeacherBreadcrumbs } from '../utils/breadcrumbs'
import { useTeacherFormHandlers } from '../hooks/use-teacher-form-handlers'
import { updateTeacher } from '@/api/services/teacher-service'
import { formToTeacher } from '../utils/transform'
import { TEACHER_MESSAGES, TEACHER_LABELS } from '../constants'

export default function EditTeacher() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { teacher, isLoading, error } = useTeacherById(id)
  const { handleHandlersReady, handleSaveClick } = useTeacherFormHandlers()

  const onSubmit = React.useCallback(
    async (data: TeacherFormValues) => {
      if (!id) return
      const teacherData = formToTeacher(data)
      await updateTeacher(id, teacherData)
      navigate(`/teachers/details/${id}`)
    },
    [navigate, id],
  )

  const handleCancel = React.useCallback(() => {
    if (id) {
      navigate(`/teachers/details/${id}`)
    } else {
      navigate(-1)
    }
  }, [navigate, id])

  const handleErrorAction = React.useCallback(() => {
    navigate('/teachers')
  }, [navigate])

  const breadcrumbs = React.useMemo(() => getTeacherBreadcrumbs('edit'), [])
  const defaultValues = teacher ? teacherToForm(teacher) : undefined

  return (
    <DetailPageLayout
      title="Edit Teacher"
      breadcrumbs={breadcrumbs}
      showBackButton
      isLoading={isLoading}
      error={error || (!teacher && !isLoading ? TEACHER_MESSAGES.NOT_FOUND : null)}
      errorActionLabel={TEACHER_MESSAGES.BACK_TO_TEACHERS}
      onErrorAction={handleErrorAction}
      loadingMessage={TEACHER_MESSAGES.LOADING_DETAILS}
    >
      {defaultValues && (
        <>
          <TeacherForm
            defaultValues={defaultValues}
            onSubmit={onSubmit}
            onHandlersReady={handleHandlersReady}
          />

          <TeacherFormActions
            onCancel={handleCancel}
            onSave={handleSaveClick}
            saveLabel={TEACHER_LABELS.SAVE_CHANGES}
            cancelLabel={TEACHER_LABELS.CANCEL}
          />
        </>
      )}
    </DetailPageLayout>
  )
}
