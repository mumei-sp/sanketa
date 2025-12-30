import * as React from 'react'
import type { AttendanceTableData, AttendanceRecordType, DateRange } from '../types'
import { isDateInRange, getDefaultDateRange } from '@/utils/date'

/**
 * Get unique classes from student records
 */
function getUniqueClasses(records: AttendanceTableData[]): string[] {
  const classes = new Set<string>()
  records
    .filter(r => r.type === 'student' && r.class)
    .forEach(r => {
      if (r.class) classes.add(r.class)
    })
  return Array.from(classes).sort()
}

/**
 * Hook for managing attendance table filters
 */
export function useAttendanceFilters(data: AttendanceTableData[]) {
  const [typeFilter, setTypeFilter] = React.useState<AttendanceRecordType>('student')
  const [classFilter, setClassFilter] = React.useState<string>('all')
  const [dateRangeFilter, setDateRangeFilter] = React.useState<DateRange>(() =>
    getDefaultDateRange(),
  )

  // Filter data based on type, class, and date range
  const filteredData = React.useMemo(() => {
    let filtered = data

    // Filter by type
    filtered = filtered.filter(record => record.type === typeFilter)

    // Filter by class (for students only)
    if (classFilter !== 'all') {
      filtered = filtered.filter(record => {
        if (record.type !== 'student') return false
        return record.class === classFilter
      })
    }

    // Filter by date range
    filtered = filtered
      .map(record => {
        const filteredAttendance: Record<string, AttendanceTableData['attendance'][string]> = {}
        Object.keys(record.attendance).forEach(dateStr => {
          if (isDateInRange(dateStr, dateRangeFilter)) {
            filteredAttendance[dateStr] = record.attendance[dateStr]
          }
        })
        return {
          ...record,
          attendance: filteredAttendance,
        }
      })
      .filter(record => Object.keys(record.attendance).length > 0)

    return filtered
  }, [data, typeFilter, classFilter, dateRangeFilter])

  const uniqueClasses = React.useMemo(() => getUniqueClasses(data), [data])

  return {
    typeFilter,
    setTypeFilter,
    classFilter,
    setClassFilter,
    dateRangeFilter,
    setDateRangeFilter,
    filteredData,
    uniqueClasses,
  }
}

