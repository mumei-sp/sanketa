import * as React from 'react'
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

/**
 * Props for TextareaField component
 */
export interface TextareaFieldProps<T extends FieldValues> {
  /** Field name path (e.g., "guardianInfo.address") */
  name: FieldPath<T>
  /** Control object from React Hook Form */
  control: Control<T>
  /** Label text displayed above the textarea */
  label?: string
  /** Helper text shown below the textarea */
  description?: string
  /** Disables the textarea field */
  disabled?: boolean
  /** Number of rows */
  rows?: number
  /** Placeholder text */
  placeholder?: string
  /** Additional className for the wrapper */
  className?: string
  /** Additional className for the textarea element */
  textareaClassName?: string
}

/**
 * TextareaField - A reusable textarea component integrated with React Hook Form.
 * Uses shadcn Textarea component and displays validation errors.
 */
export function TextareaField<T extends FieldValues>({
  name,
  control,
  label,
  description,
  disabled,
  rows = 4,
  placeholder,
  className,
  textareaClassName,
}: TextareaFieldProps<T>) {
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
          <Textarea
            id={fieldId}
            rows={rows}
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
            className={cn(
              fieldState.error && 'border-destructive focus-visible:ring-destructive',
              textareaClassName,
            )}
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
