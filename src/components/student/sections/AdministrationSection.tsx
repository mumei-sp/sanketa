import * as React from 'react'
import { Controller, type Control } from 'react-hook-form'
import { FormSection } from '@/components/form/FormSection'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import type { StudentFormValues } from '@/forms/student/student.schema'

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
  const fieldId = React.useId()

  return (
    <FormSection
      title="Administration"
      description="Administrative details for the student"
      width={width}
      className="self-start"
    >
      {/* Admission Number - Auto-generated, disabled */}
      <Controller
        name="administration.admissionNumber"
        control={control}
        render={({ field }) => {
          const admissionNumberFieldId = `${fieldId}-admissionNumber`
          return (
            <div className="space-y-2">
              <Label htmlFor={admissionNumberFieldId} className="opacity-60">
                Admission Number
              </Label>
              <Input
                id={admissionNumberFieldId}
                type="text"
                value={field.value != null ? field.value : ''}
                disabled={true}
                readOnly
              />
              <p className="text-sm text-muted-foreground">Auto-Generated</p>
            </div>
          )
        }}
      />
    </FormSection>
  )
}
