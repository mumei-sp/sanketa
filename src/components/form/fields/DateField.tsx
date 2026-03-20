import * as React from 'react'
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

/**
 * Props for DateField component
 */
export interface DateFieldProps<T extends FieldValues> {
  /** Field name path (e.g., "personalInfo.dateOfBirth") */
  name: FieldPath<T>
  /** Control object from React Hook Form */
  control: Control<T>
  /** Label text displayed above the input */
  label?: string
  /** Helper text shown below the input */
  description?: string
  /** Disables the input field */
  disabled?: boolean
  /** Additional className for the wrapper */
  className?: string
  /** Show required asterisk next to label */
  required?: boolean
}

/**
 * DateField - A reusable date input component integrated with React Hook Form.
 * Uses native HTML date input (type="date") wrapped in shadcn Input.
 * Structure allows easy replacement with date picker component later.
 */
export function DateField<T extends FieldValues>({
  name,
  control,
  label,
  description,
  disabled,
  className,
  required,
}: DateFieldProps<T>) {
  const fieldId = React.useId()

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        // Convert date string to YYYY-MM-DD format for native date input
        let dateValue = ''
        if (field.value) {
          try {
            const date = new Date(field.value)
            if (!isNaN(date.getTime())) {
              dateValue = date.toISOString().split('T')[0]
            }
          } catch {
            // Invalid date, leave empty
            dateValue = ''
          }
        }

        return (
          <div className={cn('space-y-2', className)}>
            {label && (
              <Label htmlFor={fieldId} className={disabled ? 'opacity-60' : ''}>
                {label}{required && <span className="text-destructive ml-0.5">*</span>}
              </Label>
            )}
            <Input
              id={fieldId}
              type="date"
              value={dateValue}
              onChange={(e) => {
                const value = e.target.value
                // Convert YYYY-MM-DD to ISO string or empty string
                if (value) {
                  try {
                    const date = new Date(value)
                    if (!isNaN(date.getTime())) {
                      field.onChange(date.toISOString())
                    } else {
                      field.onChange('')
                    }
                  } catch {
                    field.onChange('')
                  }
                } else {
                  field.onChange('')
                }
              }}
              onBlur={field.onBlur}
              disabled={disabled}
              aria-invalid={fieldState.error ? 'true' : 'false'}
              aria-describedby={
                fieldState.error
                  ? `${fieldId}-error`
                  : description
                    ? `${fieldId}-description`
                    : undefined
              }
              className={cn(
                fieldState.error && 'border-destructive focus-visible:ring-destructive',
              )}
            />
            {description && !fieldState.error && (
              <p id={`${fieldId}-description`} className="text-muted-foreground text-sm">
                {description}
              </p>
            )}
            {fieldState.error && (
              <p
                id={`${fieldId}-error`}
                role="alert"
                className="text-destructive text-sm"
              >
                {fieldState.error.message}
              </p>
            )}
          </div>
        )
      }}
    />
  )
}

