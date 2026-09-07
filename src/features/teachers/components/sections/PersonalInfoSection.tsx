import { type Control } from 'react-hook-form'
import { FormSection } from '@/components/form/FormSection'
import { cn } from '@/lib/utils'
import {
  TextField,
  DateField,
  ProfilePhotoUploadField,
  SegmentedRadioField,
  FORM_GRID_3,
  FORM_GRID_3_SPAN_2,
} from '@/components/form/fields'
import type { TeacherFormValues } from '../../schemas/teacher-schema'

export interface PersonalInfoSectionProps {
  control: Control<TeacherFormValues>
  width?: number
}

const genderOptions = [
  { value: '0', label: 'Male' },
  { value: '1', label: 'Female' },
]

export function PersonalInfoSection({ control, width }: PersonalInfoSectionProps) {
  return (
    <FormSection
      title="Personal Information"
      description="Enter the teacher's personal details"
      width={width}
    >
      {/* Teacher ID, First Name and Last Name */}
      <div className={cn('grid gap-4', FORM_GRID_3)}>
        <TextField
          name="employmentInfo.teacherId"
          control={control}
          label="Teacher ID"
          placeholder="e.g., T-1001"
        />
        <TextField
          name="personalInfo.firstName"
          control={control}
          label="First Name"
          placeholder="Enter first name"
        />
        <TextField
          name="personalInfo.lastName"
          control={control}
          label="Last Name"
          placeholder="Enter last name"
        />
      </div>

      {/* Full Name and Date of Birth */}
      <div className={cn('grid gap-4', FORM_GRID_3)}>
        <div className={FORM_GRID_3_SPAN_2}>
          <TextField
            name="personalInfo.preferredName"
            control={control}
            label="Full Name"
            placeholder="Enter full name"
          />
        </div>
        <DateField name="personalInfo.dateOfBirth" control={control} label="Date of Birth" />
      </div>

      {/* Gender */}
      <SegmentedRadioField
        name="personalInfo.gender"
        control={control}
        label="Gender"
        options={genderOptions}
        columns={2}
        radioClassName="w-full max-w-full"
        selectedBackdropColor="bg-blue-50"
        selectedBorderColor="border-blue-500"
        unselectedBorderColor="border-gray-200"
        radioColor="text-blue-500"
        padding="p-4"
        gap="gap-2"
      />

      {/* Profile Photo */}
      <ProfilePhotoUploadField
        control={control}
        name="contactInfo.profilePictureUrl"
        label="Profile Photo"
      />
    </FormSection>
  )
}
