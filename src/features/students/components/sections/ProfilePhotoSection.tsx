import { type Control } from 'react-hook-form'
import { FormSection } from '@/components/form/FormSection'
import { ProfilePhotoUploadField } from '@/components/form/fields'
import type { StudentFormValues } from '../../schemas/student.schema'

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
  return (
    <FormSection
      title="Profile Photo"
      description="Upload a recent passport-size photo"
      width={width}
    >
      <ProfilePhotoUploadField
        control={control}
        name="contactInfo.profilePictureUrl"
        height="h-40"
      />
    </FormSection>
  )
}
