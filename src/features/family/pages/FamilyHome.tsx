/**
 * What a family sees instead of the school dashboard.
 *
 * The staff dashboard answers "how is the school doing" — enrolment, earnings,
 * gender split, collection rates. Filtered to one student it answers nothing,
 * and the numbers that survive are meaningless at that size.
 *
 * ── A day, not a statistic ─────────────────────────────────────────────
 * This used to lead with "Attendance this month — 82%", above two more tiles
 * that were the same monthly summary sliced differently: "late arrivals" and
 * "days missed" both came out of one record. One fact wearing three hats,
 * which is how a page looks full and says nothing.
 *
 * Nobody opens a school app for a percentage. They open it to find out where
 * their child is *right now* — so the register's answer is the top of the page,
 * at the size of the question, with what is running as you look. Then whatever
 * needs doing. Then the month, as the shape of a term rather than one number.
 */

import * as React from 'react'
import { ArrowRight, CalendarDays } from 'lucide-react'
import PageHeader from '@/components/layout/PageHeader'
import { Tile, TileWrapper } from '@/components/tile'
import { SectionCard } from '@/components/ui/section-card'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusPill, type StatusPillConfig } from '@/components/ui/status-pill'
import { StudentAvatar } from '@/components/shared/StudentAvatar'
import { Button } from '@/components/ui/button'
import { accent, border, text, status, statusVivid, withOpacity } from '@/theme/colors'
import { fontSizes } from '@/config/typography'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useSchoolConfig } from '@/config/SchoolConfigContext'
import { getTimeOfDayGreeting, formatFriendlyDate } from '@/utils/date'
import { getDisplayName } from '@/features/students/utils/formatting'
import { classSectionOf, rollNumberOf } from '@/utils/class-section-helpers'
import { attendanceMonthKey } from '@/utils/academic-date'
import { isoDate } from '@/mocks/_shared/date-helpers'
import { CURRENCY } from '@/mocks/_shared/constants'
import { fetchStudentDetailData } from '@/api/services/student-service'
import { fetchAttendanceSubmission } from '@/api/services/attendance-service'
import { fetchClassSections, fetchClassTimetable } from '@/api/services/timetable-service'
import { fetchCalendarEvents } from '@/api/services/dashboard-service'
import { fetchNoticeBoardEntries } from '@/api/services/notice-board-service'
import { fetchFeeCollection } from '@/api/services/fees-collection-service'
import { fetchExams, fetchGradeSheet, fetchGradeableSubjects } from '@/api/services/grade-service'
import { fetchStudentRide } from '@/api/services/transport-service'
import { requestCallback, type CallbackReason } from '@/api/services/callback-service'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useAppToast } from '@/hooks/use-app-toast'
import { useGradeCalculator } from '@/features/grades/hooks/use-grade-calculator'
import type { GradeSheetRow, GradeSheetSummary } from '@/features/grades/types'
import { useFamilyScope } from '../FamilyScopeContext'
import { ChildSwitcher } from '../components/ChildSwitcher'
import type { StudentDetailData } from '@/features/students/types'
import type { NoticeBoardEntry } from '@/features/notice-board/types'
import type { CalendarEvent } from '@/features/dashboard/types'
import type { TimetableSlot } from '@/features/timetable/types'
import type { MarkableAttendanceStatus } from '@/features/attendance/types'
import type { FeeCollectionRecord } from '@/features/fees-collection/types'
import type { PeriodDefinition } from '@/config/school-config'

/**
 * The design system's card chrome, for the plain elements on this page.
 *
 * `--shadow-card` — `0 1px 2px rgb(21 68 110 / 0.03), 0 16px 36px -22px rgb(21
 * 68 110 / 0.24)`, deep and wide and navy-tinted — paired with the hairline
 * `--card-border` that defines a corner where white meets white, and that
 * carries the edge alone in dark mode, where the shadow is switched off.
 *
 * `Tile`'s `shadowed` prop emits exactly this, so the `SectionCard`s below
 * already have it and pass it only for symmetry (tailwind-merge dedupes).
 * The status strip and the "needs you" rows are plain divs rather than tiles,
 * and this is how they stay in step with the cards around them.
 *
 * It used to exist because `shadowed` resolved to Tailwind's `shadow-xs` — a
 * flat *grey* `0 1px 2px rgb(0 0 0 / 0.05)` that read dingy on this cool
 * canvas and left the cards sitting flat instead of floating.
 */
const CARD = 'border border-card-border shadow-card'

/** `slots.dayOfWeek` and `config.schoolDays` count from Monday; `Date` from Sunday. */
function mondayIndex(date: Date): number {
  return (date.getDay() + 6) % 7
}

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const WEEKDAY_LETTER = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

/** The next day the school actually opens, for a page read on a Saturday. */
function nextSchoolDay(schoolDays: number[], from: Date): string {
  for (let ahead = 1; ahead <= 7; ahead += 1) {
    const day = new Date(from)
    day.setDate(from.getDate() + ahead)
    if (schoolDays.includes(mondayIndex(day))) return WEEKDAYS[mondayIndex(day)]
  }
  return 'the next school day'
}

const minutes = (clock: string) => {
  const [h, m] = clock.split(':').map(Number)
  return h * 60 + m
}

/**
 * How today's register answered for this child.
 *
 * `unmarked` is not "absent" — it is "nobody has taken it yet", which before
 * the second bell is the ordinary state and the commonest thing this page has
 * to say. Drawing it as absent would frighten a parent every morning, and
 * `closed` exists so it does not do the same thing every weekend.
 */
type TodayMark = MarkableAttendanceStatus | 'unmarked' | 'closed'

const MARK: Record<TodayMark, { title: string; pill: StatusPillConfig; dot: string }> = {
  present: { title: 'In school', pill: statusVivid.success, dot: status.success.dot },
  late: { title: 'Arrived late', pill: statusVivid.warning, dot: status.warning.dot },
  absent: { title: 'Absent today', pill: statusVivid.danger, dot: status.danger.dot },
  unmarked: { title: 'Not marked yet', pill: statusVivid.info, dot: status.info.dot },
  closed: { title: 'No school today', pill: statusVivid.info, dot: status.info.dot },
}

/** Colour alone cannot carry a status — every day that went differently says so. */
const DAY_MARK: Record<string, { letter: string; tone: StatusPillConfig; title: string }> = {
  present: { letter: '', tone: statusVivid.success, title: 'Present' },
  late: { letter: 'L', tone: statusVivid.warning, title: 'Late' },
  absent: { letter: 'A', tone: statusVivid.danger, title: 'Absent' },
  sick: { letter: 'S', tone: statusVivid.danger, title: 'Unwell' },
  onLeave: { letter: 'E', tone: statusVivid.info, title: 'Excused' },
}

export function FamilyHome() {
  const currentUser = useCurrentUser()
  const { selected, isLoading, children } = useFamilyScope()
  const { config } = useSchoolConfig()
  const { calculateGrade, passingThreshold } = useGradeCalculator()

  const [detail, setDetail] = React.useState<StudentDetailData | null>(null)
  const [mark, setMark] = React.useState<TodayMark>('unmarked')
  const [slots, setSlots] = React.useState<TimetableSlot[]>([])
  const [events, setEvents] = React.useState<CalendarEvent[]>([])
  const [notices, setNotices] = React.useState<NoticeBoardEntry[]>([])
  const [fees, setFees] = React.useState<FeeCollectionRecord[]>([])
  const [marks, setMarks] = React.useState<{
    row: GradeSheetRow
    summary: GradeSheetSummary
    examName: string
    maxMarks: number
    subjects: { id: string; name: string; shortName: string }[]
  } | null>(null)
  const [ride, setRide] = React.useState<Awaited<ReturnType<typeof fetchStudentRide>>>(null)
  /**
   * The callback the parent is composing, and who it names.
   *
   * One dialog serves both buttons — the absence one and the reply under a
   * teacher's note — because the two differ only in what they are ABOUT. A
   * second dialog would have been the same form with a different title.
   */
  const [asking, setAsking] = React.useState<{
    reason: CallbackReason
    teacherName: string | null
  } | null>(null)
  const [askNote, setAskNote] = React.useState('')
  const [sending, setSending] = React.useState(false)

  const studentId = selected ? String(selected.id) : null
  const classLabel = selected ? (classSectionOf(selected) ?? null) : null
  const openToday = config.schoolDays.includes(mondayIndex(new Date()))

  React.useEffect(() => {
    if (!studentId) return
    setDetail(null)
    fetchStudentDetailData(studentId)
      .then(setDetail)
      .catch(error => console.error('Failed to load the record', error))
  }, [studentId])

  React.useEffect(() => {
    if (!studentId || !classLabel) return
    setSlots([])
    if (!openToday) {
      setMark('closed')
      return
    }
    setMark('unmarked')

    fetchAttendanceSubmission(classLabel, isoDate())
      .then(submission => {
        const entry = submission?.entries.find(row => row.studentId === studentId)
        setMark(entry?.status ?? 'unmarked')
      })
      .catch(error => console.error('Failed to read the register', error))

    fetchClassSections()
      .then(sections => {
        const section = sections.find(candidate => candidate.label === classLabel)
        return section ? fetchClassTimetable(section.id) : null
      })
      .then(timetable => {
        if (!timetable) return
        const today = mondayIndex(new Date())
        setSlots(timetable.slots.filter(slot => slot.dayOfWeek === today))
      })
      .catch(error => console.error('Failed to load the timetable', error))
  }, [studentId, classLabel, openToday])

  // Already narrowed for this reader: `audienceReaches` keeps a staff notice off
  // a family's board, and the fee rows come back scoped to their own children.
  React.useEffect(() => {
    fetchCalendarEvents()
      .then(setEvents)
      .catch(error => console.error('Failed to load events', error))
    fetchNoticeBoardEntries()
      .then(rows => setNotices(rows.filter(row => row.status === 'Active').slice(0, 3)))
      .catch(error => console.error('Failed to load notices', error))
    fetchFeeCollection()
      .then(setFees)
      .catch(error => console.error('Failed to load fees', error))
  }, [])

  /**
   * The last exam this class has marks for, and the class average beside them.
   *
   * `fetchGradeSheet` narrows its ROWS to this reader — a parent gets their own
   * child and nobody else — while `summary.subjectAverages` is computed over the
   * whole roster before that narrowing, on the service's own reasoning that an
   * average is the class's fact and blanking it would make a report card
   * unreadable rather than private. So the marker on each bar is the real class
   * average and not this one child's mark wearing a second hat.
   */
  React.useEffect(() => {
    if (!studentId || !classLabel) return
    let cancelled = false
    setMarks(null)
    void (async () => {
      try {
        const [exams, subjectList] = await Promise.all([fetchExams(), fetchGradeableSubjects()])
        const exam = exams[0]
        if (!exam) return
        const { rows, summary } = await fetchGradeSheet(
          classLabel,
          exam.id,
          calculateGrade,
          passingThreshold,
        )
        const row = rows.find(candidate => candidate.studentId === studentId)
        if (cancelled || !row) return
        setMarks({
          row,
          summary,
          examName: exam.termName,
          maxMarks: exam.maxMarks ?? 100,
          subjects: subjectList,
        })
      } catch (error) {
        console.error('Failed to load marks', error)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [studentId, classLabel, calculateGrade, passingThreshold])

  /**
   * The bus, when there is one.
   *
   * One read, scoped to this child — see `fetchStudentRide`. It used to be four
   * (`fetchAssignments` plus the routes, vehicles and drivers), which asked the
   * whole fleet for one bus and left the filtering to the page; a parent does
   * not hold `transport.read`, so all four came back empty and the card could
   * never appear.
   *
   * `null` covers both of the design's conditions without distinguishing them:
   * a school with no buses and a day pupil at a school that runs them both have
   * nothing to draw, and the card is ABSENT rather than empty.
   */
  React.useEffect(() => {
    if (!studentId) return
    let cancelled = false
    setRide(null)
    void fetchStudentRide(studentId)
      .then(found => {
        if (!cancelled) setRide(found)
      })
      .catch(error => console.error('Failed to load the bus', error))
    return () => {
      cancelled = true
    }
  }, [studentId])

  const toast = useAppToast()

  const sendCallback = React.useCallback(async () => {
    if (!asking || !studentId || !currentUser) return
    setSending(true)
    try {
      const made = await requestCallback({
        studentId,
        requestedBy: currentUser.fullName,
        teacherName: asking.teacherName,
        reason: asking.reason,
        note: askNote.trim(),
      })
      // `null` means the guard refused — the student is not this caller's. It
      // cannot happen from the buttons below, which only ever pass the child
      // already on screen, but the service answers the same way to anyone.
      if (!made) {
        toast.showError('That request could not be sent.')
        return
      }
      toast.showSuccess('The school has your request', {
        description: 'Someone will call you back.',
      })
      setAsking(null)
      setAskNote('')
    } catch (error) {
      console.error('Failed to ask for a callback', error)
      toast.showError('That request could not be sent.')
    } finally {
      setSending(false)
    }
  }, [asking, askNote, studentId, currentUser, toast])

  const month = React.useMemo(() => {
    if (!detail) return null
    const now = new Date()
    return detail.monthlyAttendance[attendanceMonthKey(now.getFullYear(), now.getMonth())] ?? null
  }, [detail])

  const note = React.useMemo(() => {
    if (!detail || detail.behaviorLog.length === 0) return null
    return [...detail.behaviorLog].sort((a, b) => b.date.localeCompare(a.date))[0]
  }, [detail])

  const teaching = React.useMemo(
    () => config.periods.filter(period => !period.isBreak),
    [config.periods],
  )

  /** The lesson running as they look, which is the other half of "where are they". */
  const now = React.useMemo(() => {
    if (!openToday || slots.length === 0) return null
    const clock = new Date().getHours() * 60 + new Date().getMinutes()
    const period = config.periods.find(
      candidate => clock >= minutes(candidate.startTime) && clock < minutes(candidate.endTime),
    )
    if (!period) return null
    const slot = slots.find(candidate => candidate.periodId === period.id)
    return { period, slot }
  }, [openToday, slots, config.periods])

  /** What is outstanding. Empty most days, and the page says so rather than padding. */
  const due = React.useMemo(
    () => fees.filter(row => row.status !== 'Paid').slice(0, 2),
    [fees],
  )

  const name = selected ? getDisplayName(selected) : ''
  const firstName = name.split(' ')[0]
  const roll = rollNumberOf(selected?.rollNumber)
  const today = MARK[mark]

  return (
    <div className="flex flex-col gap-4 md:gap-[18px]">
      <PageHeader
        title={`${getTimeOfDayGreeting()}, ${currentUser?.fullName?.split(' ')[0] ?? ''}`.trim()}
        breadcrumbs={[{ label: formatFriendlyDate() }]}
      />

      <ChildSwitcher />

      {isLoading ? (
        <Skeleton className="h-28 w-full rounded-xl" />
      ) : !selected ? (
        <p
          className="rounded-xl border border-dashed p-8 text-center text-body-muted"
          style={{ borderColor: border.default }}
        >
          {children.length === 0
            ? 'This account is not linked to a student yet. The school office can do that.'
            : 'Choose a child to see their records.'}
        </p>
      ) : (
        <>
          {/* ── Today: the child, and the register's answer, at the size of the question ── */}
          <div
            className={`flex flex-col overflow-hidden rounded-xl md:flex-row md:items-stretch ${CARD}`}
            style={{ backgroundColor: 'var(--card)' }}
          >
            <div className="flex items-center gap-3.5 p-4 md:min-w-[280px]">
              <StudentAvatar name={name} avatarUrl={selected.avatarUrl} size={56} />
              <span className="min-w-0">
                <span className="block text-section-title" style={{ color: 'var(--heading)' }}>
                  {name}
                </span>
                <span className="block text-caption" style={{ color: text.muted }}>
                  {classLabel ?? 'No class'}
                  {roll ? ` · Roll ${roll}` : ''}
                </span>
              </span>
            </div>

            <div
              className="flex flex-1 flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center"
              style={{ backgroundColor: today.pill.bg }}
            >
              <span className="flex flex-col gap-1">
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="size-2.5 rounded-full"
                    style={{
                      backgroundColor: today.dot,
                      boxShadow: `0 0 0 4px ${withOpacity(today.dot, 0.18)}`,
                    }}
                  />
                  <span
                    className="text-section-title"
                    style={{ color: today.pill.color, fontSize: fontSizes.xl }}
                  >
                    {today.title}
                  </span>
                </span>
                <span className="text-caption" style={{ color: text.body }}>
                  {!openToday
                    ? `Classes resume on ${nextSchoolDay(config.schoolDays, new Date())}.`
                    : mark === 'unmarked'
                      ? `${classLabel ?? 'The class'}'s attendance usually goes in by ${teaching[1]?.endTime ?? '09:00'}.`
                      : `Marked by ${firstName}'s class teacher.`}
                </span>
                {/*
                  Drawn, and deliberately dead. There is no parent→school
                  messaging module, so this says what it WILL do rather than
                  pretending to do it — a button that looks live and does
                  nothing is worse than one that admits it is not ready yet.
                */}
                {mark === 'absent' && (
                  <button
                    type="button"
                    onClick={() => setAsking({ reason: 'absence', teacherName: null })}
                    className="tap-target mt-1 w-fit rounded-md px-2.5 py-1 text-caption font-medium transition-colors hover:opacity-80"
                    style={{ backgroundColor: accent.soft, color: 'var(--heading)' }}
                  >
                    Send a note
                  </button>
                )}
              </span>

              {now && (
                <span className="flex flex-col gap-0.5 sm:items-end sm:text-right">
                  <span
                    className="text-caption font-semibold uppercase tracking-wide"
                    style={{ color: text.muted }}
                  >
                    Right now
                  </span>
                  <span className="text-body font-semibold" style={{ color: 'var(--heading)' }}>
                    {now.slot?.subjectName ?? 'Free period'}
                  </span>
                  <span className="text-caption" style={{ color: text.muted }}>
                    {now.period.label}
                    {now.slot?.room ? ` · ${now.slot.room}` : ''}
                    {now.slot?.teacherName ? ` · ${now.slot.teacherName}` : ''}
                  </span>
                </span>
              )}
            </div>
          </div>

          {/* ── Needs you, and nothing when nothing does ── */}
          {due.length > 0 ? (
            <div className="flex flex-col gap-2">
              <span
                className="text-caption font-semibold uppercase tracking-wide"
                style={{ color: text.muted }}
              >
                Needs you
              </span>
              <TileWrapper columns={{ default: 1, md: 2 }} gap={16}>
                {due.map(row => {
                  const tone = row.status === 'Overdue' ? statusVivid.danger : statusVivid.warning
                  return (
                    <div
                      key={`${row.studentId}-${row.feeCategory}`}
                      className={`flex items-center justify-between gap-4 rounded-xl p-4 ${CARD}`}
                      style={{
                        borderLeft: `3px solid ${tone.color}`,
                        backgroundColor: 'var(--card)',
                      }}
                    >
                      <span className="min-w-0">
                        <span
                          className="block text-body font-semibold"
                          style={{ color: 'var(--heading)' }}
                        >
                          {row.feeCategory} — {CURRENCY.symbol}
                          {row.totalAmount.toLocaleString('en-IN')}
                        </span>
                        <span className="block text-caption" style={{ color: text.muted }}>
                          {row.status} · due {row.dueDate}
                        </span>
                      </span>
                      <StatusPill label={row.status} config={tone} />
                    </div>
                  )
                })}
              </TileWrapper>
            </div>
          ) : (
            <div
              className="flex items-center gap-3 rounded-xl border border-dashed p-4"
              style={{ borderColor: border.default }}
            >
              <span
                aria-hidden
                className="flex size-8 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: statusVivid.success.bg }}
              >
                <CalendarDays className="size-4" style={{ color: statusVivid.success.color }} />
              </span>
              <span>
                <span className="block text-body font-semibold" style={{ color: 'var(--heading)' }}>
                  Nothing needs you today
                </span>
                <span className="block text-caption" style={{ color: text.muted }}>
                  {firstName}&rsquo;s fees are paid up to date.
                </span>
              </span>
            </div>
          )}

          {/* ── The day, full width: the slots need the room ── */}
          <SectionCard title="Today at school" className={CARD}>
            {!openToday ? (
              <p className="text-body-muted" style={{ color: text.muted }}>
                The school is closed today. Classes resume on{' '}
                {nextSchoolDay(config.schoolDays, new Date())}.
              </p>
            ) : (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {teaching.map((period: PeriodDefinition) => {
                  const slot = slots.find(candidate => candidate.periodId === period.id)
                  const running = now?.period.id === period.id
                  return (
                    <div
                      key={period.id}
                      className="flex min-w-[132px] flex-1 flex-col gap-1 rounded-lg p-2.5"
                      style={{
                        backgroundColor: running ? 'var(--accent)' : 'var(--muted)',
                        border: `1px ${slot ? 'solid' : 'dashed'} ${running ? 'var(--ring)' : border.default}`,
                      }}
                    >
                      <span className="text-caption" style={{ color: text.muted }}>
                        {period.startTime}
                      </span>
                      <span
                        className="truncate text-body font-semibold"
                        style={{ color: slot ? 'var(--heading)' : text.muted }}
                      >
                        {slot?.subjectName ?? 'Free'}
                      </span>
                      <span className="truncate text-caption" style={{ color: text.muted }}>
                        {slot?.teacherName ?? '—'}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </SectionCard>

          <TileWrapper columns={{ default: 1, md: 12 }} gap={16}>
            {/* Attendance and marks on the left, the classroom and what is coming
                on the right. The two columns balance by HEIGHT — the old
                7/5-then-5/7 interleave left one dead-ending in whitespace. */}
            <Tile id="family-left" width={{ default: 1, md: 7 }}>
              <div className="flex flex-col gap-4">
  <SectionCard title="Attendance this month" className={CARD}>
                  {!month ? (
                    <Skeleton className="h-24 w-full rounded-lg" />
                  ) : (
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-wrap gap-1.5">
                        {month.highlights.map(highlight => {
                          const paint = DAY_MARK[highlight.variant] ?? DAY_MARK.present
                          const weekday = new Date(
                            new Date().getFullYear(),
                            new Date().getMonth(),
                            highlight.date,
                          )
                          return (
                            <span
                              key={highlight.date}
                              title={`${paint.title} — ${highlight.date}`}
                              className="flex flex-col items-center gap-1"
                            >
                              <span
                                className="flex items-center justify-center rounded-md"
                                style={{
                                  width: 30,
                                  height: 30,
                                  backgroundColor: paint.tone.bg,
                                  color: paint.tone.color,
                                  fontSize: fontSizes.xs,
                                  fontWeight: 700,
                                }}
                              >
                                {paint.letter || highlight.date}
                              </span>
                              <span
                                className="text-caption"
                                style={{ color: text.muted, fontSize: '10px' }}
                              >
                                {WEEKDAY_LETTER[mondayIndex(weekday)]}
                              </span>
                            </span>
                          )
                        })}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        {(['late', 'absent', 'sick', 'onLeave'] as const).map(key => (
                          <span
                            key={key}
                            className="flex items-center gap-1.5 text-caption"
                            style={{ color: text.muted }}
                          >
                            <span
                              className="flex size-4 items-center justify-center rounded"
                              style={{
                                backgroundColor: DAY_MARK[key].tone.bg,
                                color: DAY_MARK[key].tone.color,
                                fontSize: '9px',
                                fontWeight: 800,
                              }}
                            >
                              {DAY_MARK[key].letter}
                            </span>
                            {DAY_MARK[key].title}
                          </span>
                        ))}
                        <span className="text-caption" style={{ color: text.muted }}>
                          Present days carry the date.
                        </span>
                      </div>
                    </div>
                  )}
                </SectionCard>

                {/* ── Term 1 marks: the child's bar, and the class's on the same axis ── */}
                <SectionCard title={marks ? `${marks.examName} marks` : 'Marks'} className={CARD}>
                  {!marks ? (
                    <Skeleton className="h-32 w-full rounded-lg" />
                  ) : (
                    <div className="flex flex-col gap-3">
                      <p className="text-body-muted" style={{ color: text.muted }}>
                        The upright marker on each bar is the class average.
                      </p>
                      <div className="flex flex-col gap-2.5">
                        {marks.subjects.map(subject => {
                          const scored = marks.row.subjects[subject.id]?.marks ?? null
                          const average = marks.summary.subjectAverages[subject.id] ?? 0
                          const pct = scored === null ? 0 : (scored / marks.maxMarks) * 100
                          const avgPct = (average / marks.maxMarks) * 100
                          return (
                            <div key={subject.id} className="flex flex-col gap-1">
                              <div className="flex items-baseline justify-between gap-2">
                                <span className="truncate text-caption" style={{ color: text.body }}>
                                  {subject.name}
                                </span>
                                <span
                                  className="text-caption font-semibold"
                                  style={{ color: scored === null ? text.muted : 'var(--heading)' }}
                                >
                                  {scored === null ? 'Not marked' : `${scored} / ${marks.maxMarks}`}
                                </span>
                              </div>
                              <span
                                className="relative block w-full overflow-hidden rounded-full"
                                style={{ height: 8, backgroundColor: accent.soft }}
                              >
                                <span
                                  className="absolute inset-y-0 left-0 rounded-full"
                                  style={{ width: `${pct}%`, backgroundColor: 'var(--primary)' }}
                                />
                                {/* The class as a line rather than a second bar — two bars a
                                    subject reads as a comparison nobody asked for. */}
                                {average > 0 && (
                                  <span
                                    aria-hidden
                                    title={`Class average ${average}`}
                                    className="absolute inset-y-0"
                                    style={{
                                      left: `${Math.min(avgPct, 100)}%`,
                                      width: 2,
                                      backgroundColor: 'var(--heading)',
                                      opacity: 0.45,
                                    }}
                                  />
                                )}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </SectionCard>
              </div>
            </Tile>

            <Tile id="family-right" width={{ default: 1, md: 5 }}>
              <div className="flex flex-col gap-4">
  <SectionCard title="From the classroom" className={CARD}>
                  {!note ? (
                    <p className="text-body-muted" style={{ color: text.muted }}>
                      Nothing from {firstName}&rsquo;s teachers this term.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      <StatusPill
                        label={note.type}
                        config={note.type === 'Positive Note' ? statusVivid.success : statusVivid.warning}
                      />
                      <p className="text-body" style={{ color: 'var(--heading)' }}>
                        {note.details}
                      </p>
                      <div
                        className="flex items-center gap-2 border-t pt-2.5"
                        style={{ borderColor: border.default }}
                      >
                        <StudentAvatar name={note.reportedBy} size={28} />
                        <span className="text-caption" style={{ color: text.muted }}>
                          {note.reportedBy} · {note.date}
                        </span>
                      </div>
                      {/* Same as the hero's note button: the module does not
                          exist, so the button says so. Named after the teacher
                          who wrote the note, because there is something to
                          reply TO — a generic "send a message" is what this
                          replaced. */}
                      <button
                        type="button"
                        onClick={() =>
                          setAsking({ reason: 'classroom-note', teacherName: note.reportedBy })
                        }
                        className="tap-target w-fit rounded-md px-2.5 py-1 text-caption font-medium transition-colors hover:opacity-80"
                        style={{ backgroundColor: accent.soft, color: 'var(--heading)' }}
                      >
                        Reply to {note.reportedBy.split(' ')[0]}
                      </button>
                    </div>
                  )}
                </SectionCard>

  <SectionCard title="Coming up" className={CARD}>
                  {events.length === 0 ? (
                    <Skeleton className="h-20 w-full rounded-lg" />
                  ) : (
                    <ul className="flex flex-col gap-3">
                      {events.slice(0, 3).map(event => {
                        const [monthLabel, dayLabel] = event.date.split(' ')
                        return (
                          <li key={event.id} className="flex items-start gap-3">
                            <span
                              aria-hidden
                              className="flex size-10 shrink-0 flex-col items-center justify-center rounded-lg"
                              style={{ backgroundColor: 'var(--muted)' }}
                            >
                              <span
                                className="text-body font-bold leading-none"
                                style={{ color: 'var(--heading)' }}
                              >
                                {dayLabel ?? ''}
                              </span>
                              <span
                                className="uppercase"
                                style={{ fontSize: '9px', fontWeight: 600, color: text.muted }}
                              >
                                {monthLabel?.slice(0, 3) ?? ''}
                              </span>
                            </span>
                            <span className="min-w-0">
                              <span
                                className="block text-body font-medium"
                                style={{ color: 'var(--heading)' }}
                              >
                                {event.title}
                              </span>
                              <span className="block text-caption" style={{ color: text.muted }}>
                                {event.startTime} · {event.subtitle}
                              </span>
                            </span>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </SectionCard>

                {/* ── Getting home: absent entirely unless there is a bus AND a seat on it ── */}
                {ride && (
                  <SectionCard title="Getting home" className={CARD}>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-body font-semibold" style={{ color: 'var(--heading)' }}>
                          {ride.route?.name ?? 'Route'}
                        </span>
                        <span
                          className="rounded-full px-2 py-0.5 text-caption"
                          style={{ backgroundColor: accent.soft, color: text.muted }}
                        >
                          Add-on
                        </span>
                      </div>
                      <span className="text-caption" style={{ color: text.muted }}>
                        {[ride.assignment.stopName, ride.assignment.pickupTime].filter(Boolean).join(' · ')}
                      </span>
                      <div className="flex flex-wrap gap-x-6 gap-y-1 pt-1">
                        {ride.vehicle && (
                          <span className="flex flex-col">
                            <span className="text-caption" style={{ color: text.muted }}>
                              Bus
                            </span>
                            <span className="text-caption font-semibold" style={{ color: text.body }}>
                              {ride.vehicle.registrationNumber}
                            </span>
                          </span>
                        )}
                        {ride.driver && (
                          <span className="flex flex-col">
                            <span className="text-caption" style={{ color: text.muted }}>
                              Driver
                            </span>
                            <span className="text-caption font-semibold" style={{ color: text.body }}>
                              {`${ride.driver.firstName} ${ride.driver.lastName}`}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  </SectionCard>
                )}
              </div>
            </Tile>
          </TileWrapper>

          {/* From the school: a full-width band of short cards. Notices are short;
              stacking them in a rail only made that column longer. */}
<SectionCard title="From the school" className={CARD}>
              {notices.length === 0 ? (
                <p className="text-body-muted" style={{ color: text.muted }}>
                  Nothing on the board for you right now.
                </p>
              ) : (
                <TileWrapper columns={{ default: 1, lg: 3 }} gap={10}>
                  {notices.map(notice => (
                    <div
                      key={notice.id}
                      className="flex flex-col gap-1 rounded-lg p-3"
                      style={{
                        backgroundColor: 'var(--muted)',
                        border: `1px solid ${border.subtle}`,
                      }}
                    >
                      <span
                        className="text-body font-medium leading-snug"
                        style={{ color: 'var(--heading)' }}
                      >
                        {notice.title}
                      </span>
                      <span className="text-caption" style={{ color: text.muted }}>
                        {notice.audience} · {notice.postDate}
                      </span>
                    </div>
                  ))}
                </TileWrapper>
              )}
            </SectionCard>

          <div className="flex justify-end">
            <Button variant="ghost" size="sm" asChild>
              <a href="/attendance">
                {firstName}&rsquo;s full attendance
                <ArrowRight className="size-3.5" />
              </a>
            </Button>
          </div>
        </>
      )}

      {/*
        One dialog for both buttons. It asks for a note and nothing else: the
        child, the parent and the teacher are all already known, and a form that
        re-asks what the page can see is a form people abandon.
      */}
      <Dialog
        open={asking !== null}
        onOpenChange={open => {
          if (!open && !sending) {
            setAsking(null)
            setAskNote('')
          }
        }}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--heading)' }}>
              {asking?.teacherName ? `Reply to ${asking.teacherName}` : 'Send a note to the school'}
            </DialogTitle>
            <DialogDescription>
              {asking?.reason === 'absence'
                ? `Tell the school why ${firstName} is away. Somebody will call you back.`
                : `Your message goes to ${asking?.teacherName ?? 'the school'}, who will call you back.`}
            </DialogDescription>
          </DialogHeader>

          <Textarea
            value={askNote}
            onChange={event => setAskNote(event.target.value)}
            rows={4}
            maxLength={500}
            autoFocus
            placeholder={
              asking?.reason === 'absence'
                ? 'He has a fever and will be back on Thursday.'
                : 'I would like to talk about the homework note.'
            }
          />

          <DialogFooter className="flex-row items-center justify-between sm:justify-between">
            <span className="text-caption" style={{ color: text.muted }}>
              {/* Said plainly, because it is the honest description of what this
                  does — it books a call, it does not start a conversation. */}
              This asks the school to ring you. It is not a chat.
            </span>
            <Button onClick={sendCallback} disabled={sending || askNote.trim().length === 0}>
              {sending ? 'Sending…' : 'Ask for a call'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
