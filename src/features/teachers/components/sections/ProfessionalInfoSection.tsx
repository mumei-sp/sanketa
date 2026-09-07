import * as React from 'react'
import { type Control } from 'react-hook-form'
import { FormSection } from '@/components/form/FormSection'
import { TextField, SelectField, type SelectOption, FORM_GRID_2 } from '@/components/form/fields'
import { useSchoolConfig } from '@/config/SchoolConfigContext'
import { getClassLabels } from '@/utils/class-section-helpers'
import type { TeacherFormValues } from '../../schemas/teacher-schema'
import { cn } from '@/lib/utils'

export interface ProfessionalInfoSectionProps {
  control: Control<TeacherFormValues>
  width?: number
}

export function ProfessionalInfoSection({ control, width }: ProfessionalInfoSectionProps) {
  const { config } = useSchoolConfig()
  const subjectOptions: SelectOption[] = React.useMemo(
    () => config.subjects.map(s => ({ value: s.name, label: s.name })),
    [config.subjects],
  )
  const classLabels = React.useMemo(
    () => getClassLabels(config.classSections),
    [config.classSections],
  )
  const classPlaceholder = React.useMemo(() => {
    const examples = classLabels.slice(0, 3).map(l => `Grade ${l}`)
    return `e.g., ${examples.join(', ')}`
  }, [classLabels])
  return (
    <FormSection
      title="Professional Information"
      description="Teaching qualifications and assignments"
      width={width}
      className="self-start"
    >
      <SelectField
        name="professionalInfo.subject"
        control={control}
        label="Primary Subject"
        placeholder="Select subject"
        options={subjectOptions}
      />
      <div className={cn('grid gap-4', FORM_GRID_2)}>
        <TextField
          name="professionalInfo.qualification"
          control={control}
          label="Qualification"
          placeholder="e.g., M.Sc, B.Ed"
        />
        <TextField
          name="professionalInfo.specialization"
          control={control}
          label="Specialization"
          placeholder="e.g., Applied Mathematics"
        />
      </div>
      <TextField
        name="professionalInfo.classAssignments"
        control={control}
        label="Class Assignments"
        placeholder={classPlaceholder}
      />
    </FormSection>
  )
}
