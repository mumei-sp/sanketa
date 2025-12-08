import { useId, useMemo } from 'react'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'

export interface SegmentedRadioOption {
  /** The value of the option */
  value: string
  /** The display label for the option */
  label: string
}

export interface SegmentedRadioProps {
  /** Array of options to display */
  options?: SegmentedRadioOption[]
  /** Current selected value */
  value?: string
  /** Callback when value changes */
  onValueChange?: (value: string) => void
  /** Default value (uncontrolled) */
  defaultValue?: string
  /** Custom className for the radio group */
  className?: string
  /** Custom className for individual option labels */
  optionClassName?: string
  /** Number of columns in the grid (defaults to options length, max 4) */
  columns?: number
  /** Size of the radio button (Tailwind size class like 'size-3', 'size-4', 'size-5', or number in px) */
  size?: string | number
  /** Padding for each option (Tailwind padding class like 'p-2', 'p-4', 'p-6', or number in px) */
  padding?: string | number
  /** Height of each option (Tailwind height class like 'h-10', 'h-12', 'h-16', or number in px) */
  height?: string | number
  /** Gap between options (Tailwind gap class like 'gap-2', 'gap-4', or number in px) */
  gap?: string | number
  /** Color of the radio button (Tailwind class like 'text-primary', 'text-blue-500', or CSS color like '#3b82f6') */
  radioColor?: string
  /** Background color when option is selected (Tailwind class like 'bg-primary/10', 'bg-blue-100', or CSS color) */
  selectedBackdropColor?: string
  /** Border color when option is selected (Tailwind class like 'border-primary', 'border-blue-500', or CSS color) */
  selectedBorderColor?: string
  /** Border color when option is not selected (Tailwind class like 'border-gray-300', 'border-gray-400', or CSS color) */
  unselectedBorderColor?: string
}

/**
 * SegmentedRadio - A generic segmented radio button component.
 * Displays options in a horizontal segmented layout with customizable columns and dimensions.
 *
 * @example
 * // Basic usage with custom options
 * <SegmentedRadio
 *   options={[
 *     { value: 'option1', label: 'Option 1' },
 *     { value: 'option2', label: 'Option 2' },
 *     { value: 'option3', label: 'Option 3' }
 *   ]}
 *   value={selectedValue}
 *   onValueChange={setSelectedValue}
 * />
 *
 * @example
 * // Backward compatible - defaults to Male/Female if no options provided
 * <SegmentedRadio
 *   value={gender}
 *   onValueChange={setGender}
 * />
 *
 * @example
 * // Custom dimensions
 * <SegmentedRadio
 *   options={[...]}
 *   size={20}              // Radio button size in px
 *   padding={12}           // Padding in px
 *   height={60}            // Height in px
 *   gap={16}               // Gap between options in px
 * />
 *
 * @example
 * // Using Tailwind classes
 * <SegmentedRadio
 *   options={[...]}
 *   size="size-5"          // Tailwind size class
 *   padding="p-6"          // Tailwind padding class
 *   height="h-16"          // Tailwind height class
 *   gap="gap-4"            // Tailwind gap class
 * />
 *
 * @example
 * // Custom colors
 * <SegmentedRadio
 *   options={[...]}
 *   radioColor="text-blue-500"              // Radio button color
 *   selectedBackdropColor="bg-blue-100"    // Selected background
 *   selectedBorderColor="border-blue-500"  // Selected border
 *   unselectedBorderColor="border-gray-400" // Unselected border
 * />
 *
 * @example
 * // Using CSS color values
 * <SegmentedRadio
 *   options={[...]}
 *   radioColor="#3b82f6"
 *   selectedBackdropColor="rgba(59, 130, 246, 0.1)"
 *   selectedBorderColor="#3b82f6"
 *   unselectedBorderColor="#9ca3af"
 * />
 */
// Utility function to check if a string is a numeric value
const isNumericString = (str: string): boolean => /^\d+$/.test(str)

// Utility function to check if a string is a Tailwind class
const isTailwindClass = (str: string | number | undefined, prefix: string): boolean =>
  typeof str === 'string' && str.startsWith(prefix)

// Utility function to parse numeric value (number or numeric string)
const parseNumericValue = (val: string | number | undefined): number | null => {
  if (typeof val === 'number') return val
  if (typeof val === 'string' && isNumericString(val)) return parseInt(val, 10)
  return null
}

// Utility function to check if a string is a CSS value (contains px, rem, %, etc.)
const isCssValue = (str: string | number | undefined): boolean =>
  typeof str === 'string' && /(px|rem|em|%|vh|vw)$/i.test(str.trim())

export const SegmentedRadio = ({
  options,
  value,
  onValueChange,
  defaultValue,
  className,
  optionClassName,
  columns,
  size = 'size-4',
  padding = 'p-4',
  height,
  gap = 'gap-2',
  radioColor,
  selectedBackdropColor,
  selectedBorderColor,
  unselectedBorderColor,
}: SegmentedRadioProps) => {
  const id = useId()

  // Default options for backward compatibility (Male/Female)
  const defaultOptions: SegmentedRadioOption[] = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
  ]

  const radioOptions = options && options.length > 0 ? options : defaultOptions
  const numColumns = useMemo(() => {
    if (columns) {
      return Math.min(Math.max(columns, 1), Math.max(radioOptions.length, 4))
    }
    return Math.min(radioOptions.length, 4)
  }, [columns, radioOptions.length])

  // Memoized grid configuration
  const gridConfig = useMemo(() => {
    const gridColsClass: Record<number, string> = {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
    }

    const gridColsClassName = gridColsClass[numColumns] || 'grid-cols-1'
    const gridStyle: React.CSSProperties = !gridColsClass[numColumns]
      ? { gridTemplateColumns: `repeat(${numColumns}, 1fr)` }
      : {}

    return { gridColsClassName, gridStyle }
  }, [numColumns])

  // Memoized radio button size calculations
  const radioSizeConfig = useMemo(() => {
    const radioSizeClass = isTailwindClass(size, 'size-') ? size : ''

    const numericSize = parseNumericValue(size)
    const radioSizeStyle: React.CSSProperties =
      numericSize !== null ? { width: `${numericSize}px`, height: `${numericSize}px` } : {}

    // Fix: Calculate SVG size for inline styles (instead of dynamic Tailwind classes)
    const svgSize = numericSize !== null ? Math.max(numericSize / 2, 4) : null

    return { radioSizeClass, radioSizeStyle, svgSize }
  }, [size])

  // Memoized padding configuration
  const paddingConfig = useMemo(() => {
    const paddingClass = isTailwindClass(padding, 'p-') ? padding : ''

    const numericPadding = parseNumericValue(padding)
    const paddingStyle: React.CSSProperties =
      numericPadding !== null
        ? { padding: `${numericPadding}px` }
        : typeof padding === 'string' && !paddingClass && isCssValue(padding)
          ? { padding }
          : {}

    const hasPaddingStyle = Object.keys(paddingStyle).length > 0
    const shouldUsePaddingFallback = !hasPaddingStyle && !paddingClass

    return { paddingClass, paddingStyle, shouldUsePaddingFallback }
  }, [padding])

  // Memoized height configuration
  const heightConfig = useMemo(() => {
    const heightClass = isTailwindClass(height, 'h-') ? height : ''

    const numericHeight = parseNumericValue(height)
    const heightStyle: React.CSSProperties =
      numericHeight !== null
        ? { height: `${numericHeight}px` }
        : typeof height === 'string' && !heightClass && isCssValue(height)
          ? { height }
          : {}

    return { heightClass, heightStyle }
  }, [height])

  // Memoized gap configuration
  const gapConfig = useMemo(() => {
    const gapClass = isTailwindClass(gap, 'gap-') ? gap : ''

    const numericGap = parseNumericValue(gap)
    const gapStyle: React.CSSProperties =
      numericGap !== null
        ? { gap: `${numericGap}px` }
        : typeof gap === 'string' && !gapClass && isCssValue(gap)
          ? { gap }
          : {}

    const hasGapStyle = Object.keys(gapStyle).length > 0
    const shouldUseGapFallback = !hasGapStyle && !gapClass

    return { gapClass, gapStyle, shouldUseGapFallback }
  }, [gap])

  // Memoized color configurations
  const colorConfig = useMemo(() => {
    // Radio button color
    const radioColorClass =
      radioColor && isTailwindClass(radioColor, 'text-')
        ? `${radioColor} ${radioColor.replace('text-', 'border-')}`
        : ''

    const radioFillClass =
      radioColor && isTailwindClass(radioColor, 'text-')
        ? `[&_[data-slot="radio-group-indicator"]_svg]:!${radioColor.replace('text-', 'fill-')} [&_svg]:!${radioColor.replace('text-', 'fill-')}`
        : radioColor
          ? '[&_[data-slot="radio-group-indicator"]_svg]:!fill-current [&_svg]:!fill-current'
          : ''

    const radioColorStyle: React.CSSProperties =
      radioColor && !isTailwindClass(radioColor, 'text-')
        ? { color: radioColor, borderColor: radioColor }
        : {}

    // Selected backdrop color
    const selectedBackdropClass =
      selectedBackdropColor && isTailwindClass(selectedBackdropColor, 'bg-')
        ? selectedBackdropColor
        : selectedBackdropColor
          ? ''
          : 'bg-primary/10'

    const selectedBackdropStyle: React.CSSProperties =
      selectedBackdropColor && !isTailwindClass(selectedBackdropColor, 'bg-')
        ? { backgroundColor: selectedBackdropColor }
        : {}

    // Selected border color
    const selectedBorderClass =
      selectedBorderColor && isTailwindClass(selectedBorderColor, 'border-')
        ? selectedBorderColor
        : selectedBorderColor
          ? ''
          : 'border-primary'

    const selectedBorderStyle: React.CSSProperties =
      selectedBorderColor && !isTailwindClass(selectedBorderColor, 'border-')
        ? { borderColor: selectedBorderColor }
        : {}

    // Unselected border color
    const unselectedBorderClass =
      unselectedBorderColor && isTailwindClass(unselectedBorderColor, 'border-')
        ? unselectedBorderColor
        : unselectedBorderColor
          ? ''
          : 'border-gray-300'

    const unselectedBorderStyle: React.CSSProperties =
      unselectedBorderColor && !isTailwindClass(unselectedBorderColor, 'border-')
        ? { borderColor: unselectedBorderColor }
        : {}

    return {
      radioColorClass,
      radioFillClass,
      radioColorStyle,
      selectedBackdropClass,
      selectedBackdropStyle,
      selectedBorderClass,
      selectedBorderStyle,
      unselectedBorderClass,
      unselectedBorderStyle,
    }
  }, [radioColor, selectedBackdropColor, selectedBorderColor, unselectedBorderColor])

  const validValue = useMemo(() => {
    if (!value) return value
    const optionValues = radioOptions.map(opt => opt.value)
    return optionValues.includes(value) ? value : undefined
  }, [value, radioOptions])

  const componentClass = `segmented-radio-${id.replace(/:/g, '-')}`
  return (
    <>
      {radioSizeConfig.svgSize !== null && (
        <style>{`
          .${componentClass} [data-slot="radio-group-indicator"] svg,
          .${componentClass} [data-slot="radio-group-item"] svg {
            width: ${radioSizeConfig.svgSize}px !important;
            height: ${radioSizeConfig.svgSize}px !important;
          }
        `}</style>
      )}
      <RadioGroup
        value={validValue}
        onValueChange={onValueChange}
        defaultValue={defaultValue}
        aria-label="Select an option"
        className={cn(
          'grid w-full max-w-md',
          componentClass,
          gapConfig.gapClass || (gapConfig.shouldUseGapFallback ? 'gap-2' : ''),
          gridConfig.gridColsClassName,
          className,
        )}
        style={{ ...gridConfig.gridStyle, ...gapConfig.gapStyle }}
      >
        {radioOptions.map(option => {
          const optionId = `${id}-${option.value}`
          const isSelected = validValue === option.value

          return (
            <Label
              key={option.value}
              htmlFor={optionId}
              className={cn(
                'flex items-center gap-3 rounded-xl border cursor-pointer select-none transition-all',
                paddingConfig.paddingClass || (paddingConfig.shouldUsePaddingFallback ? 'p-4' : ''),
                heightConfig.heightClass,
                isSelected
                  ? cn(
                      colorConfig.selectedBorderClass || 'border-primary',
                      colorConfig.selectedBackdropClass || 'bg-primary/10',
                    )
                  : cn(colorConfig.unselectedBorderClass || 'border-gray-300'),
                optionClassName,
              )}
              style={{
                ...paddingConfig.paddingStyle,
                ...heightConfig.heightStyle,
                ...(isSelected
                  ? { ...colorConfig.selectedBackdropStyle, ...colorConfig.selectedBorderStyle }
                  : colorConfig.unselectedBorderStyle),
              }}
            >
              <div className="inline-flex">
                <RadioGroupItem
                  id={optionId}
                  value={option.value}
                  className={cn(
                    radioSizeConfig.radioSizeClass || 'size-4',
                    // Apply radio color class - this will override text-primary via twMerge
                    colorConfig.radioColorClass,
                    // Apply fill color for SVG - target the nested SVG elements with !important
                    colorConfig.radioFillClass,
                  )}
                  style={{
                    ...radioSizeConfig.radioSizeStyle,
                    ...colorConfig.radioColorStyle,
                  }}
                />
              </div>
              <span className="text-sm font-medium">{option.label}</span>
            </Label>
          )
        })}
      </RadioGroup>
    </>
  )
}
