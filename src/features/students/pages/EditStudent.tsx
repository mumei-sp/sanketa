import * as React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PageHeader from '@/components/layout/PageHeader'
import { StudentForm } from '../components/StudentForm'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { StudentFormValues } from '../schemas/student-schema'
import { studentToForm } from '../utils/transform'
import { useStudentById } from '../hooks/use-student-by-id'

export default function EditStudent() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [formHandlers, setFormHandlers] = React.useState<{
    handleSubmit: (callback: (data: StudentFormValues) => void | Promise<void>) => () => void
    handleFormSubmit: () => void
  } | null>(null)
  const { student, isLoading, error } = useStudentById(id)

  const onSubmit = React.useCallback(
    async (data: StudentFormValues) => {
      console.log('Form submitted:', data)
      console.log('Form data (JSON):', JSON.stringify(data, null, 2))
      // TODO: Implement update student logic
      // After successful update, navigate back to student details or show a success message
      if (id) {
        navigate(`/students/details/${id}`)
      }
    },
    [navigate, id],
  )

  const handleCancel = React.useCallback(() => {
    if (id) {
      navigate(`/students/details/${id}`)
    } else {
      navigate(-1)
    }
  }, [navigate, id])

  const handleSaveClick = React.useCallback(() => {
    console.log('Save button clicked, formHandlers:', formHandlers)
    if (formHandlers) {
      console.log('Calling handleFormSubmit')
      formHandlers.handleFormSubmit()
    } else {
      console.warn('Form handlers not ready yet')
    }
  }, [formHandlers])

  const handleHandlersReady = React.useCallback(
    (handlers: {
      handleSubmit: (callback: (data: StudentFormValues) => void | Promise<void>) => () => void
      handleFormSubmit: () => void
    }) => {
      setFormHandlers(handlers)
    },
    [],
  )

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Edit Student"
          breadcrumbs={[
            { label: 'Dashboard', href: '/' },
            { label: 'Students', href: '/students' },
            { label: 'Edit Student' },
          ]}
          showBackButton
        />
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading student details...</div>
        </div>
      </div>
    )
  }

  if (error || !student) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Edit Student"
          breadcrumbs={[
            { label: 'Dashboard', href: '/' },
            { label: 'Students', href: '/students' },
            { label: 'Edit Student' },
          ]}
          showBackButton
        />
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <p className="text-destructive">{error || 'Student not found'}</p>
            <Button onClick={() => navigate('/students')} variant="outline">
              Back to Students
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const defaultValues = studentToForm(student)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Student"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Students', href: '/students' },
          { label: 'Edit Student' },
        ]}
        showBackButton
      />
      <StudentForm
        defaultValues={defaultValues}
        onSubmit={onSubmit}
        onHandlersReady={handleHandlersReady}
      />

      <Separator />

      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
        <Button type="button" onClick={handleSaveClick}>
          Save Changes
        </Button>
      </div>
    </div>
  )
}
