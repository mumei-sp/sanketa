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
 * An account-holder at this school, as a school's seed script would state it.
 *
 * ── Not "a profile" — a *login attached to* a profile ──────────────────
 * Every person at the school is a profile, whether or not they can sign in:
 * 441 students, 31 staff and 655 parents at Kendriya, against five logins.
 * Those profiles are built from the capacity tables — a student row, a
 * teacher row, a parent row — and this block does one further thing, which is
 * to say which of them a login belongs to.
 *
 * So an entry does not create a profile. It *finds* one and attaches a
 * `users.id` to it, except for pure staff, whose employment record this block
 * is the only source of.
 *
 * ── Two ways to name the profile ──────────────────────────────────────
 * `id` when the school controls it: a teacher's profile id is their row in the
 * faculty list, and a member of the office staff has no other record, so the
 * seed names one. `parentPhone` when the parents table minted it — parent ids
 * come out of seeding the guardians on the roster, so a fixture cannot know
 * one, and the number is the fact it does know.
 *
 * `key` is how the roles and types below refer back here, since half the
 * entries do not know their own id until seed time.
 */
export interface ProfileFixture {
  /** Fixture-local handle, used by `roles` and `typeCodes` below. */
  key: string
  /** → the global `users.id`. */
  userId: string
  /** The profile id, when this school controls it — a teacher or staff row. */
  id?: string
  /** Their number, when the profile is one the parents table created. */
  parentPhone?: string
  /**
   * Their name, for somebody with no record to take one from.
   *
   * `user_profiles` carries name columns in the schema, and the office staff
   * have no student, teacher or parent row to read one off. Their login has
   * the name too, but that is the *global* database and a tenant seed does not
   * reach across it — which is the same reason provisioning writes the name
   * into both.
   */
  fullName?: string
  /**
   * An employment record, for somebody who is staff and not a teacher.
   *
   * The `staff` capacity table, which nothing else seeds: an administrator,
   * a principal and an accountant have no student, teacher or parent row, so
   * without this they would be profiles with no capacity at all — which is
   * what they were, pointing at employee numbers that resolved to nothing.
   */
  staff?: { employeeId: string; designation: string; department?: string }
  /** `teacher_classes`. Per school, which is why it is here and not global. */
  assignedClasses?: string[]
}

/**
 * A guardian who is already somebody else here.
 *
 * The member of staff whose child attends the school appears twice in the raw
 * data: once in the faculty list and once as a name and number on their own
 * child's record. They are one person and must be one profile, or their
 * teaching and their parenthood hang off two unrelated ids.
 *
 * Stated by the school rather than inferred. The mock used to match them at
 * runtime on the last ten digits of a phone number, which is the kind of
 * heuristic that works on a fixture and fails the first time two parents share
 * a family mobile. Reconciling duplicate records at import is a seed's job,
 * and this is the seed saying who is who.
 */
export interface StaffGuardianFixture {
  /** The number on the child's record. */
  phone: string
  /** The profile it actually belongs to. */
  profileId: string
}

/** Who is at this school, what they may do, and what kind of person they are. */
export interface TenantAccessFixtures {
  profiles: ProfileFixture[]
  /** Many per profile — that is the whole point. */
  roles: { key: string; roleId: string; expiresAt?: string }[]
  /** Classifications, by built-in code. */
  typeCodes: { key: string; code: string; isPrimary?: boolean }[]
  /** Guardians who are already a profile here. See above. */
  staffGuardians?: StaffGuardianFixture[]
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
