import { type Control } from 'react-hook-form'
import { FormSection } from '@/components/form/FormSection'
import { TextField, SelectField, type SelectOption, GRID_COLS_2 } from '@/components/form/fields'
import type { TeacherFormValues } from '../../schemas/teacher-schema'

export interface ProfessionalInfoSectionProps {
  control: Control<TeacherFormValues>
  width?: number
}

const subjectOptions: SelectOption[] = [
  { value: 'Mathematics', label: 'Mathematics' },
  { value: 'English Language', label: 'English Language' },
  { value: 'Physics', label: 'Physics' },
  { value: 'Chemistry', label: 'Chemistry' },
  { value: 'Biology', label: 'Biology' },
  { value: 'History', label: 'History' },
  { value: 'Geography', label: 'Geography' },
  { value: 'Computer Science', label: 'Computer Science' },
  { value: 'Physical Education', label: 'Physical Education' },
  { value: 'Art & Design', label: 'Art & Design' },
  { value: 'Music', label: 'Music' },
  { value: 'Hindi', label: 'Hindi' },
  { value: 'Sanskrit', label: 'Sanskrit' },
  { value: 'General Science', label: 'General Science' },
]

export function ProfessionalInfoSection({ control, width }: ProfessionalInfoSectionProps) {
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
      <div className="grid gap-4" style={{ gridTemplateColumns: GRID_COLS_2 }}>
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
        placeholder="e.g., Grade 7A, Grade 8B, Grade 9A"
      />
    </FormSection>
  )
}
