import * as React from 'react'
import { TileWrapper } from '@/components/tile'
import { useStudentForm } from '../hooks/use-student-form'
import { PersonalInfoSection } from './sections/PersonalInfoSection'
import { AdministrationSection } from './sections/AdministrationSection'
import { AcademicInfoSection } from './sections/AcademicInfoSection'
import { ContactInfoSection } from './sections/ContactInfoSection'
import { GuardianInfoSection } from './sections/GuardianInfoSection'
import { AdditionalInfoSection } from './sections/AdditionalInfoSection'
import { cn } from '@/lib/utils'
import type { StudentFormValues } from '../schemas/student-schema'

/**
 * Props for StudentForm component
 */
export interface StudentFormProps {
  /** Optional default values for form initialization */
  defaultValues?: Parameters<typeof useStudentForm>[0]
  /** Additional className */
  className?: string
  /** Callback when form is submitted */
  onSubmit?: (data: StudentFormValues) => void | Promise<void>
  /** Callback to receive form handlers for external use (e.g., buttons outside form) */
  onHandlersReady?: (handlers: {
    handleSubmit: (callback: (data: StudentFormValues) => void | Promise<void>) => () => void
    handleFormSubmit: () => void
  }) => void
}

/**
 * StudentForm - Root form component for student data entry.
 * Composes all form sections into 2 main sections as per design.
 * Uses TileWrapper for grid layout and Tile components for section cards.
 */
export function StudentForm({
  defaultValues,
  className,
  onSubmit,
  onHandlersReady,
}: StudentFormProps) {
  const { control, handleSubmit } = useStudentForm(defaultValues)

  // Full width for all sections within each main section
  const sectionWidth = 12

  const handleFormSubmit = React.useMemo(
    () =>
      handleSubmit(
        data => {
          console.log('Form validation passed, calling onSubmit with:', data)
          onSubmit?.(data)
        },
        errors => {
          console.log('Form validation failed with errors:', errors)
        },
      ),
    [handleSubmit, onSubmit],
  )

  // Use ref to store the callback to avoid it being in dependency array
  const onHandlersReadyRef = React.useRef(onHandlersReady)
  React.useEffect(() => {
    onHandlersReadyRef.current = onHandlersReady
  }, [onHandlersReady])

  // Use ref to track previous handlers to prevent unnecessary updates
  const prevHandlersRef = React.useRef<{
    handleSubmit: typeof handleSubmit
    handleFormSubmit: typeof handleFormSubmit
  } | null>(null)

  // Expose handlers to parent component - only call when handlers actually change
  React.useEffect(() => {
    const currentHandlers = {
      handleSubmit,
      handleFormSubmit,
    }

    // Only update if handlers have actually changed
    if (
      !prevHandlersRef.current ||
      prevHandlersRef.current.handleFormSubmit !== handleFormSubmit ||
      prevHandlersRef.current.handleSubmit !== handleSubmit
    ) {
      prevHandlersRef.current = currentHandlers
      onHandlersReadyRef.current?.(currentHandlers)
    }
  }, [handleSubmit, handleFormSubmit])

  return (
    <form className={cn('w-full', className)} onSubmit={handleFormSubmit}>
      {/* responsive: form sections stack on mobile instead of side-by-side; min-w-0 w-full avoids horizontal overflow. */}
      <TileWrapper columns={12} gap={16} mode="grid" responsive className="min-w-0 w-full">
        {/* Section 1: Left Column - Personal, Contact, Guardian Info (60%) */}
        <div className="col-span-12 lg:col-span-7 space-y-4">
          <PersonalInfoSection control={control} width={sectionWidth} />
          <ContactInfoSection control={control} width={sectionWidth} />
          <GuardianInfoSection control={control} width={sectionWidth} />
        </div>

        {/* Section 2: Right Column - Administration, Academic, Additional Info (40%) */}
        <div className="col-span-12 lg:col-span-5 space-y-4">
          <AdministrationSection control={control} width={sectionWidth} />
          <AcademicInfoSection control={control} width={sectionWidth} />
          <AdditionalInfoSection control={control} width={sectionWidth} />
        </div>
      </TileWrapper>
    </form>
  )
}
