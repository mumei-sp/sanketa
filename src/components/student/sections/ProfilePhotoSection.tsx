import * as React from 'react'
import { Controller, type Control } from 'react-hook-form'
import { FormSection } from '@/components/form/FormSection'
import { UploadDropzone } from '@/components/inputs/UploadDropzone'
import type { StudentFormValues } from '@/forms/student/student.schema'

/**
 * Props for ProfilePhotoSection component
 */
export interface ProfilePhotoSectionProps {
  /** Control object from React Hook Form */
  control: Control<StudentFormValues>
  /** Grid column span (for use in TileWrapper grid) */
  width?: number
}

/**
 * ProfilePhotoSection - Form section for profile photo upload.
 * Displays upload dropzone for student profile picture.
 */
export function ProfilePhotoSection({ control, width }: ProfilePhotoSectionProps) {
  const [profilePhotoFile, setProfilePhotoFile] = React.useState<File | null>(null)

  return (
    <FormSection
      title="Profile Photo"
      description="Upload a recent passport-size photo"
      width={width}
    >
      <div className="space-y-2">
        <Controller
          name="contactInfo.profilePictureUrl"
          control={control}
          render={({ field }) => (
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
                // In a real app, you'd upload and get the URL
                field.onChange(acceptedFile.name)
              }}
              onFileRemove={() => {
                setProfilePhotoFile(null)
                field.onChange('')
              }}
              height="h-32"
            />
          )}
        />
      </div>
    </FormSection>
  )
}
