import * as React from 'react'
import { Controller, type Control } from 'react-hook-form'
import { FormSection } from '@/components/form/FormSection'
import { TextField } from '@/components/form/fields/TextField'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { StudentFormValues } from '@/forms/student/student.schema'

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
 * Common country codes for phone number selection
 */
const countryCodes = [
  { value: '+1', label: '+1' },
  { value: '+44', label: '+44' },
  { value: '+91', label: '+91' },
  { value: '+86', label: '+86' },
  { value: '+81', label: '+81' },
  { value: '+49', label: '+49' },
  { value: '+33', label: '+33' },
  { value: '+61', label: '+61' },
]

/**
 * ContactInfoSection - Form section for contact information.
 * Displays fields for email address, phone number with country code, and address.
 */
export function ContactInfoSection({ control, width }: ContactInfoSectionProps) {
  const fieldId = React.useId()

  return (
    <FormSection
      title="Contact Information"
      description="Contact details for the student"
      width={width}
    >
      {/* Email Address and Phone Number - Side by Side */}
      <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* Email Address */}
        <TextField
          name="contactInfo.email"
          control={control}
          label="Email Address"
          type="email"
          placeholder="Enter email address"
        />

        {/* Phone Number with Country Code */}
        <div className="space-y-2">
          <Label htmlFor={`${fieldId}-phone`}>Phone Number</Label>
          <div className="flex">
            <Controller
              name="contactInfo.phoneCountryCode"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value != null ? field.value : '+91'}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger
                    className={cn(
                      'h-9 w-20 rounded-l-md rounded-r-none border-r-0 bg-gray-100 hover:bg-gray-100',
                      'focus-visible:ring-0 focus-visible:ring-offset-0 shadow-xs',
                      'px-3 py-1',
                    )}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {countryCodes.map(code => (
                      <SelectItem key={code.value} value={code.value}>
                        {code.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <Controller
              name="contactInfo.primaryPhone"
              control={control}
              render={({ field, fieldState }) => (
                <div className="flex-1">
                  <Input
                    id={`${fieldId}-phone`}
                    type="tel"
                    value={field.value != null ? field.value : ''}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="9876543210"
                    className={cn(
                      'rounded-l-none rounded-r-md border-l-0',
                      fieldState.error && 'border-destructive focus-visible:ring-destructive',
                    )}
                    aria-invalid={fieldState.error ? 'true' : 'false'}
                  />
                  {fieldState.error && (
                    <p role="alert" className="text-destructive text-sm mt-1">
                      {fieldState.error.message}
                    </p>
                  )}
                </div>
              )}
            />
          </div>
        </div>
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
