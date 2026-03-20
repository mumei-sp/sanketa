import { type Control } from 'react-hook-form'
import { FormSection } from '@/components/form/FormSection'
import { TextField, PhoneNumberFieldWithCountryCode, GRID_COLS_2, GRID_COLS_3 } from '@/components/form/fields'
import type { TeacherFormValues } from '../../schemas/teacher-schema'

export interface ContactInfoSectionProps {
  control: Control<TeacherFormValues>
  width?: number
}

export function ContactInfoSection({ control, width }: ContactInfoSectionProps) {
  return (
    <FormSection
      title="Contact Information"
      description="Contact details for the teacher"
      width={width}
    >
      {/* Email and Phone */}
      <div className="grid gap-4" style={{ gridTemplateColumns: GRID_COLS_2 }}>
        <TextField
          name="contactInfo.email"
          control={control}
          label="Email Address"
          type="email"
          placeholder="Enter email address"
        />
        <PhoneNumberFieldWithCountryCode
          control={control}
          countryCodeName="contactInfo.phoneCountryCode"
          phoneName="contactInfo.primaryPhone"
          label="Phone Number"
          placeholder="9876543210"
        />
      </div>

      {/* Secondary and Emergency Phone */}
      <div className="grid gap-4" style={{ gridTemplateColumns: GRID_COLS_2 }}>
        <TextField
          name="contactInfo.secondaryPhone"
          control={control}
          label="Secondary Phone"
          placeholder="Optional"
        />
        <TextField
          name="contactInfo.emergencyPhone"
          control={control}
          label="Emergency Phone"
          placeholder="Optional"
        />
      </div>

      {/* Address */}
      <TextField
        name="contactInfo.address"
        control={control}
        label="Address"
        placeholder="Street address"
      />

      {/* City, State, Postal Code */}
      <div className="grid gap-4" style={{ gridTemplateColumns: GRID_COLS_3 }}>
        <TextField
          name="contactInfo.city"
          control={control}
          label="City"
          placeholder="City"
        />
        <TextField
          name="contactInfo.stateProvince"
          control={control}
          label="State / Province"
          placeholder="State"
        />
        <TextField
          name="contactInfo.postalCode"
          control={control}
          label="Postal Code"
          placeholder="Postal code"
        />
      </div>
    </FormSection>
  )
}
