import * as React from 'react'
import { Controller, type Control } from 'react-hook-form'
import { FormSection } from '@/components/form/FormSection'
import { TextField } from '@/components/form/fields/TextField'
import { SelectField, type SelectOption } from '@/components/form/fields/SelectField'
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
 * Props for GuardianInfoSection component
 */
export interface GuardianInfoSectionProps {
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
 * Relationship options for alternative guardian
 */
const relationshipOptions: SelectOption[] = [
  { value: 'Father', label: 'Father' },
  { value: 'Mother', label: 'Mother' },
  { value: 'Guardian', label: 'Guardian' },
  { value: 'Aunt', label: 'Aunt' },
  { value: 'Uncle', label: 'Uncle' },
  { value: 'Grandfather', label: 'Grandfather' },
  { value: 'Grandmother', label: 'Grandmother' },
  { value: 'Other', label: 'Other' },
]

/**
 * PhoneNumberField - Reusable phone number field with country code dropdown
 */
function PhoneNumberField({
  control,
  countryCodeName,
  phoneName,
  label,
  fieldId,
  placeholder = '98765 43210',
}: {
  control: Control<StudentFormValues>
  countryCodeName: string
  phoneName: string
  label: string
  fieldId: string
  placeholder?: string
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={`${fieldId}-phone`}>{label}</Label>
      <div className="flex">
        <Controller
          name={countryCodeName as any}
          control={control}
          render={({ field }) => (
            <Select
              value={field.value != null ? field.value : '+91'}
              onValueChange={field.onChange}
            >
              <SelectTrigger
                className={cn(
                  'h-9 w-20 rounded-l-md rounded-r-none border-r-0 hover:bg-[#F8F8F8]',
                  'focus-visible:ring-0 focus-visible:ring-offset-0 shadow-xs',
                  'px-3 py-1',
                )}
                style={{ backgroundColor: '#F3F4F6' }}
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
          name={phoneName as any}
          control={control}
          render={({ field, fieldState }) => (
            <div className="flex-1">
              <Input
                id={`${fieldId}-phone`}
                type="tel"
                value={field.value != null ? field.value : ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder={placeholder}
                className={cn(
                  'rounded-l-none rounded-r-md border-l-0 bg-white',
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
  )
}

/**
 * GuardianInfoSection - Form section for guardian/parent information.
 * Displays fields for Father, Mother, and Alternative Guardian sections.
 */
export function GuardianInfoSection({ control, width }: GuardianInfoSectionProps) {
  const fatherFieldId = React.useId()
  const motherFieldId = React.useId()
  const altGuardianFieldId = React.useId()

  return (
    <FormSection
      title="Parent/Guardian Info"
      description="Information about the student's guardian or parent"
      width={width}
    >
      {/* Father and Mother sections side by side */}
      <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* Father Section */}
        <div className="space-y-4 rounded-lg p-4" style={{ backgroundColor: '#F8F8F8' }}>
          <h4 className="text-sm font-semibold text-gray-700">Father</h4>
          <TextField
            name="guardianInfo.father.name"
            control={control}
            label="Name"
            placeholder="Enter father's name"
            className="[&_input]:bg-white"
          />
          <PhoneNumberField
            control={control}
            countryCodeName="guardianInfo.father.phoneCountryCode"
            phoneName="guardianInfo.father.phone"
            label="Phone Number"
            fieldId={fatherFieldId}
            placeholder="98765 43210"
          />
        </div>

        {/* Mother Section */}
        <div className="space-y-4 rounded-lg p-4" style={{ backgroundColor: '#F8F8F8' }}>
          <h4 className="text-sm font-semibold text-gray-700">Mother</h4>
          <TextField
            name="guardianInfo.mother.name"
            control={control}
            label="Name"
            placeholder="Enter mother's name"
            className="[&_input]:bg-white"
          />
          <PhoneNumberField
            control={control}
            countryCodeName="guardianInfo.mother.phoneCountryCode"
            phoneName="guardianInfo.mother.phone"
            label="Phone Number"
            fieldId={motherFieldId}
            placeholder="87654 32109"
          />
        </div>
      </div>

      {/* Alternative Guardian Section */}
      <div className="space-y-4 rounded-lg p-4" style={{ backgroundColor: '#F8F8F8' }}>
        <h4 className="text-sm font-semibold text-gray-700">
          Alternative Guardian <span className="text-xs font-normal text-gray-500">(If Any)</span>
        </h4>
        <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <TextField
              name="guardianInfo.alternativeGuardian.name"
              control={control}
              label="Name"
              placeholder="Enter name"
              className="[&_input]:bg-white"
            />
            <SelectField
              name="guardianInfo.alternativeGuardian.relation"
              control={control}
              label="Relation"
              placeholder="Select relation"
              options={relationshipOptions}
              className="[&_button]:bg-white"
            />
          </div>
          <PhoneNumberField
            control={control}
            countryCodeName="guardianInfo.alternativeGuardian.phoneCountryCode"
            phoneName="guardianInfo.alternativeGuardian.phone"
            label="Phone Number"
            fieldId={altGuardianFieldId}
            placeholder="76543 21098"
          />
        </div>
      </div>
    </FormSection>
  )
}
