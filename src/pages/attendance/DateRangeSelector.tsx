import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar } from 'lucide-react'
import type { DateRange, DateRangePreset } from './attendance-types'
import { formatDateForDisplay, calculateDateRange } from '@/utils/date'

/**
 * Props for DateRangeSelector component
 */
export interface DateRangeSelectorProps {
  /** Current date range value */
  value: DateRange
  /** Callback when date range changes */
  onChange: (range: DateRange) => void
  /** Optional: available dates to limit selection (not implemented yet) */
  availableDates?: string[]
}

/**
 * Get display text for custom range trigger
 */
function getCustomRangeDisplayText(range: DateRange): string {
  if (range.preset === 'custom' && range.startDate && range.endDate) {
    const start = formatDateForDisplay(range.startDate)
    const end = formatDateForDisplay(range.endDate)
    if (start === end) {
      return start
    }
    return `${start} - ${end}`
  }
  return 'Custom Range'
}

/**
 * DateRangeSelector - Component for selecting date ranges with presets and custom range
 */
export function DateRangeSelector({ value, onChange }: DateRangeSelectorProps) {
  const [customStartDate, setCustomStartDate] = React.useState<string>(value.startDate || '')
  const [customEndDate, setCustomEndDate] = React.useState<string>(value.endDate || '')
  const [isCustomOpen, setIsCustomOpen] = React.useState(false)

  // Update local state when value changes externally
  React.useEffect(() => {
    if (value.preset === 'custom') {
      // Initialize custom dates from value
      if (value.startDate && value.endDate) {
        setCustomStartDate(value.startDate)
        setCustomEndDate(value.endDate)
      }
    }
  }, [value])

  /**
   * Handle preset selection
   */
  const handlePresetSelect = React.useCallback(
    (preset: DateRangePreset) => {
      if (preset === 'custom') {
        // Set preset to custom immediately so the button appears
        // Use current custom dates if they exist, otherwise use default range (last 14 days)
        const defaultRange = calculateDateRange('last-14-days')

        onChange({
          startDate: customStartDate || defaultRange.startDate,
          endDate: customEndDate || defaultRange.endDate,
          preset: 'custom',
        })
        // Open the custom range picker
        setIsCustomOpen(true)
        return
      }

      const range = calculateDateRange(preset)
      onChange(range)
    },
    [onChange, customStartDate, customEndDate],
  )

  /**
   * Handle custom range apply
   */
  const handleCustomRangeApply = React.useCallback(() => {
    if (!customStartDate || !customEndDate) {
      return
    }

    // Validate dates
    const start = new Date(customStartDate)
    const end = new Date(customEndDate)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return
    }

    // Ensure start is before end
    if (start > end) {
      // Swap if needed
      onChange({
        startDate: customEndDate,
        endDate: customStartDate,
        preset: 'custom',
      })
    } else {
      onChange({
        startDate: customStartDate,
        endDate: customEndDate,
        preset: 'custom',
      })
    }

    setIsCustomOpen(false)
  }, [customStartDate, customEndDate, onChange])

  // Get current preset value for Select
  // When custom is selected, we still show "custom" in the dropdown
  // but display the actual date range in a separate button
  const currentPreset = value.preset || 'last-14-days'

  return (
    <div className="flex items-center gap-2">
      {/* Preset dropdown */}
      <Select
        value={currentPreset}
        onValueChange={val => handlePresetSelect(val as DateRangePreset)}
      >
        <SelectTrigger className="h-8 w-[140px] bg-accent text-foreground border-0 hover:bg-accent/80">
          <SelectValue placeholder="Select range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="last-14-days">Last 14 Days</SelectItem>
          <SelectItem value="last-30-days">Last 30 Days</SelectItem>
          <SelectItem value="this-month">This Month</SelectItem>
          <SelectItem value="last-month">Last Month</SelectItem>
          <SelectItem value="custom">Custom Range</SelectItem>
        </SelectContent>
      </Select>

      {/* Custom range dropdown - only show when custom is selected */}
      {value.preset === 'custom' && (
        <DropdownMenu open={isCustomOpen} onOpenChange={setIsCustomOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-md bg-accent text-foreground border-0 hover:bg-accent/80"
            >
              <Calendar className="mr-2 h-4 w-4" />
              {getCustomRangeDisplayText(value)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[280px] p-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="start-date" className="text-body">
                  Start Date
                </Label>
                <Input
                  id="start-date"
                  type="date"
                  value={customStartDate}
                  onChange={e => setCustomStartDate(e.target.value)}
                  className="h-8"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date" className="text-body">
                  End Date
                </Label>
                <Input
                  id="end-date"
                  type="date"
                  value={customEndDate}
                  onChange={e => setCustomEndDate(e.target.value)}
                  className="h-8"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCustomOpen(false)}
                  className="h-8"
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleCustomRangeApply}
                  disabled={!customStartDate || !customEndDate}
                  className="h-8"
                >
                  Apply
                </Button>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
