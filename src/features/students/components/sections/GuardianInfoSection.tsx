import { type Control } from 'react-hook-form'
import { FormSection } from '@/components/form/FormSection'
import {
  TextField,
  SelectField,
  PhoneNumberFieldWithCountryCode,
  type SelectOption,
  GRID_COLS_2,
  GUARDIAN_PHONE_FIELD_STYLE,
  GUARDIAN_PHONE_FIELD_CLASSNAME,
  GUARDIAN_INPUT_BG_CLASS,
  GUARDIAN_BUTTON_BG_CLASS,
} from '@/components/form/fields'
import { GuardianCard } from './GuardianCard'
import type { StudentFormValues } from '../../schemas/student-schema'

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
 * GuardianInfoSection - Form section for guardian/parent information.
 * Displays fields for Father, Mother, and Alternative Guardian sections.
 */
export function GuardianInfoSection({ control, width }: GuardianInfoSectionProps) {
  return (
    <FormSection
      title="Parent/Guardian Info"
      description="Information about the student's guardian or parent"
      width={width}
    >
      {/* Father and Mother sections side by side */}
      <div className="grid gap-4" style={{ gridTemplateColumns: GRID_COLS_2 }}>
        {/* Father Section */}
        <GuardianCard title="Father">
          <TextField
            name="guardianInfo.father.name"
            control={control}
            label="Name"
            placeholder="Enter father's name"
            className={GUARDIAN_INPUT_BG_CLASS}
          />
          <PhoneNumberFieldWithCountryCode
            control={control}
            countryCodeName="guardianInfo.father.phoneCountryCode"
            phoneName="guardianInfo.father.phone"
            label="Phone Number"
            placeholder="98765 43210"
            countryCodeStyle={GUARDIAN_PHONE_FIELD_STYLE}
            countryCodeClassName={GUARDIAN_PHONE_FIELD_CLASSNAME}
          />
        </GuardianCard>

        {/* Mother Section */}
        <GuardianCard title="Mother">
          <TextField
            name="guardianInfo.mother.name"
            control={control}
            label="Name"
            placeholder="Enter mother's name"
            className={GUARDIAN_INPUT_BG_CLASS}
          />
          <PhoneNumberFieldWithCountryCode
            control={control}
            countryCodeName="guardianInfo.mother.phoneCountryCode"
            phoneName="guardianInfo.mother.phone"
            label="Phone Number"
            placeholder="87654 32109"
            countryCodeStyle={GUARDIAN_PHONE_FIELD_STYLE}
            countryCodeClassName={GUARDIAN_PHONE_FIELD_CLASSNAME}
          />
        </GuardianCard>
      </div>

      {/* Alternative Guardian Section */}
      <GuardianCard
        title={
          <>
            Alternative Guardian <span className="text-xs font-normal text-gray-500">(If Any)</span>
          </>
        }
      >
        <div className="grid gap-4" style={{ gridTemplateColumns: GRID_COLS_2 }}>
          <div className="grid gap-4" style={{ gridTemplateColumns: GRID_COLS_2 }}>
            <TextField
              name="guardianInfo.alternativeGuardian.name"
              control={control}
              label="Name"
              placeholder="Enter name"
              className={GUARDIAN_INPUT_BG_CLASS}
            />
            <SelectField
              name="guardianInfo.alternativeGuardian.relation"
              control={control}
              label="Relation"
              placeholder="Select relation"
              options={relationshipOptions}
              className={GUARDIAN_BUTTON_BG_CLASS}
            />
          </div>
          <PhoneNumberFieldWithCountryCode
            control={control}
            countryCodeName="guardianInfo.alternativeGuardian.phoneCountryCode"
            phoneName="guardianInfo.alternativeGuardian.phone"
            label="Phone Number"
            placeholder="76543 21098"
            countryCodeStyle={GUARDIAN_PHONE_FIELD_STYLE}
            countryCodeClassName={GUARDIAN_PHONE_FIELD_CLASSNAME}
          />
        </div>
      </GuardianCard>
    </FormSection>
  )
}
