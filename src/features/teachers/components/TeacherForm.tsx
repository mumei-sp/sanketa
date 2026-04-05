import * as React from 'react'
import { TileWrapper } from '@/components/tile'
import { useTeacherForm } from '../hooks/use-teacher-form'
import { PersonalInfoSection } from './sections/PersonalInfoSection'
import { EmploymentInfoSection } from './sections/EmploymentInfoSection'
import { ProfessionalInfoSection } from './sections/ProfessionalInfoSection'
import { ContactInfoSection } from './sections/ContactInfoSection'
import { AdditionalInfoSection } from './sections/AdditionalInfoSection'
import { cn } from '@/lib/utils'
import type { TeacherFormValues } from '../schemas/teacher-schema'

export interface TeacherFormProps {
  defaultValues?: Parameters<typeof useTeacherForm>[0]
  className?: string
  onSubmit?: (data: TeacherFormValues) => void | Promise<void>
  onHandlersReady?: (handlers: {
    handleSubmit: (callback: (data: TeacherFormValues) => void | Promise<void>) => () => void
    handleFormSubmit: () => void
  }) => void
}

export function TeacherForm({
  defaultValues,
  className,
  onSubmit,
  onHandlersReady,
}: TeacherFormProps) {
  const { control, handleSubmit } = useTeacherForm(defaultValues)

  const sectionWidth = 12

  const handleFormSubmit = React.useMemo(
    () =>
      handleSubmit(
        data => {
          onSubmit?.(data)
        },
      ),
    [handleSubmit, onSubmit],
  )

  const onHandlersReadyRef = React.useRef(onHandlersReady)
  React.useEffect(() => {
    onHandlersReadyRef.current = onHandlersReady
  }, [onHandlersReady])

  const prevHandlersRef = React.useRef<{
    handleSubmit: typeof handleSubmit
    handleFormSubmit: typeof handleFormSubmit
  } | null>(null)

  React.useEffect(() => {
    const currentHandlers = {
      handleSubmit,
      handleFormSubmit,
    }

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
      <TileWrapper columns={12} gap={16} mode="grid">
        {/* Left Column - Personal, Contact Info (60%) */}
        <div className="col-span-12 lg:col-span-7 space-y-4">
          <PersonalInfoSection control={control} width={sectionWidth} />
          <ContactInfoSection control={control} width={sectionWidth} />
        </div>

        {/* Right Column - Employment, Professional, Additional Info (40%) */}
        <div className="col-span-12 lg:col-span-5 space-y-4">
          <EmploymentInfoSection control={control} width={sectionWidth} />
          <ProfessionalInfoSection control={control} width={sectionWidth} />
          <AdditionalInfoSection control={control} width={sectionWidth} />
        </div>
      </TileWrapper>
    </form>
  )
}
