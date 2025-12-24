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
          render={({ field }) => (
            <Select
              value={field.value != null ? field.value : defaultCountryCode}
              onValueChange={field.onChange}
            >
              <SelectTrigger
                className={cn(
                  'h-9 w-20 rounded-l-md rounded-r-none border-r-0 bg-gray-100 hover:bg-gray-100',
                  'focus-visible:ring-0 focus-visible:ring-offset-0 shadow-xs',
                  'px-3 py-1',
                  countryCodeClassName,
                )}
                style={countryCodeStyle}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COUNTRY_CODES.map(code => (
                  <SelectItem key={code.value} value={code.value}>
                    {code.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
