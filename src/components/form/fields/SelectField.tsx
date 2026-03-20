import * as React from 'react'
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

/**
 * Option type for select field
 */
export interface SelectOption {
  value: string
  label: string
}

/**
 * Props for SelectField component
 */
export interface SelectFieldProps<T extends FieldValues> {
  /** Field name path (e.g., "academicInfo.gradeLevel") */
  name: FieldPath<T>
  /** Control object from React Hook Form */
  control: Control<T>
  /** Label text displayed above the select */
  label?: string
  /** Helper text shown below the select */
  description?: string
  /** Disables the select field */
  disabled?: boolean
  /** Options array for the select */
  options: SelectOption[]
  /** Placeholder text */
  placeholder?: string
  /** Additional className for the wrapper */
  className?: string
  /** Show required asterisk next to label */
  required?: boolean
}

/**
 * SelectField - A reusable select component integrated with React Hook Form.
 * Uses shadcn Select components and displays validation errors.
 */
export function SelectField<T extends FieldValues>({
  name,
  control,
  label,
  description,
  disabled,
  options,
  placeholder = 'Select an option',
  className,
  required,
}: SelectFieldProps<T>) {
  const fieldId = React.useId()

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <div className={cn('w-full space-y-2', className)}>
          {label && (
            <Label htmlFor={fieldId} className={disabled ? 'opacity-60' : ''}>
              {label}{required && <span className="text-destructive ml-0.5">*</span>}
            </Label>
          )}
          <Select
            value={field.value != null ? field.value : ''}
            onValueChange={field.onChange}
            disabled={disabled}
          >
            <SelectTrigger
              id={fieldId}
              aria-invalid={fieldState.error ? 'true' : 'false'}
              aria-describedby={
                fieldState.error
                  ? `${fieldId}-error`
                  : description
                    ? `${fieldId}-description`
                    : undefined
              }
              className={cn(
                'w-full',
                fieldState.error && 'border-destructive focus-visible:ring-destructive',
              )}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description && !fieldState.error && (
            <p id={`${fieldId}-description`} className="text-muted-foreground text-sm">
              {description}
            </p>
          )}
          {fieldState.error && (
            <p id={`${fieldId}-error`} role="alert" className="text-destructive text-sm">
              {fieldState.error.message}
            </p>
          )}
        </div>
      )}
    />
  )
}
