/**
 * What one school's folder provides.
 *
 * A school's schema starts empty and is filled by its seed script. This is
 * that script's contents, per school — the rows, never the tables.
 *
 * Everything is optional except the students, because a school with no roster
 * is not a school anyone can demonstrate. A school that supplies nothing else
 * gets the built-in roles every school gets and the same starting data for the
 * features whose fixtures are not yet school-specific.
 */

import type { Student } from '@/features/students/types'
import type { Teacher } from '@/features/teachers/types'
import type { FleetFixtures } from './_generate/transport'
import type { ExpenseFixtures } from './_generate/expenses'
import type { SchoolConfig } from '@/config/school-config'
import type { NoticeBoardEntry } from '@/features/notice-board/types'
import type { CalendarEvent } from '@/features/calendar/types'
import type { TodoItem } from '@/features/dashboard/types'
import type { Role } from '@/config/permissions'

/**
 * One person's profile at this school, as a school's seed script would state it.
 *
 * `parentPhone` rather than a parent id: parent ids are generated when the
 * parents table seeds itself from the roster, so a fixture cannot know one.
 * A number is a fact about the person, and the store does the join — matching
 * on the last ten digits, which is what the parents table does to decide
 * whether two guardians are one human.
 */
export interface ProfileFixture {
  id: string
  /** → the global `users.id`. */
  userId: string
  studentId?: string
  teacherId?: string
  staffId?: string
  /** Their own number, if they are also a parent here. */
  parentPhone?: string
  /** `teacher_classes`. Per school, which is why it is here and not global. */
  assignedClasses?: string[]
}

/** Who is at this school, what they may do, and what kind of person they are. */
export interface TenantAccessFixtures {
  profiles: ProfileFixture[]
  /** Many per profile — that is the whole point. */
  roles: { profileId: string; roleId: string; expiresAt?: string }[]
  /** Classifications, by built-in code. */
  typeCodes: { profileId: string; code: string; isPrimary?: boolean }[]
}

export interface TenantFixtures {
  students: Student[]
  /**
   * The school's own staff.
   *
   * Here rather than shared, because a teacher is a fact about a school and
   * not about the app. One shared list meant the same person taught the same
   * class in the same period at both schools — and everything built on the
   * staff list inherited it: the timetable, the signature on a register, the
   * name on a mark sheet, the workload chart, every teacher's detail page.
   */
  teachers: Teacher[]
  /**
   * The school's buses, drivers and routes.
   *
   * Per school for the same reason and with a louder symptom: shared, a
   * Mysuru school ran five Bangalore routes in vehicles registered KA-01 and
   * carried nobody, because a rider is matched to a route by the locality on
   * their own address.
   */
  transport: FleetFixtures
  /**
   * What the school spends, and what its staff claim back.
   *
   * Per school because the biggest line is salaries and the next is
   * consumables — one depends on who you employ and the other on how many
   * children you teach, and a shared ledger could depend on neither.
   */
  expenses: ExpenseFixtures
  /**
   * The school's own settings, as far as they differ from the app's defaults.
   *
   * Class sections above all. They were the app's — one list, one storage key
   * — so renaming 8B at one school renamed it at the other, and a school of
   * 317 ran the nineteen sections of a school of 441 because it had no way to
   * say otherwise. A partial, so a school states only what is its own.
   */
  config: Partial<SchoolConfig>
  /**
   * What the school has put on its board.
   *
   * The most local thing a school produces, and it was shared: both posted
   * the same nine notices, including the same choir rehearsal postponed for
   * the same auditorium renovation, in two cities four hours apart.
   */
  notices: NoticeBoardEntry[]
  /**
   * Its calendar — exams, meetings, holidays.
   *
   * Also the least shareable thing it has. Shared, the same English
   * Literature exam sat in Room 204 on the same morning at both, and a school
   * in Mysuru had no Dasara.
   */
  calendar: CalendarEvent[]
  /** What the office has on its list this week. */
  todos: TodoItem[]
  /**
   * The school's own people.
   *
   * Absent means nobody has a profile here yet — which is a real state, not an
   * empty one to paper over. A login can hold a membership to a school and be
   * nobody in it; being able to knock is not being expected.
   */
  access?: TenantAccessFixtures
  /**
   * Roles this school invented, on top of the built-in set.
   *
   * The built-ins are the app's, not a school's — every school gets Admin,
   * Teacher, Parent and the rest, and `reconcile` keeps them current across
   * releases. What a school adds is its own: a Librarian at one school and not
   * at another is the whole point of roles being tenant data.
   */
  extraRoles?: Role[]
}
