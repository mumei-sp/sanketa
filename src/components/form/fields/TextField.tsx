import * as React from 'react'
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

/**
 * Props for TextField component
 */
export interface TextFieldProps<T extends FieldValues> {
  /** Field name path (e.g., "personalInfo.firstName") */
  name: FieldPath<T>
  /** Control object from React Hook Form */
  control: Control<T>
  /** Label text displayed above the input */
  label?: string
  /** Helper text shown below the input */
  description?: string
  /** Disables the input field */
  disabled?: boolean
  /** Input type (text, email, tel, etc.) */
  type?: string
  /** Placeholder text */
  placeholder?: string
  /** Additional className for the wrapper */
  className?: string
}

/**
 * TextField - A reusable text input component integrated with React Hook Form.
 * Uses shadcn Input component and displays validation errors.
 */
export function TextField<T extends FieldValues>({
  name,
  control,
  label,
  description,
  disabled,
  type = 'text',
  placeholder,
  className,
}: TextFieldProps<T>) {
  const fieldId = React.useId()

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <div className={cn('space-y-2', className)}>
          {label && (
            <Label htmlFor={fieldId} className={disabled ? 'opacity-60' : ''}>
              {label}
            </Label>
          )}
          <Input
            id={fieldId}
            type={type}
            placeholder={placeholder}
            disabled={disabled}
            {...field}
            value={field.value != null ? field.value : ''}
            aria-invalid={fieldState.error ? 'true' : 'false'}
            aria-describedby={
              fieldState.error
                ? `${fieldId}-error`
                : description
                  ? `${fieldId}-description`
                  : undefined
            }
            className={cn(fieldState.error && 'border-destructive focus-visible:ring-destructive')}
          />
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
