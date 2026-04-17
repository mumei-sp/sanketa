import type { TeacherDetail, EmploymentType, ScheduleBlock, WorkloadDataPoint, TrainingEvent, LeaveRequest, PerformanceMetric, CalendarHighlight, MonthlyAttendance, TeacherDocument } from '@/features/teachers/types/teacher-detail'
import type { Teacher } from '@/features/teachers/types'
import { teachersData } from './teachers'
import { relativeDisplay } from '@/mocks/_shared/date-helpers'

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

const ADDRESSES = [
  '45 Jalan Sudirman, Jakarta, Indonesia',
  '12 Jalan Thamrin, Jakarta, Indonesia',
  '2218 Baker Street, London, United Kingdom',
  '78 Rue de Rivoli, Paris, France',
  '15 Orchard Road, Singapore',
  '320 Collins Street, Melbourne, Australia',
  '5 Marina Boulevard, Singapore',
  '88 Jalan Ampang, Kuala Lumpur, Malaysia',
  '42 King Street, Sydney, Australia',
  '101 Rajadamri Road, Bangkok, Thailand',
]

const EMPLOYMENT_TYPES: EmploymentType[] = ['Full-Time', 'Full-Time', 'Full-Time', 'Part-Time', 'Full-Time', 'Full-Time', 'Substitute', 'Full-Time', 'Part-Time', 'Full-Time']

const CLASS_POOLS = [
  ['BC - SA - 1A'], ['BC - SA - 2A'], ['BC - SA - 1B'], ['SA - 3A'],
  ['BC - SA - 2B'], ['PE - 1A', 'PE - 2A'], ['BC - SA - 1A'], ['SC - 3B'],
  ['SC - 2A'], ['EN - 1B', 'EN - 2B'],
]

// Training events: a mix of upcoming (positive offsets) and completed (negative),
// dated relative to today so the detail view always has plausible recent history.
const TRAINING_POOL: Omit<TrainingEvent, 'id'>[] = [
  { event: 'Digital Learning Tools Training', type: 'Training', date: relativeDisplay(20), location: 'Zoom – International Education Network', status: 'Upcoming' },
  { event: 'Classroom Management Certification', type: 'Certification', date: relativeDisplay(-60), location: 'Cambridge University Online (UK)', status: 'Completed' },
  { event: 'Advanced English Teaching Methods', type: 'Workshop', date: relativeDisplay(-90), location: 'London, UK – British Council', status: 'Completed' },
  { event: 'Inclusive Education Practices', type: 'Workshop', date: relativeDisplay(35), location: 'UNESCO HQ – Paris', status: 'Upcoming' },
  { event: 'Student Assessment Strategies', type: 'Seminar', date: relativeDisplay(55), location: 'EdTech Global – Online', status: 'Upcoming' },
  { event: 'Curriculum Design Fundamentals', type: 'Training', date: relativeDisplay(-200), location: 'Stanford Online – EdX', status: 'Completed' },
  { event: 'Child Psychology in Education', type: 'Seminar', date: relativeDisplay(-170), location: 'Singapore – National Institute of Education', status: 'Completed' },
  { event: 'Data-Driven Instruction Workshop', type: 'Workshop', date: relativeDisplay(-140), location: 'Melbourne, AU – Education Conference', status: 'Completed' },
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
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15]
const CLASS_CODES = ['8C', '9A', '9B', '8A', '8B', '9C']
const SCHEDULE_VARIANTS: ScheduleBlock['variant'][] = ['accent', 'dark', 'primary']

// ── Generator functions ─────────────────────────────────────────────────────

function generateDocuments(teacher: Teacher): TeacherDocument[] {
  const name = (teacher.displayName || teacher.fullName || 'Teacher').replace(/\s+/g, '')
  return [
    { id: 'd1', name: `Employment_Contract_${name}_${teacher.teacherId}.pdf`, type: 'PDF', size: `${(2 + Math.random() * 2).toFixed(1)} MB` },
    { id: 'd2', name: `Certification_${teacher.subject.split(' ')[0]}_${name}.pdf`, type: 'PDF', size: `${(1 + Math.random() * 1.5).toFixed(1)} MB` },
    { id: 'd3', name: `ID_Passport_${name}_${teacher.teacherId}.pdf`, type: 'PDF', size: `${(1.5 + Math.random() * 1.5).toFixed(1)} MB` },
  ]
}

/**
 * Generate a realistic weekly schedule: teachers have 4-6 classes per day,
 * spread across the 5-day week (20-30 classes/week total).
 * Classes are in contiguous blocks with gaps for breaks/prep.
 */
function generateSchedule(seed: number): ScheduleBlock[] {
  const rand = seededRandom(seed)
  const blocks: ScheduleBlock[] = []
  // Assign 3-4 class codes this teacher teaches regularly
  const teacherClasses = [
    CLASS_CODES[Math.floor(rand() * CLASS_CODES.length)],
    CLASS_CODES[Math.floor(rand() * CLASS_CODES.length)],
    CLASS_CODES[Math.floor(rand() * CLASS_CODES.length)],
    CLASS_CODES[Math.floor(rand() * CLASS_CODES.length)],
  ]

  const used = new Set<string>()

  for (const day of DAYS) {
    // Each day: 4-6 classes out of 8 possible hours
    const classesPerDay = randInt(4, 6, rand)
    // Pick which hours have classes — prefer morning-heavy with a lunch gap
    const availableHours = [...HOURS]
    const chosenHours: number[] = []
    for (let i = 0; i < classesPerDay && availableHours.length > 0; i++) {
      const idx = Math.floor(rand() * availableHours.length)
      chosenHours.push(availableHours[idx])
      availableHours.splice(idx, 1)
    }
    chosenHours.sort((a, b) => a - b)

    for (const hour of chosenHours) {
      const key = `${day}-${hour}`
      if (!used.has(key)) {
        used.add(key)
        blocks.push({
          day,
          hour,
          classCode: pick(teacherClasses, rand),
          variant: pick(SCHEDULE_VARIANTS, rand),
        })
      }
    }
  }
  return blocks
}

/**
 * Generate a daily schedule (just Wednesday's classes) for the Daily view.
 */
function generateDailySchedule(seed: number): ScheduleBlock[] {
  const weeklyBlocks = generateSchedule(seed)
  return weeklyBlocks.filter(b => b.day === 'Wed')
}

/**
 * Generate realistic workload data for a given range of months.
 * Total classes per month: 80-120, teaching hours: 70-85% of total.
 */
function generateWorkloadDataForMonths(seed: number, months: string[]): WorkloadDataPoint[] {
  const rand = seededRandom(seed)
  return months.map(month => {
    const total = randInt(80, 120, rand)
    const teaching = Math.round(total * (0.70 + rand() * 0.15))
    return { month, totalClasses: total, teachingHours: teaching, extraDuties: total - teaching }
  })
}

const WORKLOAD_PERIODS: Record<string, string[]> = {
  'Last 8 months': ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
  'Last 6 months': ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
  'Last 3 months': ['Sep', 'Oct', 'Nov'],
  'This month': ['Nov'],
}

function generateWorkloadData(seed: number): WorkloadDataPoint[] {
  return generateWorkloadDataForMonths(seed, WORKLOAD_PERIODS['Last 8 months'])
}

function generateWorkloadByPeriod(seed: number): Record<string, WorkloadDataPoint[]> {
  const data: Record<string, WorkloadDataPoint[]> = {}
  const periods = Object.keys(WORKLOAD_PERIODS)
  periods.forEach((period, i) => {
    data[period] = generateWorkloadDataForMonths(seed + i * 50, WORKLOAD_PERIODS[period])
  })
  return data
}

function generateScheduleByView(seed: number): Record<string, ScheduleBlock[]> {
  return {
    'Weekly': generateSchedule(seed),
    'Daily': generateDailySchedule(seed),
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
      employmentType: EMPLOYMENT_TYPES[index % EMPLOYMENT_TYPES.length],
      address: ADDRESSES[index % ADDRESSES.length],
      classAssignments: CLASS_POOLS[index % CLASS_POOLS.length],
      documents: generateDocuments(teacher),
      schedule: generateSchedule(seed),
      workloadData: generateWorkloadData(seed + 1),
      workloadByPeriod: generateWorkloadByPeriod(seed + 1),
      scheduleByView: generateScheduleByView(seed),
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
