/**
 * One student's detail page.
 *
 * ── What this replaced ─────────────────────────────────────────────────
 * A single shared record, served for every student in the school. So every
 * child had a severe peanut allergy and an EpiPen, every child had won two
 * silver medals at the city swim meet, and every child's documents list held
 * `ReportCard_IsabellaRossi_Grad8.pdf` and `IDCard_Student_S2106_Isabella.pdf`
 * — a student who has never been in the directory. Open two students and the
 * pages were identical; the medical alerts contradicted the `studentInfo` on
 * the record itself; and the activity durations ran `2029 – Present` through
 * `2033 – Present`, which is a club joined three years from now.
 *
 * A shared record was defensible while the roster held forty rows and this was
 * a Figma reference. It stops being defensible the moment somebody uses the
 * page to decide something about a child, because the page is about a
 * different child.
 *
 * ── Derived where there is something to derive from ────────────────────
 * The attendance calendar is read out of the class's actual registers, so the
 * month shown here is the month the teacher marked — not a fixed pattern that
 * claimed fourteen present days regardless. The health records are what the
 * record already says under `studentInfo`. The rest — clubs, behaviour notes,
 * scholarships, documents — is generated per student off a seeded stream, so
 * it is stable across reloads and different between two children.
 *
 * Most students have little here, which is the point: a school where every
 * child has three clubs, two scholarships and four behaviour notes is a school
 * where none of those mean anything.
 */

import type {
  Student,
  StudentDetailData,
  StudentAttendanceMonth,
  StudentScholarship,
  StudentHealthRecord,
  StudentActivity,
  StudentBehaviorEntry,
} from '@/features/students/types'
import type { DocumentItem } from '@/components/ui/documents-list'
import type { CalendarHighlight } from '@/components/ui/mini-calendar'
import { relativeDisplay } from '@/mocks/_shared/date-helpers'
import { attendanceSubmissions } from '@/mocks/attendance/daily'
import { classTeacherOf, subjectTeacherOf } from '@/mocks/teachers/assignments'
import { activeTenant } from '@/mocks/_shared/tenant-context'
import { rng, int, pick, chance, type Rng } from '@/mocks/tenants/_generate/random'

/** Key for a calendar month in the `monthlyAttendance` map ("YYYY-M", M zero-indexed). */
function monthKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}`
}

// ── Attendance ────────────────────────────────────────────────────────

/**
 * This month's calendar, out of the registers the class actually submitted.
 *
 * The register is the record of who was present; a second, unrelated pattern
 * on the detail page meant the teacher's register and the child's calendar
 * disagreed about the same day. Days with no submission are simply absent from
 * the map, which the calendar renders as unmarked — true, and better than
 * guessing.
 */
function attendanceFor(student: Student): Record<string, StudentAttendanceMonth> {
  const now = new Date()
  const classLabel = student.class ?? `${student.gradeLevel}${student.section}`
  const id = String(student.id)

  const highlights: CalendarHighlight[] = []
  const summary = { present: 0, late: 0, absent: 0, sick: 0 }

  attendanceSubmissions
    .filter(submission => submission.classId === classLabel)
    .forEach(submission => {
      const date = new Date(`${submission.date}T12:00:00`)
      if (monthKey(date) !== monthKey(now)) return
      const entry = submission.entries.find(row => row.studentId === id)
      if (!entry) return

      // The register offers present / late / absent. "Sick" is an absence with
      // a reason attached, which is how a school tells the two apart.
      const sick = entry.status === 'absent' && /sick|well/i.test(entry.note ?? '')
      const variant = sick ? 'sick' : entry.status
      highlights.push({ date: date.getDate(), variant })
      summary[variant] += 1
    })

  if (highlights.length === 0) return {}
  return { [monthKey(now)]: { highlights, summary } }
}

// ── Health ────────────────────────────────────────────────────────────

/**
 * What the record says about their health, and nothing more.
 *
 * `studentInfo` already carries a medical note and two flags. Reading them
 * here is what stops the detail page contradicting the record it is a page
 * for — which it did, with a severe peanut allergy on children whose record
 * said "No known allergies".
 */
function healthFor(student: Student): StudentHealthRecord[] {
  const info = (student.studentInfo ?? {}) as {
    medicalInfo?: string
    medicalConditionAlert?: boolean
    specialNeedsSupport?: boolean
  }
  const records: StudentHealthRecord[] = [
    {
      id: 'hr-checkup',
      title: 'Medical Record',
      description: `Annual health check completed — fit for all activities`,
      severity: 'normal',
    },
  ]
  if (info.medicalConditionAlert && info.medicalInfo) {
    records.push({
      id: 'hr-alert',
      title: 'Medical Alert',
      description: info.medicalInfo,
      severity: /severe|asthma|anaemia/i.test(info.medicalInfo) ? 'severe' : 'mild',
    })
  }
  if (info.specialNeedsSupport) {
    records.push({
      id: 'hr-support',
      title: 'Learning Support',
      description: 'Individual education plan in place — reviewed each term',
      severity: 'normal',
    })
  }
  return records
}

// ── Clubs ─────────────────────────────────────────────────────────────

/**
 * Which club a hobby belongs to, and who runs it.
 *
 * `subject` is the department the advisor comes from, so the robotics club is
 * run by a computer-science teacher and the choir by the music teacher rather
 * than all of them by whoever teaches PE.
 */
const CLUBS: readonly {
  match: RegExp
  club: string
  icon: string
  role: string
  subject: string
}[] = [
  { match: /swim/i, club: 'Swimming', icon: 'Waves', role: 'Team Member', subject: 'pe' },
  { match: /dance|bharatanatyam|classical/i, club: 'Dance', icon: 'Accessibility', role: 'Performer', subject: 'music' },
  { match: /robot|coding/i, club: 'Robotics', icon: 'Bot', role: 'Programmer', subject: 'cs' },
  { match: /cricket|football|athlet|badminton|kabaddi|throwball|skating|table tennis/i, club: 'Athletics', icon: 'Trophy', role: 'Team Member', subject: 'pe' },
  { match: /keyboard|vocal|music/i, club: 'Music', icon: 'Music', role: 'Ensemble', subject: 'music' },
  { match: /draw|photograph|art/i, club: 'Art', icon: 'Palette', role: 'Member', subject: 'art' },
  { match: /chess|quiz|debate|reading/i, club: 'Quiz & Debate', icon: 'Trophy', role: 'Member', subject: 'eng' },
  { match: /yoga/i, club: 'Yoga', icon: 'Accessibility', role: 'Member', subject: 'pe' },
]

const ACHIEVEMENTS: readonly string[] = [
  'Runner-up, inter-school meet',
  'Represented the school at the district level',
  'First place, annual day showcase',
  'Won the zonal round',
  'Certificate of merit',
]

/**
 * Their clubs, from the hobbies already on the record.
 *
 * Joined the year they were admitted or later, never before — the shared
 * record had children joining clubs in 2033.
 */
function clubsFor(student: Student, source: Rng): StudentActivity[] {
  const hobbies = String((student.studentInfo as { hobbies?: string } | undefined)?.hobbies ?? '')
    .split(',')
    .map(hobby => hobby.trim())
    .filter(Boolean)

  const admitted = Number((student.admissionDate ?? '2020-06-01').slice(0, 4))
  const seen = new Set<string>()

  return hobbies.flatMap(hobby => {
    const match = CLUBS.find(entry => entry.match.test(hobby))
    if (!match || seen.has(match.club)) return []
    seen.add(match.club)
    // Not every hobby is a club. Half of them are a thing the child does at
    // home, which is what the hobbies field on an enrolment form mostly is.
    if (!chance(source, 0.55)) return []
    const joined = int(source, admitted, Math.max(admitted, 2026))
    return [
      {
        id: `ec-${match.club.toLowerCase().replace(/\W+/g, '-')}`,
        club: match.club,
        role: match.role,
        icon: match.icon,
        achievements: chance(source, 0.45) ? pick(source, ACHIEVEMENTS) : '—',
        duration: `${joined} – Present`,
        advisor: subjectTeacherOf(`${student.class ?? ''}|${match.club}`, match.subject),
      },
    ]
  })
}

// ── Behaviour ─────────────────────────────────────────────────────────

const POSITIVE_NOTES: readonly string[] = [
  'Helped a classmate through a difficult topic',
  'Volunteered for the annual day committee',
  'Consistent improvement in Mathematics this term',
  'Led the class assembly',
  'Returned a lost wallet to the office',
]

const MINOR_ISSUES: readonly string[] = [
  'Homework not submitted for three consecutive days',
  'Absent without prior intimation',
  'Repeatedly late to the first period',
  'Disruptive during the library period',
  'Uniform not as per the code',
]

/**
 * Their behaviour log.
 *
 * Most students have nothing in it, a good number have a note or two, and a
 * few have a run of minor issues — which is what makes the log worth opening.
 * A log with four entries on every child in the school is a log nobody reads.
 */
function behaviourFor(student: Student, source: Rng): StudentBehaviorEntry[] {
  const classLabel = student.class ?? ''
  const teacher = classTeacherOf(classLabel)
  const struggling = student.performance !== 'Good'

  const positives = int(source, 0, struggling ? 1 : 2)
  const issues = struggling ? int(source, 1, 3) : int(source, 0, 1)

  const entries: StudentBehaviorEntry[] = []
  for (let i = 0; i < positives; i += 1) {
    entries.push({
      id: `bl-pos-${i}`,
      date: relativeDisplay(-int(source, 10, 120)),
      type: 'Positive Note',
      details: pick(source, POSITIVE_NOTES),
      reportedBy: teacher,
      statusAction: 'Recognition Recorded',
    })
  }
  for (let i = 0; i < issues; i += 1) {
    entries.push({
      id: `bl-iss-${i}`,
      date: relativeDisplay(-int(source, 5, 100)),
      type: 'Minor Issue',
      details: pick(source, MINOR_ISSUES),
      reportedBy: teacher,
      statusAction: chance(source, 0.5) ? 'Parent Notified' : 'Issue Warning',
    })
  }
  return entries
}

// ── Scholarships ──────────────────────────────────────────────────────

const SCHOLARSHIPS: readonly Omit<StudentScholarship, 'id'>[] = [
  { title: 'Karnataka State Merit Scholarship', category: 'Merit', icon: 'award' },
  { title: 'School Fee Concession — Staff Ward', category: 'Finance', icon: 'heart' },
  { title: 'Sports Excellence Grant', category: 'Sports', icon: 'trophy' },
  { title: 'STEM for Girls Initiative', category: 'Enrichment', icon: 'code' },
  { title: 'Sibling Fee Concession', category: 'Finance', icon: 'heart' },
]

/**
 * Their scholarships. Usually none.
 *
 * Weighted toward the students who would actually hold one — a merit award
 * goes to a child near the top of the class, not to a random one in eleven.
 */
function scholarshipsFor(student: Student, source: Rng): StudentScholarship[] {
  const merited = (student.percentage ?? 0) >= 88
  if (!chance(source, merited ? 0.4 : 0.06)) return []
  const award = pick(source, SCHOLARSHIPS)
  return [{ id: `sch-${award.category.toLowerCase()}`, ...award }]
}

// ── Documents ─────────────────────────────────────────────────────────

/** Their file, named after them. */
function documentsFor(student: Student, source: Rng): DocumentItem[] {
  const slug = (student.fullName ?? student.name ?? 'Student').replace(/\W+/g, '')
  const size = () => `${(int(source, 40, 480) / 100).toFixed(2)} MB`
  const documents: DocumentItem[] = [
    { id: 'doc-tc', name: `TransferCertificate_${slug}.pdf`, type: 'PDF', size: size() },
    {
      id: 'doc-report',
      name: `ReportCard_${slug}_Class${student.gradeLevel ?? ''}.pdf`,
      type: 'PDF',
      size: size(),
    },
    {
      id: 'doc-id',
      name: `IDCard_${student.studentId}.pdf`,
      type: 'PDF',
      size: size(),
    },
  ]
  if (chance(source, 0.35)) {
    documents.push({ id: 'doc-aadhaar', name: `Aadhaar_${slug}_Redacted.pdf`, type: 'PDF', size: size() })
  }
  return documents
}

// ── The page ──────────────────────────────────────────────────────────

/**
 * Everything the detail page shows about one student.
 *
 * Seeded on the student's own id, so their page is the same page every time
 * it is opened and a different page from the child next to them on the
 * register.
 */
export function studentDetailFor(student: Student): StudentDetailData {
  const source = rng(`${activeTenant()}:detail:${student.id}`)
  return {
    monthlyAttendance: attendanceFor(student),
    scholarships: scholarshipsFor(student, source),
    healthRecords: healthFor(student),
    extracurriculars: clubsFor(student, source),
    behaviorLog: behaviourFor(student, source),
    documents: documentsFor(student, source),
  }
}
