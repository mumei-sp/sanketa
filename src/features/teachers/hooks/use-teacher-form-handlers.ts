import * as React from 'react'
import type { TeacherFormValues } from '../schemas/teacher-schema'

export interface FormHandlers {
  handleSubmit: (callback: (data: TeacherFormValues) => void | Promise<void>) => () => void
  handleFormSubmit: () => void
}

export function useTeacherFormHandlers() {
  const [formHandlers, setFormHandlers] = React.useState<FormHandlers | null>(null)

  const handleHandlersReady = React.useCallback((handlers: FormHandlers) => {
    setFormHandlers(handlers)
  }, [])

  const handleSaveClick = React.useCallback(() => {
    if (formHandlers) {
      formHandlers.handleFormSubmit()
    } else {
      console.warn('Form handlers not ready yet')
    }
  }, [formHandlers])

  return {
    formHandlers,
    handleHandlersReady,
    handleSaveClick,
  }
}
