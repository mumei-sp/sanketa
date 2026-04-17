import { GraduationCap, Users, UserCog, Award } from 'lucide-react'
import { baseColors, status } from '@/theme/colors'
import type {
  DashboardStat,
  PerformanceDataset,
  EarningsDataset,
  GenderDataset,
  AttendanceDataset,
  CalendarEvent,
  TodoItem,
  RecentActivityItem,
} from '@/features/dashboard/types'
import { relativeDate, displayDate } from '@/mocks/_shared/date-helpers'
import { studentsData } from '@/mocks/students/students'
import { teachersData } from '@/mocks/teachers/teachers'
import { SCHOOL_SCALE } from '@/mocks/_shared/constants'

/**
 * Single source of truth for enrolment counts. Every widget on the Dashboard
 * (stat tiles, gender donut, attendance bars) derives its numbers from these
 * so the Grade-9 total can never exceed total enrolment, attendance can
 * never exceed total enrolment, etc.
 */
const TOTAL_ENROLLMENT = studentsData.length * SCHOOL_SCALE.enrollmentMultiplier
const AVG_PER_GRADE = Math.round(TOTAL_ENROLLMENT / SCHOOL_SCALE.gradeCount)
const DAILY_PRESENT_AVG = Math.round(TOTAL_ENROLLMENT * SCHOOL_SCALE.attendanceRate)

/** Split a grade cohort into boys/girls with a small offset from 50/50. */
function gradeGenderSplit(total: number, boysPct = 0.5) {
  const boys = Math.round(total * boysPct)
  const girls = total - boys
  return { boys, girls }
}

/** Format an absolute-date activity timestamp like "Apr 14, 2026 – 09:15 AM". */
function activityTimestamp(daysAgo: number, hh: number, mm: number, ampm: 'AM' | 'PM'): string {
  const d = relativeDate(-daysAgo)
  const dateStr = displayDate(d)
  const h = String(hh).padStart(2, '0')
  const m = String(mm).padStart(2, '0')
  return `${dateStr} – ${h}:${m} ${ampm}`
}

/** Verbose "March 11, 2035" style date used by todos on the Dashboard. */
function verboseDate(daysFromToday: number): string {
  const d = relativeDate(daysFromToday)
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export const dashboardStats: DashboardStat[] = [
  {
    id: 'enrolled-students',
    label: 'Enrolled Students',
    value: TOTAL_ENROLLMENT,
    icon: GraduationCap,
    iconBg: baseColors.pink,
    iconColor: baseColors.heading,
  },
  {
    id: 'active-teachers',
    label: 'Active Teachers',
    value: teachersData.length * SCHOOL_SCALE.facultyMultiplier,
    icon: Users,
    iconBg: baseColors.blue,
    iconColor: baseColors.heading,
  },
  {
    id: 'support-staff',
    label: 'Support Staff',
    value: 34,
    icon: UserCog,
    iconBg: baseColors.pink,
    iconColor: baseColors.heading,
  },
  {
    id: 'total-awards',
    label: 'Total Awards',
    value: 152,
    icon: Award,
    iconBg: baseColors.blue,
    iconColor: baseColors.heading,
  },
]

export const performanceDatasets: PerformanceDataset[] = [
  {
    label: 'Last Semester',
    value: 'last-semester',
    grades: [
      { key: 'grade7', label: 'Grade 7', color: baseColors.blue },
      { key: 'grade8', label: 'Grade 8', color: baseColors.pink },
      { key: 'grade9', label: 'Grade 9', color: baseColors.heading },
    ],
    data: [
      { month: 'May', grade7: 65, grade8: 70, grade9: 82 },
      { month: 'Jun', grade7: 55, grade8: 60, grade9: 97 },
      { month: 'Jul', grade7: 45, grade8: 40, grade9: 60 },
      { month: 'Aug', grade7: 75, grade8: 85, grade9: 78 },
      { month: 'Sep', grade7: 52, grade8: 56, grade9: 60 },
    ],
  },
  {
    label: 'Current',
    value: 'current',
    grades: [
      { key: 'grade7', label: 'Grade 7', color: baseColors.blue },
      { key: 'grade8', label: 'Grade 8', color: baseColors.pink },
      { key: 'grade9', label: 'Grade 9', color: baseColors.heading },
    ],
    data: [
      { month: 'Oct', grade7: 70, grade8: 75, grade9: 88 },
      { month: 'Nov', grade7: 68, grade8: 72, grade9: 85 },
      { month: 'Dec', grade7: 74, grade8: 78, grade9: 90 },
      { month: 'Jan', grade7: 62, grade8: 68, grade9: 82 },
      { month: 'Feb', grade7: 76, grade8: 80, grade9: 92 },
      { month: 'Mar', grade7: 71, grade8: 77, grade9: 87 },
    ],
  },
]

export const earningsDatasets: EarningsDataset[] = [
  {
    label: 'Last Year',
    value: 'last-year',
    data: [
      { month: 'Jan', earnings: 5200, expenses: 3400 },
      { month: 'Feb', earnings: 4800, expenses: 3100 },
      { month: 'Mar', earnings: 5100, expenses: 3500 },
      { month: 'Apr', earnings: 3800, expenses: 3000 },
      { month: 'May', earnings: 5600, expenses: 3200 },
      { month: 'Jun', earnings: 4200, expenses: 3800 },
      { month: 'Jul', earnings: 5500, expenses: 3100 },
      { month: 'Aug', earnings: 4600, expenses: 2900 },
    ],
  },
  {
    label: 'This Year',
    value: 'this-year',
    data: [
      { month: 'Jan', earnings: 5800, expenses: 3600 },
      { month: 'Feb', earnings: 5200, expenses: 3300 },
      { month: 'Mar', earnings: 5900, expenses: 3700 },
      { month: 'Apr', earnings: 4500, expenses: 3200 },
      { month: 'May', earnings: 6100, expenses: 3500 },
      { month: 'Jun', earnings: 4800, expenses: 4000 },
      { month: 'Jul', earnings: 6200, expenses: 3400 },
      { month: 'Aug', earnings: 5100, expenses: 3100 },
      { month: 'Sep', earnings: 5700, expenses: 3800 },
      { month: 'Oct', earnings: 6400, expenses: 3900 },
      { month: 'Nov', earnings: 5500, expenses: 3600 },
      { month: 'Dec', earnings: 6800, expenses: 4200 },
    ],
  },
]

// Each grade cohort is a slice of TOTAL_ENROLLMENT; the three grades shown
// here roughly sum to 3 × AVG_PER_GRADE and never exceed the total.
export const genderDatasets: GenderDataset[] = [
  {
    label: 'Grade 9',
    value: 'grade-9',
    data: (() => {
      const { boys, girls } = gradeGenderSplit(Math.round(AVG_PER_GRADE * 1.05), 0.48)
      return [
        { label: 'Boys', value: boys, color: baseColors.heading },
        { label: 'Girls', value: girls, color: baseColors.pink },
      ]
    })(),
  },
  {
    label: 'Grade 8',
    value: 'grade-8',
    data: (() => {
      const { boys, girls } = gradeGenderSplit(Math.round(AVG_PER_GRADE * 0.95), 0.52)
      return [
        { label: 'Boys', value: boys, color: baseColors.heading },
        { label: 'Girls', value: girls, color: baseColors.pink },
      ]
    })(),
  },
  {
    label: 'Grade 7',
    value: 'grade-7',
    data: (() => {
      const { boys, girls } = gradeGenderSplit(Math.round(AVG_PER_GRADE * 1.0), 0.5)
      return [
        { label: 'Boys', value: boys, color: baseColors.heading },
        { label: 'Girls', value: girls, color: baseColors.pink },
      ]
    })(),
  },
]

// Daily/weekly attendance counts derive from TOTAL_ENROLLMENT × attendance
// rate, with small per-day jitter so the bars aren't uniform. Values are
// clamped to never exceed total enrolment.
function attn(factor: number): number {
  return Math.min(TOTAL_ENROLLMENT, Math.round(DAILY_PRESENT_AVG * factor))
}

export const attendanceDatasets: AttendanceDataset[] = [
  {
    label: 'Weekly',
    value: 'weekly',
    data: [
      { day: 'Mon', count: attn(1.00) },
      { day: 'Tue', count: attn(0.92) },
      { day: 'Wed', count: attn(0.98) },
      { day: 'Thu', count: attn(0.95) },
      { day: 'Fri', count: attn(1.02) },
    ],
  },
  {
    label: 'Monthly',
    value: 'monthly',
    data: [
      { day: 'Week 1', count: attn(1.00) * 5 },
      { day: 'Week 2', count: attn(0.95) * 5 },
      { day: 'Week 3', count: attn(1.02) * 5 },
      { day: 'Week 4', count: attn(0.90) * 5 },
    ],
  },
]

export const calendarEvents: CalendarEvent[] = [
  {
    id: 'evt-1',
    date: 'March 2',
    startTime: '05:02 AM',
    endTime: '12:00 PM',
    title: 'Annual Sport Competition',
    subtitle: 'All Classes',
    color: status.danger.base,
    bgColor: baseColors.pink,
  },
  {
    id: 'evt-2',
    date: 'March 5',
    startTime: '02:00 PM',
    endTime: '01:55 PM',
    title: 'Parent-Teacher Meeting',
    subtitle: 'Gr. 3A, 5B',
    color: status.info.base,
    bgColor: baseColors.pink,
  },
  {
    id: 'evt-3',
    date: 'March 28',
    startTime: '09:00 AM',
    endTime: '05:00 PM',
    title: 'Annual Science Fair',
    subtitle: 'All Classes',
    color: status.warning.base,
    bgColor: baseColors.pink,
  },
  {
    id: 'evt-4',
    date: 'April 10',
    startTime: '10:00 AM',
    endTime: '01:00 PM',
    title: 'Inter-School Debate',
    subtitle: 'Grade 8 & 9',
    color: status.info.base,
    bgColor: baseColors.pink,
  },
  {
    id: 'evt-5',
    date: 'April 22',
    startTime: '08:00 AM',
    endTime: '03:00 PM',
    title: 'Earth Day Celebration',
    subtitle: 'All Classes',
    color: status.success.base,
    bgColor: baseColors.pink,
  },
  {
    id: 'evt-6',
    date: 'February 14',
    startTime: '09:00 AM',
    endTime: '12:00 PM',
    title: 'Art Exhibition',
    subtitle: 'All Classes',
    color: status.warning.base,
    bgColor: baseColors.pink,
  },
]

export const todoItems: TodoItem[] = [
  {
    id: 'todo-1',
    text: 'Review Teacher Attendance Records',
    date: verboseDate(-1),
    completed: true,
  },
  {
    id: 'todo-2',
    text: 'Prepare Science Fair Guidelines',
    date: verboseDate(2),
    completed: false,
  },
  {
    id: 'todo-3',
    text: 'Update Library Book Inventory',
    date: verboseDate(4),
    completed: false,
  },
]

export const recentActivityItems: RecentActivityItem[] = [
  {
    id: 'act-1',
    text: 'New student Alicia Gomez (Class 8B) enrolled by Registrar.',
    timestamp: activityTimestamp(1, 9, 15, 'AM'),
    dotColor: status.info.base,
    icon: 'user-plus',
    iconBg: baseColors.blue,
    iconColor: baseColors.heading,
  },
  {
    id: 'act-2',
    text: 'Attendance for Class 7A marked by Meera Iyengar.',
    timestamp: activityTimestamp(1, 11, 30, 'AM'),
    dotColor: status.success.base,
    icon: 'check-square',
    iconBg: baseColors.pink,
    iconColor: baseColors.heading,
  },
  {
    id: 'act-3',
    text: 'Monthly fee payments verified for Grade 9 students.',
    timestamp: activityTimestamp(2, 2, 45, 'PM'),
    dotColor: status.warning.base,
    icon: 'receipt',
    iconBg: baseColors.heading,
    iconColor: '#FFFFFF',
  },
  {
    id: 'act-4',
    text: 'Exam timetable for Term 2 updated by Academic Coordinator.',
    timestamp: activityTimestamp(3, 10, 20, 'AM'),
    dotColor: status.danger.base,
    icon: 'pencil',
    iconBg: baseColors.pink,
    iconColor: baseColors.heading,
  },
]
