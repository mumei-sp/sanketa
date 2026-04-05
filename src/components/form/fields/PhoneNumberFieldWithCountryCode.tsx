import * as React from 'react'
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form'
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
import { COUNTRY_CODES } from './constants'
import { colors } from '@/theme/colors'

/**
 * Props for PhoneNumberFieldWithCountryCode component
 */
export interface PhoneNumberFieldWithCountryCodeProps<T extends FieldValues> {
  /** Control object from React Hook Form */
  control: Control<T>
  /** Field name path for country code (e.g., "contactInfo.phoneCountryCode") */
  countryCodeName: FieldPath<T>
  /** Field name path for phone number (e.g., "contactInfo.primaryPhone") */
  phoneName: FieldPath<T>
  /** Label text displayed above the input */
  label?: string
  /** Placeholder text for phone input */
  placeholder?: string
  /** Default country code value */
  defaultCountryCode?: string
  /** Additional className for the wrapper */
  className?: string
  /** Custom className for country code select trigger */
  countryCodeClassName?: string
  /** Custom style for country code select trigger */
  countryCodeStyle?: React.CSSProperties
}

/**
 * Inner component to handle country code select with proper initialization
 */
function CountryCodeSelect<_T extends FieldValues>({
  field,
  defaultCountryCode,
  countryCodeClassName,
  countryCodeStyle,
}: {
  field: { value: string | undefined; onChange: (value: string) => void }
  defaultCountryCode: string
  countryCodeClassName?: string
  countryCodeStyle?: React.CSSProperties
}) {
  const initializedRef = React.useRef(false)
  
  // Initialize on mount if value is not set
  React.useEffect(() => {
    if (!initializedRef.current && (field.value == null || field.value === '')) {
      field.onChange(defaultCountryCode)
      initializedRef.current = true
    } else if (field.value != null && field.value !== '') {
      initializedRef.current = true
    }
  }, [field, defaultCountryCode])
  
  // Ensure we always have a valid value
  const currentValue = field.value != null && field.value !== '' ? field.value : defaultCountryCode
  
  // Find the label for the current value
  const currentLabel = COUNTRY_CODES.find(code => code.value === currentValue)?.label || currentValue
  
  return (
    <Select
      value={currentValue}
      onValueChange={field.onChange}
    >
      <SelectTrigger
        className={cn(
          'relative !h-9 !w-24 !min-w-24 !max-w-24 rounded-l-md rounded-r-none border-r-0',
          'hover:bg-accent',
          'focus-visible:ring-0 focus-visible:ring-offset-0 shadow-xs',
          '!px-2 !py-1',
          '!text-heading',
          '!data-[placeholder]:text-heading',
          '[&_[data-slot=select-value]]:!hidden',
          '[&_svg]:!text-heading',
          '[&_svg]:!shrink-0',
          '[&_svg]:!ml-auto',
          countryCodeClassName,
        )}
        style={{
          color: colors.text.heading,
          backgroundColor: colors.accent.soft,
          width: '96px',
          minWidth: '96px',
          maxWidth: '96px',
          opacity: 1,
          visibility: 'visible',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          ...countryCodeStyle,
        }}
      >
        <SelectValue 
          placeholder={defaultCountryCode}
          className="!hidden"
        />
        {/* Always visible country code text */}
        <span
          className="text-muted font-medium text-sm flex-shrink-0"
          style={{
            color: colors.text.muted,
            opacity: 1,
            visibility: 'visible',
          }}
          aria-hidden="true"
        >
          {currentLabel}
        </span>
      </SelectTrigger>
      <SelectContent>
        {COUNTRY_CODES.map(code => (
          <SelectItem key={code.value} value={code.value}>
            {code.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/**
 * PhoneNumberFieldWithCountryCode - A reusable phone number input component
 * with country code selector, integrated with React Hook Form.
 */
export function PhoneNumberFieldWithCountryCode<T extends FieldValues>({
  control,
  countryCodeName,
  phoneName,
  label,
  placeholder = '9876543210',
  defaultCountryCode = '+91',
  className,
  countryCodeClassName,
  countryCodeStyle,
}: PhoneNumberFieldWithCountryCodeProps<T>) {
  const fieldId = React.useId()

  return (
    <div className={cn('space-y-2', className)}>
      {label && <Label htmlFor={`${fieldId}-phone`}>{label}</Label>}
      <div className="flex">
        <Controller
          name={countryCodeName}
          control={control}
          defaultValue={defaultCountryCode as any}
          render={({ field }) => (
            <CountryCodeSelect
              field={field}
              defaultCountryCode={defaultCountryCode}
              countryCodeClassName={countryCodeClassName}
              countryCodeStyle={countryCodeStyle}
            />
          )}
        />
        <Controller
          name={phoneName}
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
  )
}
