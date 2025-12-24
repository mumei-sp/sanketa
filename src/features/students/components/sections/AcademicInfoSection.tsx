import { type Control } from 'react-hook-form'
import { FormSection } from '@/components/form/FormSection'
import {
  SelectField,
  DateField,
  TextField,
  type SelectOption,
  GRID_COLS_2,
} from '@/components/form/fields'
import type { StudentFormValues } from '../../schemas/student.schema'

/**
 * Props for AcademicInfoSection component
 */
export interface AcademicInfoSectionProps {
  /** Control object from React Hook Form */
  control: Control<StudentFormValues>
  /** Grid column span (for use in TileWrapper grid) */
  width?: number
}

/**
 * Grade level options
 */
const gradeOptions: SelectOption[] = [
  { value: '1', label: 'Grade 1' },
  { value: '2', label: 'Grade 2' },
  { value: '3', label: 'Grade 3' },
  { value: '4', label: 'Grade 4' },
  { value: '5', label: 'Grade 5' },
  { value: '6', label: 'Grade 6' },
  { value: '7', label: 'Grade 7' },
  { value: '8', label: 'Grade 8' },
  { value: '9', label: 'Grade 9' },
  { value: '10', label: 'Grade 10' },
  { value: '11', label: 'Grade 11' },
  { value: '12', label: 'Grade 12' },
]

/**
 * Section options
 */
const sectionOptions: SelectOption[] = [
  { value: 'A', label: 'Section A' },
  { value: 'B', label: 'Section B' },
  { value: 'C', label: 'Section C' },
  { value: 'D', label: 'Section D' },
]

/**
 * AcademicInfoSection - Form section for academic information.
 * Displays fields for grade, section, enrollment date, and previous school.
 */
export function AcademicInfoSection({ control, width }: AcademicInfoSectionProps) {
  return (
    <FormSection
      title="Academic Information"
      description="Academic details for the student"
      width={width}
      className="self-start"
    >
      <div className="grid gap-4" style={{ gridTemplateColumns: GRID_COLS_2 }}>
        <SelectField
          name="academicInfo.gradeLevel"
          control={control}
          label="Grade"
          placeholder="Select grade level"
          options={gradeOptions}
        />
        <SelectField
          name="academicInfo.section"
          control={control}
          label="Section"
          placeholder="Select section"
          options={sectionOptions}
        />
      </div>
      <DateField name="academicInfo.enrollmentDate" control={control} label="Enrollment Date" />
      <TextField
        name="academicInfo.previousSchool"
        control={control}
        label="Previous School"
        placeholder="e.g., Greenfield Junior High"
      />
    </FormSection>
  )
}
