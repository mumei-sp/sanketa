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
import { studentsData } from '@/mocks/students/students'
import { classSectionOf, rollNumberOf } from '@/utils/class-section-helpers'
import { getDisplayName } from '@/features/students/utils/formatting'
import { fullName } from '@/mocks/_shared/fake'

// ============================================================================
// Class Rosters
// ============================================================================




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
 * All class rosters keyed by class label.
 *
 * Built from the student directory, not invented alongside it. Three rosters
 * used to be written out by hand and the rest generated, which meant the
 * attendance and grade screens described a school of 196 people, none of whom
 * appeared on the students page — the two screens were about different
 * populations, and every row carried an id (`stu-9a-01`) that pointed at
 * nothing.
 *
 * That was survivable while the rosters were only ever read by a teacher
 * looking at a class. It stops being survivable the moment a rule is written
 * about a *particular student*: a parent narrowed to their own child matches
 * no roster row at all, so their register comes back empty and the filter
 * looks like it worked.
 *
 * So a roster row is now a student record, carrying `Student.id` — the same
 * key `student_parents` links on and the same one a family's scope holds.
 *
 * Classes with nobody enrolled still get a generated roster, because the
 * picker offers every section the school defines and an empty register is a
 * worse answer than a filler one. Generated rows keep their `stu-<class>-NN`
 * ids, which deliberately cannot match a student id: nobody's child is in a
 * filler class, and a scope should never match one.
 */
function rosterFromDirectory(classLabel: string): ClassRosterStudent[] {
  return studentsData
    .filter(student => classSectionOf(student) === classLabel)
    .map((student, index) => {
      const name = getDisplayName(student)
      return {
        id: String(student.id),
        name,
        // Just the number. A record's roll number reads `07A-15`, while a
        // generated roster's reads `01`, so a register showed two formats in
        // one column depending on whether the class had anyone in it — and
        // sorted them lexically.
        rollNumber: rollNumberOf(student.rollNumber) ?? String(index + 1).padStart(2, '0'),
        avatarUrl:
          student.profilePictureUrl ??
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      }
    })
}

export const classRosters: Record<string, ClassRosterStudent[]> = Object.fromEntries(
  DEFAULT_CLASS_SECTIONS.map(section => {
    const enrolled = rosterFromDirectory(section.label)
    return [section.label, enrolled.length > 0 ? enrolled : generateClassRoster(section.label)]
  }),
)

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
  // The same three classes as before, now filled from whoever is actually
  // enrolled in them rather than from a parallel cast.
  ...generateClassSubmissions('9A', classRosters['9A'] ?? []),
  ...generateClassSubmissions('8B', classRosters['8B'] ?? []),
  ...generateClassSubmissions('7A', classRosters['7A'] ?? []),
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
