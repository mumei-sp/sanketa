/**
 * Mock data for daily attendance marking feature
 *
 * Provides class rosters and pre-filled attendance submissions.
 * Replace with real API calls when backend is ready.
 */

import type {
  AttendanceEntry,
  AttendanceSubmission,
  ClassRosterStudent,
  MarkableAttendanceStatus,
} from '@/features/attendance/types'
import { DEFAULT_CLASS_SECTIONS } from '@/config/school-config'
import { fullName } from '@/mocks/_shared/fake'

// ============================================================================
// Class Rosters
// ============================================================================

const class9ARoster: ClassRosterStudent[] = [
  { id: 'stu-9a-01', name: 'Michael Chen', rollNumber: '01', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael' },
  { id: 'stu-9a-02', name: 'Sarah Kim', rollNumber: '02', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
  { id: 'stu-9a-03', name: 'David Roy', rollNumber: '03', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David' },
  { id: 'stu-9a-04', name: 'Emma Thomas', rollNumber: '04', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma' },
  { id: 'stu-9a-05', name: 'James Wilson', rollNumber: '05', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James' },
  { id: 'stu-9a-06', name: 'Priya Patel', rollNumber: '06', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya' },
  { id: 'stu-9a-07', name: 'Alex Johnson', rollNumber: '07', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex' },
  { id: 'stu-9a-08', name: 'Maria Garcia', rollNumber: '08', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria' },
  { id: 'stu-9a-09', name: 'Ryan Lee', rollNumber: '09', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ryan' },
  { id: 'stu-9a-10', name: 'Sophie Anderson', rollNumber: '10', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie' },
  { id: 'stu-9a-11', name: 'Daniel Brown', rollNumber: '11', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Daniel' },
  { id: 'stu-9a-12', name: 'Aisha Mohammed', rollNumber: '12', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aisha' },
  { id: 'stu-9a-13', name: 'Lucas Martinez', rollNumber: '13', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucas' },
  { id: 'stu-9a-14', name: 'Olivia Taylor', rollNumber: '14', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Olivia' },
  { id: 'stu-9a-15', name: 'Ethan Davis', rollNumber: '15', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ethan' },
]

const class8BRoster: ClassRosterStudent[] = [
  { id: 'stu-8b-01', name: 'Ava Clark', rollNumber: '01', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ava' },
  { id: 'stu-8b-02', name: 'Noah White', rollNumber: '02', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Noah' },
  { id: 'stu-8b-03', name: 'Isabella Hall', rollNumber: '03', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Isabella' },
  { id: 'stu-8b-04', name: 'Liam Young', rollNumber: '04', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Liam' },
  { id: 'stu-8b-05', name: 'Mia Allen', rollNumber: '05', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mia' },
  { id: 'stu-8b-06', name: 'Benjamin Scott', rollNumber: '06', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Benjamin' },
  { id: 'stu-8b-07', name: 'Charlotte King', rollNumber: '07', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlotte' },
  { id: 'stu-8b-08', name: 'Henry Wright', rollNumber: '08', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Henry' },
  { id: 'stu-8b-09', name: 'Amelia Lopez', rollNumber: '09', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amelia' },
  { id: 'stu-8b-10', name: 'Jack Hill', rollNumber: '10', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack' },
]

const class7ARoster: ClassRosterStudent[] = [
  { id: 'stu-7a-01', name: 'Harper Green', rollNumber: '01', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Harper' },
  { id: 'stu-7a-02', name: 'Elijah Adams', rollNumber: '02', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elijah' },
  { id: 'stu-7a-03', name: 'Abigail Baker', rollNumber: '03', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Abigail' },
  { id: 'stu-7a-04', name: 'William Nelson', rollNumber: '04', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=William' },
  { id: 'stu-7a-05', name: 'Emily Carter', rollNumber: '05', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily' },
  { id: 'stu-7a-06', name: 'Mason Mitchell', rollNumber: '06', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mason' },
  { id: 'stu-7a-07', name: 'Ella Perez', rollNumber: '07', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ella' },
  { id: 'stu-7a-08', name: 'Logan Roberts', rollNumber: '08', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Logan' },
  { id: 'stu-7a-09', name: 'Avery Turner', rollNumber: '09', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Avery' },
  { id: 'stu-7a-10', name: 'Jackson Phillips', rollNumber: '10', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jackson' },
  { id: 'stu-7a-11', name: 'Scarlett Campbell', rollNumber: '11', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Scarlett' },
  { id: 'stu-7a-12', name: 'Sebastian Parker', rollNumber: '12', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sebastian' },
]

/**
 * Build a deterministic roster for a class that has no hand-authored one.
 *
 * The school config defines every class section (1A through 10B); only three
 * of them were written out by hand here, so picking any other class in the
 * daily-attendance screen threw `Class "1A" not found`. Seeding off the class
 * label keeps each generated roster stable across reloads.
 */
function generateClassRoster(classLabel: string): ClassRosterStudent[] {
  const labelSeed = [...classLabel].reduce((acc, ch) => acc * 31 + ch.charCodeAt(0), 7)
  const size = 10 + (labelSeed % 6) // 10–15 students
  const slug = classLabel.toLowerCase()

  return Array.from({ length: size }, (_, i) => {
    const rollNumber = String(i + 1).padStart(2, '0')
    const name = fullName(labelSeed + i * 101)
    return {
      id: `stu-${slug}-${rollNumber}`,
      name,
      rollNumber,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
    }
  })
}

/**
 * All class rosters keyed by class ID.
 *
 * The three hand-authored rosters win; every other section in the school
 * config gets a generated one so no class in the picker is ever missing.
 */
export const classRosters: Record<string, ClassRosterStudent[]> = {
  ...Object.fromEntries(
    DEFAULT_CLASS_SECTIONS.map(section => [section.label, generateClassRoster(section.label)]),
  ),
  '9A': class9ARoster,
  '8B': class8BRoster,
  '7A': class7ARoster,
}

/** Available class IDs */
export const availableClasses = Object.keys(classRosters)

// ============================================================================
// Pre-filled Attendance Submissions (current month, generated at module load)
// ============================================================================

/** Helper to check if a date is a weekend */
function isWeekend(dateStr: string): boolean {
  const d = new Date(dateStr + 'T12:00:00')
  const day = d.getDay()
  return day === 0 || day === 6
}

/** Generate random entries for a class roster */
function generateRandomEntries(roster: ClassRosterStudent[]): AttendanceEntry[] {
  return roster.map(student => {
    const rand = Math.random()
    let status: MarkableAttendanceStatus = 'present'
    let note: string | undefined

    if (rand > 0.92) {
      status = 'absent'
      const reasons = ['Sick leave', 'Family emergency', 'Doctor appointment', 'Not feeling well']
      note = reasons[Math.floor(Math.random() * reasons.length)]
    } else if (rand > 0.85) {
      status = 'late'
      const reasons = ['Late bus', 'Traffic delay', 'Overslept', undefined]
      note = reasons[Math.floor(Math.random() * reasons.length)]
    }

    return { studentId: student.id, status, note }
  })
}

/**
 * Generate submissions for a class for every weekday of the current calendar
 * month up to today (inclusive). A couple of days are intentionally skipped
 * per class to simulate "not yet marked" entries — common in a real roster.
 */
function generateClassSubmissions(classId: string, roster: ClassRosterStudent[]): AttendanceSubmission[] {
  const submissions: AttendanceSubmission[] = []
  const teachers: Record<string, string> = {
    '9A': 'Priya Nair',
    '8B': 'Rahul Iyer',
    '7A': 'Meera Iyengar',
  }
  const teacher = teachers[classId] ?? 'Admin'

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() // 0-indexed
  const lastDay = now.getDate()
  const pad = (n: number) => String(n).padStart(2, '0')

  for (let day = 1; day <= lastDay; day++) {
    const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`
    if (isWeekend(dateStr)) continue

    // Preserve the "missing" pattern: skip a couple of days per class so the
    // history view has some unsubmitted rows to render.
    if (classId === '9A' && (day === 17 || day === 21)) continue
    if (classId === '8B' && day === 10) continue

    submissions.push({
      id: `sub-${classId}-${dateStr}`,
      classId,
      date: dateStr,
      entries: generateRandomEntries(roster),
      submittedBy: teacher,
      submittedAt: `${dateStr}T09:15:00`,
    })
  }

  return submissions
}

/** All pre-filled attendance submissions */
export const attendanceSubmissions: AttendanceSubmission[] = [
  ...generateClassSubmissions('9A', class9ARoster),
  ...generateClassSubmissions('8B', class8BRoster),
  ...generateClassSubmissions('7A', class7ARoster),
]

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Find an existing submission for a specific class and date
 * Returns null if not yet submitted
 */
export function getSubmissionForDate(
  classId: string,
  date: string,
): AttendanceSubmission | null {
  return attendanceSubmissions.find(s => s.classId === classId && s.date === date) ?? null
}

/**
 * Get all weekdays in a given month/year (for history table)
 */
export function getWeekdaysInMonth(year: number, month: number): string[] {
  const days: string[] = []
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    if (!isWeekend(dateStr)) {
      days.push(dateStr)
    }
  }

  return days
}
