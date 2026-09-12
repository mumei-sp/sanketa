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
import { border, text, status, statusVivid, withOpacity } from '@/theme/colors'
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
 * The lift every other card in the app has, and `SectionCard` does not.
 *
 * `Tile`'s `shadowed` prop resolves to Tailwind's `shadow-xs` — a flat, *grey*
 * `0 1px 2px rgb(0 0 0 / 0.05)`. The design system's own card shadow is
 * `--shadow-card`: `0 1px 2px rgb(21 68 110 / 0.03), 0 16px 36px -22px rgb(21
 * 68 110 / 0.24)`, deep and wide and navy-tinted. On this page's cool canvas
 * the grey one reads dingy and the cards sit flat instead of floating, which
 * is most of what "it doesn't look like the design" turned out to mean.
 *
 * `ui/card.tsx` already pairs `shadow-card` with `border-card-border` — the
 * faint edge that defines a corner where white meets white. This is that
 * pairing, and `Tile` puts `className` last so it wins over `shadow-xs`.
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

  const [detail, setDetail] = React.useState<StudentDetailData | null>(null)
  const [mark, setMark] = React.useState<TodayMark>('unmarked')
  const [slots, setSlots] = React.useState<TimetableSlot[]>([])
  const [events, setEvents] = React.useState<CalendarEvent[]>([])
  const [notices, setNotices] = React.useState<NoticeBoardEntry[]>([])
  const [fees, setFees] = React.useState<FeeCollectionRecord[]>([])

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
            {/* ── The month, as a shape ── */}
            <Tile id="family-attendance" width={{ default: 1, md: 7 }}>
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
            </Tile>

            {/* ── From the classroom ── */}
            <Tile id="family-note" width={{ default: 1, md: 5 }}>
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
                  </div>
                )}
              </SectionCard>
            </Tile>

            {/* ── Coming up ── */}
            <Tile id="family-events" width={{ default: 1, md: 5 }}>
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
            </Tile>

            {/* ── From the school ── */}
            <Tile id="family-notices" width={{ default: 1, md: 7 }}>
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
            </Tile>
          </TileWrapper>

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
    </div>
  )
}
