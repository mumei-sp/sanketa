import type { AttendanceRecord, AttendanceRecordType } from '../types'

/**
 * Statistics for a single attendance type (student/teacher/staff)
 */
export interface AttendanceStatistics {
  /** Total number of people present (present + late) */
  totalPresent: number
  /** Number of people on-time */
  onTime: number
  /** Number of people late */
  late: number
  /** Number of people absent */
  absent: number
  /** Overall attendance percentage */
  attendancePercentage: number
  /** On-time percentage */
  onTimePercentage: number
  /** Late percentage */
  latePercentage: number
  /** Absent percentage */
  absentPercentage: number
}

/**
 * Calculate attendance statistics for a given type and date
 */
export function calculateAttendanceStatistics(
  records: AttendanceRecord[],
  type: AttendanceRecordType,
  date: string,
): AttendanceStatistics {
  // Filter records by type
  const filteredRecords = records.filter(record => record.type === type)

  if (filteredRecords.length === 0) {
    return {
      totalPresent: 0,
      onTime: 0,
      late: 0,
      absent: 0,
      attendancePercentage: 0,
      onTimePercentage: 0,
      latePercentage: 0,
      absentPercentage: 0,
    }
  }

  let totalOnTime = 0
  let totalLate = 0
  let totalAbsent = 0
  let totalRecords = 0

  // Iterate through each record
  filteredRecords.forEach(record => {
    // Get attendance status for the selected date
    const status = record.attendance[date]

    // Skip if no data for this date or status is 'na'
    if (!status || status === 'na') {
      return
    }

    totalRecords++

    // Count by status
    switch (status) {
      case 'present':
        totalOnTime++
        break
      case 'late':
        totalLate++
        break
      case 'absent':
        totalAbsent++
        break
    }
  })

  const totalPresent = totalOnTime + totalLate
  const total = totalOnTime + totalLate + totalAbsent

  // Calculate percentages
  const attendancePercentage = total > 0 ? (totalPresent / total) * 100 : 0
  const onTimePercentage = total > 0 ? (totalOnTime / total) * 100 : 0
  const latePercentage = total > 0 ? (totalLate / total) * 100 : 0
  const absentPercentage = total > 0 ? (totalAbsent / total) * 100 : 0

  return {
    totalPresent,
    onTime: totalOnTime,
    late: totalLate,
    absent: totalAbsent,
    attendancePercentage,
    onTimePercentage,
    latePercentage,
    absentPercentage,
  }
}

/**
 * Get all statistics for all types
 */
export function getAllAttendanceStatistics(
  records: AttendanceRecord[],
  date: string,
): {
  students: AttendanceStatistics
  teachers: AttendanceStatistics
  staff: AttendanceStatistics
} {
  return {
    students: calculateAttendanceStatistics(records, 'student', date),
    teachers: calculateAttendanceStatistics(records, 'teacher', date),
    staff: calculateAttendanceStatistics(records, 'staff', date),
  }
}

