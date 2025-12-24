import { type Control } from 'react-hook-form'
import { FormSection } from '@/components/form/FormSection'
import { TextField } from '@/components/form/fields'
import type { StudentFormValues } from '../../schemas/student.schema'

/**
 * Props for AdministrationSection component
 */
export interface AdministrationSectionProps {
  /** Control object from React Hook Form */
  control: Control<StudentFormValues>
  /** Grid column span (for use in TileWrapper grid) */
  width?: number
}

/**
 * AdministrationSection - Form section for administration information.
 * Displays field for admission number (auto-generated).
 */
export function AdministrationSection({ control, width }: AdministrationSectionProps) {
  return (
    <FormSection
      title="Administration"
      description="Administrative details for the student"
      width={width}
      className="self-start"
    >
      {/* Admission Number - Auto-generated, disabled */}
      <TextField
        name="administration.admissionNumber"
        control={control}
        label="Admission Number"
        disabled={true}
        description="Auto-Generated"
      />
    </FormSection>
  )
}
