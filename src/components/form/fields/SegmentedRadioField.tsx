import * as React from 'react'
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form'
import { SegmentedRadio, type SegmentedRadioOption } from '@/components/inputs/SegmentedRadio'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

/**
 * Props for SegmentedRadioField component
 */
export interface SegmentedRadioFieldProps<T extends FieldValues> {
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
  /** Options array for the segmented radio */
  options: SegmentedRadioOption[]
  /** Additional className for the wrapper */
  className?: string
  /** Number of columns in the grid */
  columns?: number
  /** Size of the radio button */
  size?: string | number
  /** Padding for each option */
  padding?: string | number
  /** Height of each option */
  height?: string | number
  /** Gap between options */
  gap?: string | number
  /** Color of the radio button */
  radioColor?: string
  /** Background color when option is selected */
  selectedBackdropColor?: string
  /** Border color when option is selected */
  selectedBorderColor?: string
  /** Border color when option is not selected */
  unselectedBorderColor?: string
  /** Custom className for the radio group */
  radioClassName?: string
  /** Custom className for individual option labels */
  optionClassName?: string
}

/**
 * SegmentedRadioField - A reusable segmented radio field component
 * integrated with React Hook Form.
 */
export function SegmentedRadioField<T extends FieldValues>({
  name,
  control,
  label,
  description,
  disabled,
  options,
  className,
  columns,
  size,
  padding,
  height,
  gap,
  radioColor,
  selectedBackdropColor,
  selectedBorderColor,
  unselectedBorderColor,
  radioClassName,
  optionClassName,
}: SegmentedRadioFieldProps<T>) {
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
          <SegmentedRadio
            options={options}
            value={field.value != null ? field.value.toString() : ''}
            onValueChange={value => {
              // Try to convert to number if the value is numeric, otherwise keep as string
              const numValue = Number(value)
              field.onChange(isNaN(numValue) ? value : numValue)
            }}
            columns={columns}
            size={size}
            padding={padding}
            height={height}
            gap={gap}
            radioColor={radioColor}
            selectedBackdropColor={selectedBackdropColor}
            selectedBorderColor={selectedBorderColor}
            unselectedBorderColor={unselectedBorderColor}
            className={radioClassName}
            optionClassName={optionClassName}
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

