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
import { useAppToast } from '@/hooks/use-app-toast'
import { usePermissions } from '@/features/auth/PermissionContext'
import { canWriteStudent, classSectionOf } from '@/utils/class-section-helpers'

export default function AddStudent() {
  const navigate = useNavigate()
  const { handleHandlersReady, handleSaveClick } = useStudentFormHandlers()
  const { showSuccess, showError } = useAppToast()
  const { can, role } = usePermissions()

  const onSubmit = React.useCallback(async (data: StudentFormValues) => {
    const studentData = formToStudent(data)

    // The scoped half of `students.create`, and the only place it can be
    // asked: which class a new student joins is a value on the form, so the
    // toolbar button that opened this page could only check "anywhere".
    const classSection = classSectionOf(studentData)
    // Through the helper so a form that named no class fails closed for a
    // scoped holder, rather than asking the unscoped "anywhere?" question and
    // being told yes.
    if (!canWriteStudent(studentData, scope => can('students.create', scope), role?.scopeBy === 'classes')) {
      showError('That class is not yours', {
        description: classSection
          ? `You can only enrol students into the classes assigned to you. ${classSection} is not one of them.`
          : 'Choose a grade and section you are assigned to.',
      })
      return
    }

    try {
      const created = await createStudent(studentData)
      showSuccess('Student added', { description: `${data.personalInfo.firstName} ${data.personalInfo.lastName} has been enrolled.` })
      navigate(`/students/details/${created.id}`)
    } catch {
      showError('Failed to add student', { description: 'Please try again.' })
    }
  }, [navigate, can, role, showSuccess, showError])

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
