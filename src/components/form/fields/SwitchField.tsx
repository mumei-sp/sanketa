import * as React from 'react'
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

/**
 * Props for SwitchField component
 */
export interface SwitchFieldProps<T extends FieldValues> {
  /** Field name path (e.g., "additionalInfo.specialNeedsSupport") */
  name: FieldPath<T>
  /** Control object from React Hook Form */
  control: Control<T>
  /** Label text displayed next to the switch */
  label?: string
  /** Helper text shown below the switch */
  description?: string
  /** Disables the switch */
  disabled?: boolean
  /** Additional className for the wrapper */
  className?: string
  /** Additional className for the Switch component */
  switchClassName?: string
}

/**
 * SwitchField - A reusable switch component integrated with React Hook Form.
 * Uses shadcn Switch component and displays validation errors.
 */
export function SwitchField<T extends FieldValues>({
  name,
  control,
  label,
  description,
  disabled,
  className,
  switchClassName,
}: SwitchFieldProps<T>) {
  const fieldId = React.useId()

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <div className={cn('space-y-2', className)}>
          <div className="flex items-center space-x-2">
            <Switch
              id={fieldId}
              checked={field.value || false}
              onCheckedChange={field.onChange}
              disabled={disabled}
              className={switchClassName}
              aria-invalid={fieldState.error ? 'true' : 'false'}
              aria-describedby={
                fieldState.error
                  ? `${fieldId}-error`
                  : description
                    ? `${fieldId}-description`
                    : undefined
              }
            />
            {label && (
              <Label
                htmlFor={fieldId}
                className={cn('font-normal cursor-pointer', disabled && 'opacity-60')}
              >
                {label}
              </Label>
            )}
          </div>
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
