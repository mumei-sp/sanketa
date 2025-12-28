import * as React from 'react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { X } from 'lucide-react'

/**
 * Input field component with label, icons, error states, and accessibility support.
 * Extends native input attributes for full HTML input compatibility.
 */
export interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Label text displayed above the input */
  label?: string
  /** Helper text shown below the input (hidden when error is present) */
  subLabel?: string
  /** Shows required asterisk and sets required/aria-required attributes */
  requiredMark?: boolean
  /** Error message displayed below input with error styling */
  error?: string
  /** Custom className for the wrapper div */
  wrapperClassName?: string
  /** Custom className for the label */
  labelClassName?: string
  /** Custom className for the subLabel */
  subLabelClassName?: string
  /** Icon rendered on the left side of input */
  leftIcon?: React.ReactNode
  /** Icon rendered on the right side of input */
  rightIcon?: React.ReactNode
  /** Makes rightIcon clickable (removes pointer-events-none) */
  rightIconClickable?: boolean
  /** Show character counter (requires maxLength prop) */
  showCharCount?: boolean
  /** Show clear button when input has value */
  showClearButton?: boolean
  /** Callback when clear button is clicked */
  onClear?: () => void
}

/**
 * InputField - A customizable input component with label, icons, and error handling.
 */
export const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  (
    {
      label,
      subLabel,
      requiredMark,
      error,
      wrapperClassName,
      labelClassName,
      subLabelClassName,
      leftIcon,
      rightIcon,
      rightIconClickable = false,
      showCharCount = false,
      showClearButton = false,
      onClear,
      className,
      disabled,
      id,
      value,
      maxLength,
      ...props
    },
    ref,
  ) => {
    const inputId = React.useId()
    const finalId = id || inputId
    const errorId = `${finalId}-error`
    const subLabelId = `${finalId}-sublabel`

    // Build aria-describedby for accessibility
    const describedBy =
      [error && errorId, subLabel && !error && subLabelId].filter(Boolean).join(' ') || undefined

    const inputValue = value || ''
    const hasValue = typeof inputValue === 'string' && inputValue.length > 0
    const charCount = maxLength && typeof inputValue === 'string' ? inputValue.length : 0
    const remainingChars = maxLength ? maxLength - charCount : 0

    const handleClear = () => {
      if (onClear) {
        onClear()
      } else if (props.onChange) {
        const event = {
          target: { value: '' },
        } as React.ChangeEvent<HTMLInputElement>
        props.onChange(event)
      }
    }

    return (
      <div className={cn('flex flex-col gap-1 w-full', wrapperClassName)}>
        {label && (
          <label
            htmlFor={finalId}
            className={cn(
              'text-sm font-medium text-foreground',
              disabled && 'opacity-60',
              labelClassName,
            )}
          >
            {label}
            {requiredMark && (
              <span className="text-status-danger" aria-label="required">
                {' '}
                *
              </span>
            )}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <span
              className={cn(
                'absolute left-3 pointer-events-none',
                disabled ? 'text-muted-foreground' : 'text-muted-foreground',
              )}
              aria-hidden="true"
            >
              {leftIcon}
            </span>
          )}

          <Input
            ref={ref}
            id={finalId}
            disabled={disabled}
            required={requiredMark}
            aria-required={requiredMark}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={describedBy}
            value={value ?? ''}
            maxLength={maxLength}
            className={cn(
              'h-11 rounded-xl border transition-all',
              'focus-visible:ring-2 focus-visible:ring-primary',
              disabled
                ? 'bg-muted border-default text-muted-foreground cursor-not-allowed'
                : 'bg-white',
              !disabled && error
                ? 'border-status-danger focus-visible:ring-status-danger'
                : !disabled && 'border-default',
              leftIcon ? 'pl-10' : 'pl-3',
              rightIcon || (showClearButton && hasValue) ? 'pr-10' : 'pr-3',
              className,
            )}
            {...props}
          />

          {showClearButton && hasValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear input"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {rightIcon && !(showClearButton && hasValue) && (
            <span
              className={cn(
                'absolute right-3',
                disabled ? 'text-muted-foreground' : 'text-muted-foreground',
                !rightIconClickable && 'pointer-events-none',
              )}
              aria-hidden={!rightIconClickable}
            >
              {rightIcon}
            </span>
          )}
        </div>

        {error && (
          <p
            id={errorId}
            role="alert"
            className={cn('text-xs text-status-danger', disabled && 'opacity-60')}
          >
            {error}
          </p>
        )}

        {subLabel && !error && !showCharCount && (
          <p
            id={subLabelId}
            className={cn('text-xs text-muted-foreground', disabled && 'opacity-60', subLabelClassName)}
          >
            {subLabel}
          </p>
        )}

        {showCharCount && maxLength && !error && (
          <div className="flex justify-between items-center">
            {subLabel && (
              <p
                id={subLabelId}
                className={cn('text-xs text-muted-foreground', disabled && 'opacity-60', subLabelClassName)}
              >
                {subLabel}
              </p>
            )}
            <p
              className={cn(
                'text-xs ml-auto',
                remainingChars < maxLength * 0.1 ? 'text-status-danger' : 'text-muted-foreground',
                disabled && 'opacity-60',
              )}
            >
              {charCount}/{maxLength}
            </p>
          </div>
        )}
      </div>
    )
  },
)

InputField.displayName = 'InputField'
