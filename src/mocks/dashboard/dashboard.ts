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
import { studentCount, listStudents } from '@/mocks/students'
import { tenantFixtures } from '@/mocks/tenants'
import { feeTrendData } from '@/mocks/fees/fees'
import { expenseTrendData } from '@/mocks/expenses/expenses'
import { teachersData } from '@/mocks/teachers/teachers'
import { SCHOOL_SCALE } from '@/mocks/_shared/constants'
import { loadSchoolConfig } from '@/api/services/school-config-service'
import { MONTH_SHORT_LABELS } from '@/config/school-config'
import { getUniqueGrades } from '@/utils/class-section-helpers'

/**
 * Single source of truth for enrolment counts. Every widget on the Dashboard
 * (stat tiles, gender donut, attendance bars) derives its numbers from these
 * so the Grade-9 total can never exceed total enrolment, attendance can
 * never exceed total enrolment, etc.
 */
const TOTAL_ENROLLMENT = studentCount()
const DAILY_PRESENT_AVG = Math.round(TOTAL_ENROLLMENT * SCHOOL_SCALE.attendanceRate)

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

/**
 * Money in against money out, by month.
 *
 * ── What this replaced ─────────────────────────────────────────────────
 * Twenty hardcoded pairs — ₹5,200 of earnings in January against ₹3,400 of
 * expenses — for a school that collects over a crore a term and pays out
 * ₹18 lakh a month in salaries. Three orders of magnitude out, and unrelated
 * to either the fee ledger or the expense ledger it sat between on the same
 * dashboard. "This Year" also ran January to December, so two thirds of the
 * line was months that have not happened.
 *
 * Both series are read off the two ledgers now. The dashboard's earnings line
 * and the finance page's collection total are the same money.
 */
/**
 * Both sides, month by month, from the start of the academic year to now.
 *
 * April onward, because that is the year a school keeps its accounts in and
 * the one `academicYearStartMonth` declares — and because the chart orders
 * its axis that way. Handing it the last eight *calendar* months put February
 * and March on the right-hand end, after September, reading as the future
 * when they were in fact the tail of the previous year.
 *
 * The shape is the real one and worth keeping: fees arrive in three lumps as
 * the terms are billed, while salaries and the standing contracts go out
 * level every month. A school's cash position swinging like that is why it
 * has a chart at all.
 */
function earningsSeries(scale: number): { month: string; earnings: number; expenses: number }[] {
  const feesByMonth = new Map(feeTrendData.map(row => [row.month, row.amount]))
  const expensesByMonth = new Map(expenseTrendData.map(row => [row.month, row.amount]))
  const now = new Date()
  const startMonth = loadSchoolConfig().academicYearStartMonth
  const monthsElapsed = ((now.getMonth() - startMonth + 12) % 12) + 1

  return Array.from({ length: monthsElapsed }, (_, i) => {
    const label = MONTH_SHORT_LABELS[(startMonth + i) % 12]
    return {
      month: label,
      // Whole rupees. Passing thousands and letting the axis append its own
      // "K" labelled ₹62 lakh as ₹6K — the chart was reporting a school's
      // month in the low thousands of rupees.
      earnings: Math.round((feesByMonth.get(label) ?? 0) * scale),
      expenses: Math.round((expensesByMonth.get(label) ?? 0) * scale),
    }
  })
}

export const earningsDatasets: EarningsDataset[] = [
  {
    label: 'Last Year',
    value: 'last-year',
    // A school that grew: last year's intake was smaller, so last year's fees
    // and last year's salary bill were both lower.
    data: earningsSeries(0.91),
  },
  {
    label: 'This Year',
    value: 'this-year',
    data: earningsSeries(1),
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

/**
 * The dashboard's little calendar strip.
 *
 * Built from the school's own calendar rather than kept as a third list of
 * occasions. It was one: six events dated "March 2", "April 10" and
 * "February 14", which agreed neither with the calendar page's fifteen nor
 * with each other's year, and were the same six at both schools.
 *
 * Only what is still to come, soonest first, because the strip is a
 * what's-next and not an archive.
 */
export const calendarEvents: CalendarEvent[] = (() => {
  const palette = [status.info.base, status.warning.base, status.success.base, status.danger.base]
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return tenantFixtures()
    .calendar.filter(event => new Date(event.start) >= today)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .slice(0, 6)
    .map((event, index) => {
      const when = new Date(event.start)
      const props = event.extendedProps
      return {
        id: `dash-${event.id}`,
        date: when.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
        startTime: props?.startTimeDisplay ?? '',
        endTime: props?.endTimeDisplay ?? '',
        title: event.title,
        // Who it is for, which is what the strip has room for.
        subtitle: props?.attendees ?? props?.location ?? '',
        color: palette[index % palette.length],
        bgColor: 'var(--primary)',
      }
    })
})()

/**
 * The office's list.
 *
 * The school's own — Vidya Mandir's is about the Dasara roster and the half
 * yearly marks, not Kendriya's science fair — and dated relative to today, so
 * it is never three items all overdue.
 */
export const todoItems: TodoItem[] = tenantFixtures().todos.map(item => ({ ...item }))

