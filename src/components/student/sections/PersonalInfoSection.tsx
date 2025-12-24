import * as React from 'react'
import { Controller, type Control } from 'react-hook-form'
import { FormSection } from '@/components/form/FormSection'
import { TextField } from '@/components/form/fields/TextField'
import { DateField } from '@/components/form/fields/DateField'
import { SegmentedRadio } from '@/components/inputs/SegmentedRadio'
import { UploadDropzone } from '@/components/inputs/UploadDropzone'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import type { StudentFormValues } from '@/forms/student/student.schema'

/**
 * Props for PersonalInfoSection component
 */
export interface PersonalInfoSectionProps {
  /** Control object from React Hook Form */
  control: Control<StudentFormValues>
  /** Grid column span (for use in TileWrapper grid) */
  width?: number
}

/**
 * Gender options for segmented radio
 */
const genderOptions = [
  { value: '0', label: 'Male' },
  { value: '1', label: 'Female' },
]

/**
 * PersonalInfoSection - Form section for personal information.
 * Displays fields for student ID, full name, date of birth, gender, and profile photo.
 */
export function PersonalInfoSection({ control, width }: PersonalInfoSectionProps) {
  const fieldId = React.useId()
  const [profilePhotoFile, setProfilePhotoFile] = React.useState<File | null>(null)

  return (
    <FormSection
      title="Personal Information"
      description="Enter the student's personal details"
      width={width}
    >
      {/* Student ID, First Name and Last Name - Side by Side (20% / 40% / 40%) */}
      <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 2fr 2fr' }}>
        {/* Student ID */}
        <Controller
          name="administration.studentId"
          control={control}
          render={({ field, fieldState }) => {
            const studentIdFieldId = `${fieldId}-studentId`
            return (
              <div className="space-y-2">
                <Label htmlFor={studentIdFieldId}>Student ID</Label>
                <Input
                  id={studentIdFieldId}
                  type="text"
                  value={field.value != null ? field.value : ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="Student ID"
                  aria-invalid={fieldState.error ? 'true' : 'false'}
                  className={
                    fieldState.error ? 'border-destructive focus-visible:ring-destructive' : ''
                  }
                />
                {fieldState.error && (
                  <p role="alert" className="text-destructive text-sm">
                    {fieldState.error.message}
                  </p>
                )}
              </div>
            )
          }}
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

      {/* Full Name and Date of Birth - Full Name matches Student ID + First Name width (3fr), Date of Birth matches Last Name width (2fr) */}
      <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 2fr 2fr' }}>
        <div className="col-span-2">
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
      <Controller
        name="personalInfo.gender"
        control={control}
        render={({ field, fieldState }) => {
          const genderFieldId = `${fieldId}-gender`
          return (
            <div className="space-y-2">
              <Label htmlFor={genderFieldId}>Gender</Label>
              <SegmentedRadio
                options={genderOptions}
                value={field.value != null ? field.value.toString() : ''}
                onValueChange={value => {
                  const numValue = Number(value)
                  field.onChange(isNaN(numValue) ? value : numValue)
                }}
                columns={2}
                className="w-full max-w-full"
                selectedBackdropColor="bg-blue-50"
                selectedBorderColor="border-blue-500"
                unselectedBorderColor="border-gray-200"
                radioColor="text-blue-500"
                padding="p-4"
                gap="gap-2"
              />
              {fieldState.error && (
                <p role="alert" className="text-destructive text-sm">
                  {fieldState.error.message}
                </p>
              )}
            </div>
          )
        }}
      />

      {/* Profile Photo */}
      <Controller
        name="contactInfo.profilePictureUrl"
        control={control}
        render={({ field }) => {
          const profilePhotoFieldId = `${fieldId}-profilePhoto`
          return (
            <div className="space-y-2">
              <Label htmlFor={profilePhotoFieldId}>Profile Photo</Label>
              <UploadDropzone
                label="Click or drag to upload"
                description="Upload a recent passport-size photo (Max: 2MB, JPG/PNG)"
                accept={{
                  'image/jpeg': ['.jpg', '.jpeg'],
                  'image/png': ['.png'],
                }}
                maxSize={2 * 1024 * 1024}
                showPreview={true}
                file={profilePhotoFile}
                onFileAccepted={acceptedFile => {
                  setProfilePhotoFile(acceptedFile)
                  // Store file name or convert to URL - for now just store the file
                  // In app, you'd upload and get the URL
                  field.onChange(acceptedFile.name)
                }}
                onFileRemove={() => {
                  setProfilePhotoFile(null)
                  field.onChange('')
                }}
                height="h-28"
              />
            </div>
          )
        }}
      />
    </FormSection>
  )
}
