import * as React from 'react'
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form'
import { UploadDropzone } from '@/components/inputs/UploadDropzone'
import { Label } from '@/components/ui/label'

/**
 * Props for ProfilePhotoUploadField component
 */
export interface ProfilePhotoUploadFieldProps<T extends FieldValues> {
  /** Control object from React Hook Form */
  control: Control<T>
  /** Field name path for profile picture URL (e.g., "contactInfo.profilePictureUrl") */
  name: FieldPath<T>
  /** Label text displayed above the upload zone */
  label?: string
  /** Upload zone label text */
  uploadLabel?: string
  /** Upload zone description text */
  description?: string
  /** Maximum file size in bytes */
  maxSize?: number
  /** Accepted file types */
  accept?: Record<string, string[]>
  /** Height class for the upload zone */
  height?: string
  /** Additional className for the wrapper */
  className?: string
}

/**
 * ProfilePhotoUploadField - A reusable profile photo upload component
 * integrated with React Hook Form.
 */
export function ProfilePhotoUploadField<T extends FieldValues>({
  control,
  name,
  label,
  uploadLabel = 'Upload a photo',
  description = 'Upload a recent passport-size photo (Max: 2MB, JPG/PNG)',
  maxSize = 2 * 1024 * 1024,
  accept = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
  },
  height = 'h-36',
  className,
}: ProfilePhotoUploadFieldProps<T>) {
  const fieldId = React.useId()
  const [profilePhotoFile, setProfilePhotoFile] = React.useState<File | null>(null)

  return (
    <div className={className}>
      <Controller
        name={name}
        control={control}
        render={({ field }) => {
          const profilePhotoFieldId = `${fieldId}-profilePhoto`
          return (
            <div className="space-y-2">
              {label && <Label htmlFor={profilePhotoFieldId}>{label}</Label>}
              <UploadDropzone
                label={uploadLabel}
                description={description}
                accept={accept}
                maxSize={maxSize}
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
                height={height}
              />
            </div>
          )
        }}
      />
    </div>
  )
}
