import * as React from 'react'
import type { StudentFormValues } from '../schemas/student-schema'

export interface FormHandlers {
  handleSubmit: (callback: (data: StudentFormValues) => void | Promise<void>) => () => void
  handleFormSubmit: () => void
}

/**
 * Custom hook to manage student form handlers state
 * Eliminates duplication between AddStudent and EditStudent pages
 * 
 * @returns Form handlers state and callbacks
 */
export function useStudentFormHandlers() {
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

