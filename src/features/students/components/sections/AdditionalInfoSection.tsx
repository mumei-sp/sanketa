import { type Control, useWatch } from 'react-hook-form'
import { FormSection } from '@/components/form/FormSection'
import { TextField, TextareaField, SwitchField } from '@/components/form/fields'
import type { StudentFormValues } from '../../schemas/student-schema'

/**
 * Props for AdditionalInfoSection component
 */
export interface AdditionalInfoSectionProps {
  /** Control object from React Hook Form */
  control: Control<StudentFormValues>
  /** Grid column span (for use in TileWrapper grid) */
  width?: number
}

/**
 * AdditionalInfoSection - Form section for additional information.
 * Displays fields for hobbies, special needs support, and medical condition alert.
 */
export function AdditionalInfoSection({ control, width }: AdditionalInfoSectionProps) {
  const medicalConditionAlert = useWatch({
    control,
    name: 'additionalInfo.medicalConditionAlert',
  })

  return (
    <FormSection
      title="Additional Information"
      description="Additional details about the student"
      width={width}
    >
      <TextField
        name="additionalInfo.hobbies"
        control={control}
        label="Hobbies / Interests"
        placeholder="Enter hobbies and interests"
        className="w-full"
      />
      <SwitchField
        name="additionalInfo.specialNeedsSupport"
        control={control}
        label="Special Needs Support"
        switchClassName="h-7 w-14"
      />
      <div className="space-y-2">
        <SwitchField
          name="additionalInfo.medicalConditionAlert"
          control={control}
          label="Medical Condition Alert"
          switchClassName="h-7 w-14"
        />
        {medicalConditionAlert && (
          <TextareaField
            name="additionalInfo.medicalInfo"
            control={control}
            placeholder="Enter medical condition details"
            rows={10}
            className="w-full"
            textareaClassName="min-h-48 max-h-96 overflow-y-auto resize-none"
          />
        )}
      </div>
    </FormSection>
  )
}
