import { type Control } from 'react-hook-form'
import { FormSection } from '@/components/form/FormSection'
import { TextField, PhoneNumberFieldWithCountryCode, FORM_GRID_2 } from '@/components/form/fields'
import type { StudentFormValues } from '../../schemas/student-schema'
import { cn } from '@/lib/utils'

/**
 * Props for ContactInfoSection component
 */
export interface ContactInfoSectionProps {
  /** Control object from React Hook Form */
  control: Control<StudentFormValues>
  /** Grid column span (for use in TileWrapper grid) */
  width?: number
}

/**
 * ContactInfoSection - Form section for contact information.
 * Displays fields for email address, phone number with country code, and address.
 */
export function ContactInfoSection({ control, width }: ContactInfoSectionProps) {
  return (
    <FormSection
      title="Contact Information"
      description="Contact details for the student"
      width={width}
    >
      {/* Email Address and Phone Number - Side by Side */}
      <div className={cn('grid gap-4', FORM_GRID_2)}>
        {/* Email Address */}
        <TextField
          name="contactInfo.email"
          control={control}
          label="Email Address"
          type="email"
          placeholder="Enter email address"
        />

        {/* Phone Number with Country Code */}
        <PhoneNumberFieldWithCountryCode
          control={control}
          countryCodeName="contactInfo.phoneCountryCode"
          phoneName="contactInfo.primaryPhone"
          label="Phone Number"
          placeholder="9876543210"
        />
      </div>

      {/* Address */}
      <TextField
        name="contactInfo.address"
        control={control}
        label="Address"
        placeholder="Street, City, State, ZIP"
      />
    </FormSection>
  )
}
