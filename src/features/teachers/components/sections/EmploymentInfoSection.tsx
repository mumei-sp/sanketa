import * as React from 'react'
import { type Control } from 'react-hook-form'
import { FormSection } from '@/components/form/FormSection'
import { SelectField, DateField, type SelectOption, GRID_COLS_2 } from '@/components/form/fields'
import { useSchoolConfig } from '@/config/SchoolConfigContext'
import type { TeacherFormValues } from '../../schemas/teacher-schema'

export interface EmploymentInfoSectionProps {
  control: Control<TeacherFormValues>
  width?: number
}

const employmentTypeOptions: SelectOption[] = [
  { value: 'Full-Time', label: 'Full-Time' },
  { value: 'Part-Time', label: 'Part-Time' },
  { value: 'Substitute', label: 'Substitute' },
]

export function EmploymentInfoSection({ control, width }: EmploymentInfoSectionProps) {
  const { config } = useSchoolConfig()
  const departmentOptions: SelectOption[] = React.useMemo(
    () => config.subjects.map(s => ({ value: s.name, label: s.name })),
    [config.subjects],
  )
  return (
    <FormSection
      title="Employment Details"
      description="Employment and department information"
      width={width}
      className="self-start"
    >
      <div className="grid gap-4" style={{ gridTemplateColumns: GRID_COLS_2 }}>
        <SelectField
          name="employmentInfo.employmentType"
          control={control}
          label="Employment Type"
          placeholder="Select type"
          options={employmentTypeOptions}
        />
        <SelectField
          name="employmentInfo.department"
          control={control}
          label="Department"
          placeholder="Select department"
          options={departmentOptions}
        />
      </div>
      <DateField name="employmentInfo.joiningDate" control={control} label="Joining Date" />
    </FormSection>
  )
}
