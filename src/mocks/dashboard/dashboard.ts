import { GraduationCap, Users, UserCog, Award } from 'lucide-react'
import { status } from '@/theme/colors'
import type {
  DashboardStat,
  PerformanceDataset,
  EarningsDataset,
  GenderDataset,
  AttendanceDataset,
  CalendarEvent,
  TodoItem,
} from '@/features/dashboard/types'
import { relativeDate } from '@/mocks/_shared/date-helpers'
import { studentCount, listStudents } from '@/mocks/students'
import { teachersData } from '@/mocks/teachers/teachers'
import { SCHOOL_SCALE } from '@/mocks/_shared/constants'
import { loadSchoolConfig } from '@/api/services/school-config-service'
import { getUniqueGrades } from '@/utils/class-section-helpers'

/**
 * Single source of truth for enrolment counts. Every widget on the Dashboard
 * (stat tiles, gender donut, attendance bars) derives its numbers from these
 * so the Grade-9 total can never exceed total enrolment, attendance can
 * never exceed total enrolment, etc.
 */
const TOTAL_ENROLLMENT = studentCount()
const DAILY_PRESENT_AVG = Math.round(TOTAL_ENROLLMENT * SCHOOL_SCALE.attendanceRate)

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
    iconBg: 'var(--primary)',
    iconColor: 'var(--primary-foreground)',
  },
  {
    id: 'active-teachers',
    label: 'Active Teachers',
    value: teachersData.length,
    icon: Users,
    iconBg: 'var(--accent)',
    iconColor: 'var(--accent-foreground)',
  },
  {
    id: 'support-staff',
    label: 'Support Staff',
    value: 34,
    icon: UserCog,
    iconBg: 'var(--primary)',
    iconColor: 'var(--primary-foreground)',
  },
  {
    id: 'total-awards',
    label: 'Total Awards',
    value: 152,
    icon: Award,
    iconBg: 'var(--accent)',
    iconColor: 'var(--accent-foreground)',
  },
]

// ---------------------------------------------------------------------------
// Grade-keyed datasets (performance, gender) are generated from the live
// school config so admin-configured grades always appear in the selectors
// rather than a hardcoded 7/8/9 slice. Services call the generator functions
// at request time; a stale module-level export would miss config changes
// made after page load.
// ---------------------------------------------------------------------------

/** Colors cycled through grade series so bars/cells always have distinct hues. */
const GRADE_PALETTE = ['var(--accent)', 'var(--primary)', 'var(--heading)'] as const

/** Tints cycled through the SECTIONS of a single grade (so 7A/7B/7C read apart
 *  from each other without colliding with the other grade's colour). */
const SECTION_PALETTE = ['var(--accent)', 'var(--primary)', 'var(--heading)'] as const

/** Deterministic pseudo-random 0..1 from a seed string (stable across reloads). */
function seededFraction(seed: string): number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619)
  return ((h >>> 0) % 1000) / 1000
}

/** Nice performance number for any series/month: 55..95%. */
function performanceFor(seriesKey: string, month: string): number {
  return Math.round(55 + seededFraction(`${seriesKey}|${month}`) * 40)
}

/**
 * Build performance datasets (Last Semester / Current) for the grades the
 * admin has configured.
 *
 * Each data row carries BOTH grade-level averages (key `grade{N}`) AND
 * per-section values (key `{sectionLabel}`, e.g. `"9A"`, `"9B"`).
 *
 *   Row → { month: "May", grade7: 78, "7A": 82, "7B": 74, grade9: 71, ... }
 *
 * - `grade{N}` values are the *average* of that grade's section values for
 *   the same month, so grade-level bars align with what a drilled-down
 *   section view would sum to.
 * - `GradeConfig.sections` advertises the available drill-downs so the
 *   chart can map a user's section pick back to the right data keys.
 */
export function buildPerformanceDatasets(): PerformanceDataset[] {
  const config = loadSchoolConfig()
  const grades = getUniqueGrades(config.classSections)

  // Pre-compute the sections-for-grade map once so we don't re-scan per row.
  const sectionsByGrade = new Map<string, string[]>()
  grades.forEach(g => {
    sectionsByGrade.set(
      g,
      config.classSections.filter(s => s.grade === g).map(s => s.label),
    )
  })

  const toSeries = (monthList: string[]): PerformanceDataset['data'] =>
    monthList.map(month => {
      const row: Record<string, number | string> = { month }
      grades.forEach(g => {
        const sections = sectionsByGrade.get(g) ?? []
        if (sections.length === 0) {
          row[`grade${g}`] = performanceFor(g, month)
          return
        }
        // Fill per-section values first, then average them for the grade-level
        // series. This keeps the two views consistent (grade bar == mean of
        // its section bars).
        let total = 0
        sections.forEach(label => {
          const val = performanceFor(label, month)
          row[label] = val
          total += val
        })
        row[`grade${g}`] = Math.round(total / sections.length)
      })
      return row as PerformanceDataset['data'][number]
    })

  const gradeDefs = grades.map((g, i) => {
    const sectionLabels = sectionsByGrade.get(g) ?? []
    return {
      key: `grade${g}`,
      label: `Grade ${g}`,
      color: GRADE_PALETTE[i % GRADE_PALETTE.length],
      sections: sectionLabels.map((label, si) => ({
        key: label,
        label: `Class ${label}`,
        color: SECTION_PALETTE[(i + si) % SECTION_PALETTE.length],
      })),
    }
  })

  return [
    {
      label: 'Last Semester',
      value: 'last-semester',
      grades: gradeDefs,
      data: toSeries(['May', 'Jun', 'Jul', 'Aug', 'Sep']),
    },
    {
      label: 'Current',
      value: 'current',
      grades: gradeDefs,
      data: toSeries(['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar']),
    },
  ]
}

/**
 * Module-level export kept for backwards compatibility with anything that
 * imports `performanceDatasets` directly. Services should call
 * `buildPerformanceDatasets()` each request to pick up live config changes.
 */
export const performanceDatasets: PerformanceDataset[] = buildPerformanceDatasets()

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

/**
 * Build gender datasets for every grade the admin has configured.
 *
 * Counted off the directory, one grade at a time. It used to be an average
 * cohort size times a per-grade jitter factor — invented numbers that added
 * up to an invented total, so the Grade 8 donut and the Grade 8 register
 * described different schools. A grade with nobody enrolled now reads as zero,
 * which is the truth about a section the school has configured and not filled.
 */
export function buildGenderDatasets(): GenderDataset[] {
  const config = loadSchoolConfig()
  const grades = getUniqueGrades(config.classSections)
  const roster = listStudents()
  return grades.map(grade => {
    const cohort = roster.filter(student => String(student.gradeLevel) === grade)
    const boys = cohort.filter(student => student.gender === 0).length
    const girls = cohort.length - boys
    return {
      label: `Grade ${grade}`,
      value: `grade-${grade}`,
      data: [
        { label: 'Boys', value: boys, color: 'var(--heading)' },
        { label: 'Girls', value: girls, color: 'var(--primary)' },
      ],
    }
  })
}

/** Backwards-compatible module-level export. Prefer the builder in services. */
export const genderDatasets: GenderDataset[] = buildGenderDatasets()

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
    bgColor: 'var(--primary)',
  },
  {
    id: 'evt-2',
    date: 'March 5',
    startTime: '02:00 PM',
    endTime: '01:55 PM',
    title: 'Parent-Teacher Meeting',
    subtitle: 'Gr. 3A, 5B',
    color: status.info.base,
    bgColor: 'var(--primary)',
  },
  {
    id: 'evt-3',
    date: 'March 28',
    startTime: '09:00 AM',
    endTime: '05:00 PM',
    title: 'Annual Science Fair',
    subtitle: 'All Classes',
    color: status.warning.base,
    bgColor: 'var(--primary)',
  },
  {
    id: 'evt-4',
    date: 'April 10',
    startTime: '10:00 AM',
    endTime: '01:00 PM',
    title: 'Inter-School Debate',
    subtitle: 'Grade 8 & 9',
    color: status.info.base,
    bgColor: 'var(--primary)',
  },
  {
    id: 'evt-5',
    date: 'April 22',
    startTime: '08:00 AM',
    endTime: '03:00 PM',
    title: 'Earth Day Celebration',
    subtitle: 'All Classes',
    color: status.success.base,
    bgColor: 'var(--primary)',
  },
  {
    id: 'evt-6',
    date: 'February 14',
    startTime: '09:00 AM',
    endTime: '12:00 PM',
    title: 'Art Exhibition',
    subtitle: 'All Classes',
    color: status.warning.base,
    bgColor: 'var(--primary)',
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

