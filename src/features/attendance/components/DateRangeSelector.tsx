import * as React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { DateRange, AttendanceTableData } from '../types'
import { MONTH_NAMES } from '@/utils/date'

export interface DateRangeSelectorProps {
  value: DateRange
  onChange: (range: DateRange) => void
  /** All attendance records to derive available months */
  records: AttendanceTableData[]
}

interface MonthOption {
  value: string
  label: string
}

/**
 * Derive unique months from attendance records, sorted newest first
 */
function getAvailableMonths(records: AttendanceTableData[]): MonthOption[] {
  const monthSet = new Set<string>()
  if (!records || records.length === 0) return []

  records.forEach(record => {
    Object.keys(record.attendance).forEach(dateStr => {
      // Parse YYYY-MM-DD directly to avoid timezone issues
      const parts = dateStr.split('-')
      if (parts.length === 3) {
        const key = `${parts[0]}-${parts[1]}`
        monthSet.add(key)
      }
    })
  })

  return Array.from(monthSet)
    .sort()
    .reverse()
    .map(key => {
      const [year, month] = key.split('-')
      const monthIndex = parseInt(month, 10) - 1
      return {
        value: key,
        label: `${MONTH_NAMES[monthIndex]} ${year}`,
      }
    })
}

/**
 * Convert month key ("YYYY-MM") to a DateRange
 */
function formatLocalDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function monthKeyToDateRange(key: string): DateRange {
  const [year, month] = key.split('-').map(Number)
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0)

  return {
    startDate: formatLocalDate(startDate),
    endDate: formatLocalDate(endDate),
    preset: 'this-month',
  }
}

/**
 * Get the month key from a DateRange
 */
function dateRangeToMonthKey(range: DateRange): string {
  if (range.startDate) {
    // Parse YYYY-MM-DD directly to avoid timezone issues
    const parts = range.startDate.split('-')
    if (parts.length >= 2) return `${parts[0]}-${parts[1]}`
  }
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

/**
 * Month/Year selector for the attendance table
 */
export function DateRangeSelector({ value, onChange, records }: DateRangeSelectorProps) {
  const months = React.useMemo(() => getAvailableMonths(records), [records])
  const currentKey = dateRangeToMonthKey(value)

  const handleChange = React.useCallback(
    (key: string) => {
      onChange(monthKeyToDateRange(key))
    },
    [onChange],
  )

  // Auto-select the most recent month if current selection doesn't match available months
  React.useEffect(() => {
    if (months.length > 0 && !months.some(m => m.value === currentKey)) {
      onChange(monthKeyToDateRange(months[0].value))
    }
  }, [months, currentKey, onChange])

  if (months.length === 0) return null

  return (
    <Select value={currentKey} onValueChange={handleChange}>
      <SelectTrigger className="h-8 w-[130px] bg-accent text-foreground border-0 hover:bg-accent/80">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {months.map(month => (
          <SelectItem key={month.value} value={month.value}>
            {month.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
