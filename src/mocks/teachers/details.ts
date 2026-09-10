import type { TeacherDetail, EmploymentType, ScheduleBlock, WorkloadDataPoint, TrainingEvent, LeaveRequest, PerformanceMetric, CalendarHighlight, MonthlyAttendance, TeacherDocument } from '@/features/teachers/types/teacher-detail'
import type { Teacher } from '@/features/teachers/types'
import { teachersData } from './teachers'
import { relativeDisplay } from '@/mocks/_shared/date-helpers'
import { classTimetables, classSections } from '@/mocks/timetable/timetable'
import { DEFAULT_PERIODS, MONTH_SHORT_LABELS } from '@/config/school-config'

// ── Seed-based helpers (deterministic per teacher) ──────────────────────────

function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

function pick<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)]
}

function randInt(min: number, max: number, rand: () => number): number {
  return Math.floor(rand() * (max - min + 1)) + min
}

// ── Pools of varied data ────────────────────────────────────────────────────

/**
 * Where the staff live.
 *
 * These used to be 45 Jalan Sudirman in Jakarta, 2218 Baker Street in London,
 * 78 Rue de Rivoli in Paris and 101 Rajadamri Road in Bangkok — ten addresses,
 * none of them in the city the school is in, dealt round the faculty. The
 * teachers commute in from the localities anyone teaching in Bengaluru
 * commutes in from.
 */
const ADDRESSES = [
  '14, 2nd Cross, Basavanagudi, Bengaluru, Karnataka 560004, India',
  '208, 5th Main Road, Jayanagar, Bengaluru, Karnataka 560041, India',
  '46, 11th Cross, Rajajinagar, Bengaluru, Karnataka 560010, India',
  '7, Sampige Road, Malleshwaram, Bengaluru, Karnataka 560003, India',
  '112, 3rd Block, Banashankari, Bengaluru, Karnataka 560070, India',
  '89, 8th Cross, Vijayanagar, Bengaluru, Karnataka 560040, India',
  'Flat 402, Nandi Enclave, J. P. Nagar, Bengaluru, Karnataka 560078, India',
  '33, 4th Cross, R. T. Nagar, Bengaluru, Karnataka 560032, India',
  '19, Attur Layout, Yelahanka, Bengaluru, Karnataka 560064, India',
  '76, BEML Layout, Kengeri, Bengaluru, Karnataka 560060, India',
]

/**
 * The employment column, off the faculty row.
 *
 * It used to be dealt from a rotation of ten values here, which disagreed with
 * the counts on the Teachers dashboard by construction: a teacher the
 * dashboard counted as full-time could open as a substitute, and neither
 * screen was wrong on its own.
 */
function employmentOf(teacher: Teacher): EmploymentType {
  return teacher.employmentType ?? 'Full-Time'
}

// Training events: a mix of upcoming (positive offsets) and completed (negative),
// dated relative to today so the detail view always has plausible recent history.
const TRAINING_POOL: Omit<TrainingEvent, 'id'>[] = [
  { event: 'Digital Learning Tools Training', type: 'Training', date: relativeDisplay(20), location: 'Zoom – International Education Network', status: 'Upcoming' },
  { event: 'CBSE Capacity Building Programme', type: 'Certification', date: relativeDisplay(-60), location: 'CBSE Regional Office, Bengaluru', status: 'Completed' },
  { event: 'NEP 2020 Pedagogy Orientation', type: 'Workshop', date: relativeDisplay(-90), location: 'DSERT, Bengaluru', status: 'Completed' },
  { event: 'Inclusive Education Practices', type: 'Workshop', date: relativeDisplay(35), location: 'NIEPMD – Online', status: 'Upcoming' },
  { event: 'Student Assessment Strategies', type: 'Seminar', date: relativeDisplay(55), location: 'Azim Premji University, Bengaluru', status: 'Upcoming' },
  { event: 'Curriculum Design Fundamentals', type: 'Training', date: relativeDisplay(-200), location: 'IIT Bombay – NPTEL', status: 'Completed' },
  { event: 'Child Psychology in Education', type: 'Seminar', date: relativeDisplay(-170), location: 'NIMHANS, Bengaluru', status: 'Completed' },
  { event: 'Data-Driven Instruction Workshop', type: 'Workshop', date: relativeDisplay(-140), location: 'Regional Institute of Education, Mysuru', status: 'Completed' },
  { event: 'First Aid & Safety Certification', type: 'Certification', date: relativeDisplay(-240), location: 'Red Cross – Bangalore Chapter', status: 'Completed' },
]

const LEAVE_REASONS = [
  'Fever and medical rest advised by doctor',
  'Family emergency requiring immediate attention',
  'Scheduled medical procedure and recovery',
  'Personal day for family obligations',
]

const LEAVE_TYPES = ['Sick Leave', 'Personal Leave', 'Medical Leave', 'Family Leave']

const DAYS: ScheduleBlock['day'][] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const SCHEDULE_VARIANTS: ScheduleBlock['variant'][] = ['accent', 'dark', 'primary']

// ── Generator functions ─────────────────────────────────────────────────────

/**
 * A file size that does not change on every render.
 *
 * These were `Math.random()`, so the same document was 2.9 MB and then 3.4 MB
 * between two views of one teacher.
 */
function sized(teacher: Teacher, slot: number): string {
  const rand = seededRandom(parseInt(String(teacher.id)) * 31 + slot)
  return (1 + rand() * 3).toFixed(1)
}

function generateDocuments(teacher: Teacher): TeacherDocument[] {
  const name = (teacher.displayName || teacher.fullName || 'Teacher').replace(/\s+/g, '')
  return [
    { id: 'd1', name: `Employment_Contract_${name}_${teacher.teacherId}.pdf`, type: 'PDF', size: `${sized(teacher, 1)} MB` },
    { id: 'd2', name: `Certification_${teacher.subject.split(' - ')[0].replace(/\s+/g, '')}_${name}.pdf`, type: 'PDF', size: `${sized(teacher, 2)} MB` },
    { id: 'd3', name: `Aadhaar_${name}_Redacted.pdf`, type: 'PDF', size: `${sized(teacher, 3)} MB` },
  ]
}

/**
 * A teacher's week, read out of the timetable.
 *
 * It used to be invented here: three or four class codes drawn from a pool of
 * six — one of which, `9C`, is not a class the school has — scattered over
 * four to six random hours a day. So a teacher's own schedule and the
 * timetable of the class they teach were about different weeks, and the two
 * screens could be opened side by side to see it. Now there is a timetable for
 * every class, so this is a filter, not a fiction.
 *
 * The schedule grid is hour-based and periods are forty-five minutes, so the
 * six teaching periods map onto 8:00 through 13:00 in order. That loses the
 * quarter-hours; it does not lose who is teaching whom.
 */
const PERIOD_HOUR = new Map(
  DEFAULT_PERIODS.filter(period => !period.isBreak).map((period, index) => [period.id, 8 + index]),
)

const SECTION_LABEL = new Map(classSections.map(section => [section.id, section.label]))

/** Cycled so adjacent cells in the grid read apart from each other. */
const VARIANT_BY_SUBJECT = new Map<string, ScheduleBlock['variant']>()
function variantFor(subjectId: string): ScheduleBlock['variant'] {
  const existing = VARIANT_BY_SUBJECT.get(subjectId)
  if (existing) return existing
  const variant = SCHEDULE_VARIANTS[VARIANT_BY_SUBJECT.size % SCHEDULE_VARIANTS.length]
  VARIANT_BY_SUBJECT.set(subjectId, variant)
  return variant
}

function scheduleFor(teacher: Teacher): ScheduleBlock[] {
  return classTimetables.flatMap(timetable =>
    timetable.slots
      .filter(slot => slot.teacherId === teacher.teacherId)
      .flatMap(slot => {
        const day = DAYS[slot.dayOfWeek]
        const hour = PERIOD_HOUR.get(slot.periodId)
        const classCode = SECTION_LABEL.get(timetable.classSectionId)
        if (!day || hour === undefined || !classCode) return []
        return [{ day, hour, classCode, variant: variantFor(slot.subjectId) }]
      }),
  )
}

/** Just Wednesday, for the Daily view. */
function dailyScheduleFor(teacher: Teacher): ScheduleBlock[] {
  return scheduleFor(teacher).filter(block => block.day === 'Wed')
}

/**
 * The months a workload chart covers, ending with this one.
 *
 * The periods were hardcoded as April-to-November with "This month" as
 * November. It has not been November for ten months, so every teacher's
 * workload chart was labelled with somebody else's calendar.
 */
function recentMonths(count: number, base: Date = new Date()): string[] {
  return Array.from({ length: count }, (_, i) => {
    const index = (base.getMonth() - (count - 1 - i) + 12) % 12
    return MONTH_SHORT_LABELS[index]
  })
}

const WORKLOAD_SPANS: Record<string, number> = {
  'Last 8 months': 8,
  'Last 6 months': 6,
  'Last 3 months': 3,
  'This month': 1,
}

/**
 * A teacher's monthly load, from the periods they actually hold.
 *
 * Their week times four teaching weeks, with a small per-month drift for
 * holidays and exam weeks. It used to be 80 to 120 classes a month drawn at
 * random, which for the librarian holding nineteen periods a week was three
 * times the truth and for nobody was it derived from anything.
 */
function monthlyLoad(teacher: Teacher, months: string[]): WorkloadDataPoint[] {
  const weekly = scheduleFor(teacher).length
  const rand = seededRandom(parseInt(String(teacher.id)) * 977 + 13)
  return months.map(month => {
    // Four teaching weeks, less a day or two for a holiday most months.
    const totalClasses = Math.max(0, Math.round(weekly * (3.6 + rand() * 0.6)))
    const teachingHours = Math.round(totalClasses * 0.75)
    // Duties are the rest of the job: invigilation, the bus rota, assembly.
    const extraDuties = randInt(4, 10, rand)
    return { month, totalClasses, teachingHours, extraDuties }
  })
}

function workloadFor(teacher: Teacher): WorkloadDataPoint[] {
  return monthlyLoad(teacher, recentMonths(WORKLOAD_SPANS['Last 8 months']))
}

function workloadByPeriodFor(teacher: Teacher): Record<string, WorkloadDataPoint[]> {
  const data: Record<string, WorkloadDataPoint[]> = {}
  Object.entries(WORKLOAD_SPANS).forEach(([label, span]) => {
    data[label] = monthlyLoad(teacher, recentMonths(span))
  })
  return data
}

function scheduleByView(teacher: Teacher): Record<string, ScheduleBlock[]> {
  return {
    'Weekly': scheduleFor(teacher),
    'Daily': dailyScheduleFor(teacher),
  }
}

function generateTrainingEvents(seed: number): TrainingEvent[] {
  const rand = seededRandom(seed)
  const count = randInt(4, 6, rand)
  const picked: TrainingEvent[] = []
  const indices = new Set<number>()
  for (let i = 0; i < count; i++) {
    let idx: number
    do { idx = Math.floor(rand() * TRAINING_POOL.length) } while (indices.has(idx))
    indices.add(idx)
    picked.push({ ...TRAINING_POOL[idx], id: `t${i + 1}` })
  }
  return picked
}

function generateLeaveRequests(seed: number): LeaveRequest[] {
  const rand = seededRandom(seed)
  const count = randInt(1, 3, rand)
  const statuses: LeaveRequest['status'][] = ['Pending', 'Approved', 'Declined']
  const requests: LeaveRequest[] = []

  for (let i = 0; i < count; i++) {
    requests.push({
      id: `lr${i + 1}`,
      type: pick(LEAVE_TYPES, rand),
      reason: pick(LEAVE_REASONS, rand),
      status: i === 0 ? 'Pending' : pick(statuses, rand),
    })
  }
  return requests
}

function ratingFor(val: number): { rating: string; color: PerformanceMetric['color'] } {
  if (val >= 90) return { rating: 'Excellent', color: 'success' }
  if (val >= 80) return { rating: 'Good', color: 'info' }
  if (val >= 70) return { rating: 'Needs Improvement', color: 'warning' }
  return { rating: 'Below Standard', color: 'danger' }
}

function generatePerformanceMetrics(seed: number): PerformanceMetric[] {
  const rand = seededRandom(seed)
  const grading = randInt(70, 98, rand)
  const avgGrade = randInt(65, 95, rand)
  const attendance = randInt(60, 95, rand)
  const feedback = randInt(50, 90, rand)

  return [
    { label: 'Grading Timeliness', value: grading, max: 100, ...ratingFor(grading) },
    { label: 'Student Avg. Grade', value: avgGrade, max: 100, ...ratingFor(avgGrade) },
    { label: 'Student Attendance', value: attendance, max: 100, ...ratingFor(attendance) },
    { label: 'Parent Feedback', value: feedback, max: 100, ...ratingFor(feedback) },
  ]
}

const PERFORMANCE_PERIODS = ['Last Month', 'Last 3 Months', 'Last 6 Months', 'This Year']

function generatePerformanceByPeriod(seed: number): Record<string, PerformanceMetric[]> {
  const data: Record<string, PerformanceMetric[]> = {}
  PERFORMANCE_PERIODS.forEach((period, i) => {
    data[period] = generatePerformanceMetrics(seed + i * 100)
  })
  return data
}

/**
 * Get weekday dates (Mon–Fri) for a given year/month.
 * Month is 0-indexed (0 = Jan, 2 = March, etc.)
 */
function getWeekdaysInMonth(year: number, month: number): number[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const weekdays: number[] = []
  for (let d = 1; d <= daysInMonth; d++) {
    const dayOfWeek = new Date(year, month, d).getDay()
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      weekdays.push(d)
    }
  }
  return weekdays
}

/**
 * Generate realistic attendance for a single month.
 * Most weekdays are present (~78%), some late (~14%), rarely on leave (~8%).
 */
function generateMonthAttendance(year: number, month: number, rand: () => number): MonthlyAttendance {
  const weekdays = getWeekdaysInMonth(year, month)
  const highlights: CalendarHighlight[] = []
  let present = 0
  let late = 0
  let onLeave = 0

  for (const day of weekdays) {
    const roll = rand()
    if (roll < 0.08) {
      highlights.push({ date: day, variant: 'onLeave' })
      onLeave++
    } else if (roll < 0.22) {
      highlights.push({ date: day, variant: 'late' })
      late++
    } else {
      highlights.push({ date: day, variant: 'present' })
      present++
    }
  }

  return { highlights, summary: { present, late, onLeave } }
}

/**
 * Generate monthly attendance data for the 12 months of the current calendar
 * year. Keys are "YYYY-M" where M is 0-indexed (e.g. "2026-0" = Jan 2026).
 */
function generateMonthlyAttendance(seed: number): Record<string, MonthlyAttendance> {
  const rand = seededRandom(seed)
  const year = new Date().getFullYear()
  const data: Record<string, MonthlyAttendance> = {}
  for (let m = 0; m < 12; m++) {
    data[`${year}-${m}`] = generateMonthAttendance(year, m, rand)
  }
  return data
}

// ── Build detail map from teachersData ──────────────────────────────────────

function buildTeacherDetailsMap(): Record<string, TeacherDetail> {
  const map: Record<string, TeacherDetail> = {}

  teachersData.forEach((teacher, index) => {
    const seed = parseInt(String(teacher.id)) * 1000 + 7
    map[teacher.id] = {
      ...teacher,
      employmentType: employmentOf(teacher),
      address: ADDRESSES[index % ADDRESSES.length],
      // The classes they may amend, as the faculty row states them. This was
      // a pool of strings like `'BC - SA - 1A'` — a code from some other
      // school's data, dealt round ten at a time.
      classAssignments: teacher.assignedClasses ?? [],
      documents: generateDocuments(teacher),
      schedule: scheduleFor(teacher),
      workloadData: workloadFor(teacher),
      workloadByPeriod: workloadByPeriodFor(teacher),
      scheduleByView: scheduleByView(teacher),
      trainingEvents: generateTrainingEvents(seed + 2),
      leaveRequests: generateLeaveRequests(seed + 3),
      performanceMetrics: generatePerformanceMetrics(seed + 4),
      performanceByPeriod: generatePerformanceByPeriod(seed + 4),
      monthlyAttendance: generateMonthlyAttendance(seed + 5),
    }
  })

  return map
}

export const teacherDetailsData = buildTeacherDetailsMap()

/**
 * Get teacher detail by ID
 * Every teacher in teachersData automatically has detail data
 */
export function getTeacherDetailById(id: string): TeacherDetail | undefined {
  return teacherDetailsData[id]
}
