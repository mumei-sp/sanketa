import * as React from 'react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { X } from 'lucide-react'

/**
 * Phone input component with +91 prefix for Indian phone numbers.
 * Displays "+91" prefix and accepts only numeric input with auto-formatting.
 */
export interface PhoneInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type' | 'maxLength'
> {
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
  /** Placeholder text (default: "e.g., 3456 78901") */
  placeholder?: string
  /** Maximum number of digits allowed (default: 10 for Indian mobile numbers) */
  maxDigits?: number
  /** Enable auto-formatting as user types (default: true) */
  autoFormat?: boolean
  /** Show clear button when input has value */
  showClearButton?: boolean
  /** Callback when clear button is clicked */
  onClear?: () => void
}

/**
 * Formats phone number as user types: "1234567890" -> "1234 567890"
 * @param digits - String of digits only
 * @param maxDigits - Maximum number of digits to format (default: 10)
 * @returns Formatted phone number string
 */
const formatPhoneNumber = (digits: string, maxDigits: number = 10): string => {
  if (digits.length <= 4) return digits

  // Format: first 4 digits, then space, then remaining digits
  // Ensure we don't exceed maxDigits
  const digitsToFormat = digits.slice(0, maxDigits)
  if (digitsToFormat.length <= 4) return digitsToFormat

  return `${digitsToFormat.slice(0, 4)} ${digitsToFormat.slice(4)}`
}

/**
 * Removes all non-digit characters from a string
 */
const extractDigits = (value: string): string => {
  return value.replace(/\D/g, '')
}

/**
 * PhoneInput - Phone number input with +91 prefix for Indian numbers.
 */
export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      label,
      subLabel,
      requiredMark,
      error,
      wrapperClassName,
      labelClassName,
      subLabelClassName,
      placeholder = 'e.g., 3456 78901',
      className,
      disabled,
      id,
      value,
      onChange,
      onBlur,
      maxDigits = 10,
      autoFormat = true,
      showClearButton = false,
      onClear,
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

    const inputRef = React.useRef<HTMLInputElement>(null)
    // Convert value to string for consistent handling (handles both string and number types)
    const inputValue = value != null ? String(value) : ''
    const hasValue = inputValue.length > 0
    // Calculate maxLength: maxDigits + space (if autoFormat is enabled)
    const maxLength = autoFormat ? maxDigits + 1 : maxDigits

    // Normalize displayed value to ensure consistent formatting
    const displayValue = React.useMemo(() => {
      if (!inputValue) return ''
      const digits = extractDigits(inputValue)
      if (digits.length === 0) return ''
      return autoFormat ? formatPhoneNumber(digits, maxDigits) : digits
    }, [inputValue, autoFormat, maxDigits])

    // Combine refs
    const combinedRef = React.useCallback(
      (node: HTMLInputElement | null) => {
        inputRef.current = node
        if (typeof ref === 'function') {
          ref(node)
        } else if (ref) {
          ref.current = node
        }
      },
      [ref],
    )

    // Handle input change to allow only numbers and format if enabled
    const handleChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value
        // Extract only digits
        let digits = extractDigits(inputValue)

        // Limit to maxDigits
        if (digits.length > maxDigits) {
          digits = digits.slice(0, maxDigits)
        }

        // Format if autoFormat is enabled
        const formattedValue = autoFormat ? formatPhoneNumber(digits, maxDigits) : digits

        if (onChange) {
          const syntheticEvent = {
            ...e,
            target: { ...e.target, value: formattedValue },
          } as React.ChangeEvent<HTMLInputElement>
          onChange(syntheticEvent)
        }
      },
      [maxDigits, autoFormat, onChange],
    )

    // Handle blur to ensure consistent formatting
    const handleBlur = React.useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        if (autoFormat && inputValue) {
          const digits = extractDigits(inputValue)
          if (digits.length > 0 && digits.length <= maxDigits) {
            const formattedValue = formatPhoneNumber(digits, maxDigits)
            // Only update if formatting would change the value
            if (formattedValue !== displayValue && onChange) {
              // Create a synthetic change event for consistent formatting
              const syntheticEvent = {
                ...e,
                target: { ...e.target, value: formattedValue },
                currentTarget: { ...e.currentTarget, value: formattedValue },
              } as React.ChangeEvent<HTMLInputElement>
              onChange(syntheticEvent)
            }
          }
        }
        if (onBlur) {
          onBlur(e)
        }
      },
      [autoFormat, inputValue, displayValue, maxDigits, onChange, onBlur],
    )

    const handleClear = React.useCallback(() => {
      if (onClear) {
        onClear()
      } else if (onChange) {
        const event = {
          target: { value: '' },
        } as React.ChangeEvent<HTMLInputElement>
        onChange(event)
      }
      // Return focus to input after clearing
      inputRef.current?.focus()
    }, [onClear, onChange])

    return (
      <div className={cn('flex flex-col gap-1 w-full', wrapperClassName)}>
        {label && (
          <label
            htmlFor={finalId}
            className={cn(
              'text-sm font-medium text-gray-700',
              disabled && 'opacity-60',
              labelClassName,
            )}
          >
            {label}
            {requiredMark && (
              <span className="text-red-500" aria-label="required">
                {' '}
                *
              </span>
            )}
          </label>
        )}

        <div className="relative flex items-center">
          {/* +91 Prefix */}
          <span
            className={cn(
              'absolute left-3 text-gray-600 font-medium pointer-events-none',
              disabled && 'opacity-60',
            )}
            aria-hidden="true"
          >
            +91
          </span>

          <Input
            ref={combinedRef}
            id={finalId}
            type="tel"
            disabled={disabled}
            required={requiredMark}
            aria-required={requiredMark}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={describedBy}
            value={displayValue}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            maxLength={maxLength}
            className={cn(
              'h-11 rounded-xl border transition-all',
              'focus-visible:ring-2 focus-visible:ring-primary',
              'pl-12', // Padding to accommodate +91 prefix
              showClearButton && hasValue ? 'pr-10' : 'pr-3',
              disabled
                ? 'bg-gray-100 border-gray-300 text-gray-600 cursor-not-allowed'
                : 'bg-white',
              !disabled && error
                ? 'border-red-500 focus-visible:ring-red-500'
                : !disabled && 'border-gray-300',
              className,
            )}
            {...props}
          />

          {showClearButton && hasValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 rounded"
              aria-label="Clear phone number"
              tabIndex={0}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {error && (
          <p
            id={errorId}
            role="alert"
            className={cn('text-xs text-red-500', disabled && 'opacity-60')}
          >
            {error}
          </p>
        )}

        {subLabel && !error && (
          <p
            id={subLabelId}
            className={cn('text-xs text-gray-500', disabled && 'opacity-60', subLabelClassName)}
          >
            {subLabel}
          </p>
        )}
      </div>
    )
  },
)

PhoneInput.displayName = 'PhoneInput'
