import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '@/components/layout/PageHeader'
import { StudentForm } from '@/components/student/StudentForm'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { StudentFormValues } from '@/forms/student/student.schema'

export default function AddStudent() {
  const navigate = useNavigate()
  const [formHandlers, setFormHandlers] = React.useState<{
    handleSubmit: (callback: (data: StudentFormValues) => void | Promise<void>) => () => void
    handleFormSubmit: () => void
  } | null>(null)

  const onSubmit = React.useCallback(async (data: StudentFormValues) => {
    console.log('Form submitted:', data)
    console.log('Form data (JSON):', JSON.stringify(data, null, 2))
    // TODO: Implement save and add student logic
    // After successful save, navigate or show a success message
  }, [])

  const handleCancel = React.useCallback(() => {
    navigate(-1)
  }, [navigate])

  const handleSaveAndAddClick = React.useCallback(() => {
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add New Student"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Students', href: '/students' },
          { label: 'Add New Student' },
        ]}
        showBackButton
      />
      <StudentForm onSubmit={onSubmit} onHandlersReady={handleHandlersReady} />

      <Separator />

      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
        <Button type="button" onClick={handleSaveAndAddClick}>
          Save & Add Student
        </Button>
      </div>
    </div>
  )
}
