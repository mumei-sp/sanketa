import type { AttendanceRecord, AttendanceStatus } from '@/pages/attendance/attendance-types'

/**
 * Generate date strings for the last N calendar days
 */
function getLastNDays(n: number): string[] {
  const dates: string[] = []
  const today = new Date()

  for (let i = n - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0] // YYYY-MM-DD format
    dates.push(dateStr)
  }

  return dates
}

/**
 * Check if a date is a weekend (Saturday or Sunday)
 */
function isWeekend(dateStr: string): boolean {
  const date = new Date(dateStr)
  const day = date.getDay()
  return day === 0 || day === 6 // Sunday = 0, Saturday = 6
}

/**
 * Generate a random attendance status with realistic probabilities
 */
function generateAttendanceStatus(isWeekendDay: boolean): AttendanceStatus {
  if (isWeekendDay) {
    return 'na' // Non-school days
  }

  // Realistic probabilities: 85% present, 8% late, 7% absent
  const rand = Math.random()
  if (rand < 0.85) return 'present'
  if (rand < 0.93) return 'late'
  return 'absent'
}

/**
 * Generate mock attendance data for the last N days
 */
export function generateMockAttendanceData(days: number = 10): AttendanceRecord[] {
  const dateRange = getLastNDays(days)
  const records: AttendanceRecord[] = []

  // Student names and IDs (mix of different classes)
  const studentData = [
    { id: '1', studentId: 'S-2102', name: 'Emma Williams', class: '9A', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma' },
    { id: '2', studentId: 'S-2105', name: 'Thomas Green', class: '9A', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Thomas' },
    { id: '3', studentId: 'S-2005', name: 'Sophie Martin', class: '9A', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie' },
    { id: '4', studentId: 'S-2108', name: 'Lucas Müller', class: '9A', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucas' },
    { id: '5', studentId: 'S-2110', name: 'Hannah Lee', class: '9A', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hannah' },
    { id: '6', studentId: 'S-2112', name: 'Daniel Park', class: '9A', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Daniel' },
    { id: '7', studentId: 'S-2115', name: 'Aisha Khan', class: '9A', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aisha' },
    { id: '8', studentId: 'S-2118', name: 'Matteo Ricci', class: '9A', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Matteo' },
    { id: '9', studentId: 'S-2120', name: 'Grace Johnson', class: '9A', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Grace' },
    { id: '10', studentId: 'S-2122', name: 'Omar Hassan', class: '9A', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Omar' },
    { id: '11', studentId: 'S-2201', name: 'Isabella Rodriguez', class: '8B', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Isabella' },
    { id: '12', studentId: 'S-2203', name: 'James Wilson', class: '8B', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James' },
    { id: '13', studentId: 'S-2205', name: 'Mia Anderson', class: '8B', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mia' },
    { id: '14', studentId: 'S-2207', name: 'Noah Brown', class: '8B', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Noah' },
    { id: '15', studentId: 'S-2209', name: 'Olivia Davis', class: '8B', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Olivia' },
    { id: '16', studentId: 'S-2211', name: 'Ethan Miller', class: '7A', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ethan' },
    { id: '17', studentId: 'S-2213', name: 'Ava Garcia', class: '7A', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ava' },
    { id: '18', studentId: 'S-2215', name: 'Liam Martinez', class: '7A', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Liam' },
  ]

  // Teacher names and IDs
  const teacherData = [
    { id: 't1', teacherId: 'T-1001', name: 'Dr. Sarah Johnson', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
    { id: 't2', teacherId: 'T-1002', name: 'Prof. Robert Smith', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Robert' },
    { id: 't3', teacherId: 'T-1003', name: 'Ms. Emily Brown', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily' },
    { id: 't4', teacherId: 'T-1004', name: 'Mr. David Lee', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David' },
    { id: 't5', teacherId: 'T-1005', name: 'Mrs. Jennifer White', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jennifer' },
  ]

  // Staff names and IDs
  const staffData = [
    { id: 's1', staffId: 'ST-2001', name: 'John Anderson', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=JohnStaff' },
    { id: 's2', staffId: 'ST-2002', name: 'Mary Thompson', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MaryStaff' },
    { id: 's3', staffId: 'ST-2003', name: 'Peter Wilson', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PeterStaff' },
    { id: 's4', staffId: 'ST-2004', name: 'Lisa Davis', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=LisaStaff' },
  ]

  // Generate student records
  studentData.forEach(student => {
    const attendance: Record<string, AttendanceStatus> = {}
    dateRange.forEach(dateStr => {
      const isWeekendDay = isWeekend(dateStr)
      // Add some variation - some students have better attendance
      const studentRand = Math.random()
      let status: AttendanceStatus

      if (isWeekendDay) {
        status = 'na'
      } else if (studentRand < 0.1) {
        // 10% chance of being absent on a school day
        status = 'absent'
      } else if (studentRand < 0.15) {
        // 5% chance of being late
        status = 'late'
      } else {
        status = 'present'
      }

      attendance[dateStr] = status
    })

    records.push({
      id: student.id,
      studentId: student.studentId,
      name: student.name,
      type: 'student',
      class: student.class,
      avatarUrl: student.avatarUrl,
      attendance,
    })
  })

  // Generate teacher records
  teacherData.forEach(teacher => {
    const attendance: Record<string, AttendanceStatus> = {}
    dateRange.forEach(dateStr => {
      const isWeekendDay = isWeekend(dateStr)
      const teacherRand = Math.random()
      let status: AttendanceStatus

      if (isWeekendDay) {
        status = 'na'
      } else if (teacherRand < 0.05) {
        // 5% chance of being absent
        status = 'absent'
      } else if (teacherRand < 0.08) {
        // 3% chance of being late
        status = 'late'
      } else {
        status = 'present'
      }

      attendance[dateStr] = status
    })

    records.push({
      id: teacher.id,
      teacherId: teacher.teacherId,
      name: teacher.name,
      type: 'teacher',
      avatarUrl: teacher.avatarUrl,
      attendance,
    })
  })

  // Generate staff records
  staffData.forEach(staff => {
    const attendance: Record<string, AttendanceStatus> = {}
    dateRange.forEach(dateStr => {
      const isWeekendDay = isWeekend(dateStr)
      const staffRand = Math.random()
      let status: AttendanceStatus

      if (isWeekendDay) {
        status = 'na'
      } else if (staffRand < 0.08) {
        // 8% chance of being absent
        status = 'absent'
      } else if (staffRand < 0.12) {
        // 4% chance of being late
        status = 'late'
      } else {
        status = 'present'
      }

      attendance[dateStr] = status
    })

    records.push({
      id: staff.id,
      staffId: staff.staffId,
      name: staff.name,
      type: 'staff',
      avatarUrl: staff.avatarUrl,
      attendance,
    })
  })

  return records
}

/**
 * Mock attendance data for development and testing
 * TODO: Replace with real API calls when backend is ready
 */
export const attendanceData: AttendanceRecord[] = generateMockAttendanceData(21)

