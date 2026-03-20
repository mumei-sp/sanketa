import { type Control } from 'react-hook-form'
import { FormSection } from '@/components/form/FormSection'
import { TextareaField, SwitchField } from '@/components/form/fields'
import type { TeacherFormValues } from '../../schemas/teacher-schema'

export interface AdditionalInfoSectionProps {
  control: Control<TeacherFormValues>
  width?: number
}

export function AdditionalInfoSection({ control, width }: AdditionalInfoSectionProps) {
  return (
    <FormSection
      title="Additional Information"
      description="Bio and other details"
      width={width}
    >
      <TextareaField
        name="additionalInfo.bio"
        control={control}
        label="Bio"
        placeholder="Brief professional bio"
        rows={4}
      />
      <SwitchField
        name="additionalInfo.specialNeedsTraining"
        control={control}
        label="Special Needs Training"
        switchClassName="h-7 w-14"
      />
      <TextareaField
        name="additionalInfo.medicalInfo"
        control={control}
        label="Medical Information"
        placeholder="Any medical conditions to note"
        rows={3}
      />
    </FormSection>
  )
}
