import * as React from 'react'
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

/**
 * Option type for radio group field
 */
export interface RadioOption {
  value: string
  label: string
}

/**
 * Props for RadioGroupField component
 */
export interface RadioGroupFieldProps<T extends FieldValues> {
  /** Field name path (e.g., "personalInfo.gender") */
  name: FieldPath<T>
  /** Control object from React Hook Form */
  control: Control<T>
  /** Label text displayed above the radio group */
  label?: string
  /** Helper text shown below the radio group */
  description?: string
  /** Disables the radio group */
  disabled?: boolean
  /** Options array for the radio group */
  options: RadioOption[]
  /** Additional className for the wrapper */
  className?: string
}

/**
 * RadioGroupField - A reusable radio group component integrated with React Hook Form.
 * Uses shadcn RadioGroup components and displays validation errors.
 */
export function RadioGroupField<T extends FieldValues>({
  name,
  control,
  label,
  description,
  disabled,
  options,
  className,
}: RadioGroupFieldProps<T>) {
  const fieldId = React.useId()

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <div className={cn('space-y-2', className)}>
          {label && <Label className={disabled ? 'opacity-60' : ''}>{label}</Label>}
          <RadioGroup
            value={field.value != null ? field.value.toString() : ''}
            onValueChange={value => {
              // Try to convert to number if the value is numeric, otherwise keep as string
              const numValue = Number(value)
              field.onChange(isNaN(numValue) ? value : numValue)
            }}
            disabled={disabled}
            aria-invalid={fieldState.error ? 'true' : 'false'}
            aria-describedby={
              fieldState.error
                ? `${fieldId}-error`
                : description
                  ? `${fieldId}-description`
                  : undefined
            }
          >
            {options.map(option => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`${fieldId}-${option.value}`} />
                <Label
                  htmlFor={`${fieldId}-${option.value}`}
                  className="font-normal cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
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
