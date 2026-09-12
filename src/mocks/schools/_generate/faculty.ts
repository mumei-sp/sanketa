/**
 * A school's staff room.
 *
 * ── Why a school needs this many ───────────────────────────────────────
 * Nineteen sections of six teaching periods over a five-day week is 570
 * class-periods to cover; a teacher takes somewhere around twenty-four a week
 * and needs the rest for marking, duties and the staff meeting. So a school
 * this size employs about thirty teachers, and the arithmetic is not close:
 * eighteen would be thirty-two periods each, more than there are periods in
 * the week.
 *
 * That never showed while three classes had a timetable and sixteen did not.
 * Building the other sixteen surfaced it — a generator that refuses to
 * double-book simply runs out of people, and the honest fix is to hire rather
 * than to let one teacher take two classes at once. Which is what the old
 * fixture did: its five teachers appeared in every period of all three
 * timetables that existed.
 *
 * ── Why generated rather than typed ───────────────────────────────────
 * Kendriya's eighteen are hand-written and stay hand-written: other fixtures
 * name them, T-1006 is a profile in the access seed, and they are good rows.
 * Everything beyond them is arithmetic — so many Hindi teachers, so many for
 * English — driven by the vacancy table each school passes in, which is the
 * load its timetable implies. Typing thirty more rows per school by hand would
 * be thirty more chances to invent a name from the wrong country.
 *
 * ── Why per school ────────────────────────────────────────────────────
 * Because a teacher is not a fact about a login, it is a fact about a school.
 * One shared faculty meant Priya Nair taught 9A Social Studies in Room 901 at
 * both schools, in the same period on the same day — the tenant boundary the
 * roster respects, silently ignored by the staff list, and by everything built
 * on it: the timetable, the register's signature, the mark sheet's, the
 * workload chart and every teacher's detail page.
 */

import type { Teacher } from '@/features/teachers/types'
import { PHONE_COUNTRY_CODE } from '@/mocks/_shared/constants'
import { rng, int, pick, type Rng } from './random'
import { COMMUNITIES } from './names'

/**
 * How many of each subject a school has to hire, and what their row says.
 *
 * Counted from the weekly quotas in `timetable/generate.ts`: the periods a
 * department owes across all nineteen sections, divided by a teacher's week.
 * Anyone already in post is subtracted, which is why Kendriya's table asks
 * for no Social Studies teachers and Vidya Mandir's asks for four.
 */
export interface Vacancy {
  subject: string
  count: number
}

export interface FacultyConfig {
  /** Seed namespace — the school's code, so two staff rooms differ. */
  code: string
  /**
   * Prefix for the human teacher code — `T-1019`, `VT-1001`.
   *
   * Distinct per school. Under schema-per-tenant the two schools could
   * legitimately both issue `T-1001`, and overlapping ids would be the more
   * faithful mock — but a leak across the boundary would then be silent, and
   * the whole reason this file exists is that one was.
   */
  codePrefix: string
  /** Prefix for the profile id, so `vm-19` never reads as Kendriya's `19`. */
  idPrefix: string
  /** Where this school's series starts — past any hand-written rows. */
  idBase: number
  /** Email domain. A school's staff are on its own domain. */
  emailDomain: string
  /** First mobile number, so no two staff anywhere share one. */
  phoneBase: number
  /** Posts to fill. */
  vacancies: readonly Vacancy[]
}

/**
 * A name for somebody in their thirties or forties.
 *
 * Drawn from the parents' pools rather than the children's, because those are
 * the names of that generation — a staff room of Vihaans and Saanvis would be
 * a staff room of eight-year-olds. Weighted toward women, which is what an
 * Indian school staff room is.
 */
function teacherName(source: Rng): { first: string; last: string; gender: 0 | 1 } {
  const community = pick(source, COMMUNITIES)
  const woman = source() < 0.62
  return {
    first: pick(source, woman ? community.mothers : community.fathers),
    last: pick(source, community.surnames),
    gender: woman ? 1 : 0,
  }
}

const slug = (text: string) => text.toLowerCase().replace(/[^a-z]+/g, '')

/**
 * Hire a school's staff.
 *
 * Where a school already has hand-written rows, the ids continue their series
 * so the two halves read as one list and nothing has to know which is which.
 */
export function generateFaculty(config: FacultyConfig): Teacher[] {
  const source = rng(`${config.code}:faculty:v1`)
  const rows: Teacher[] = []
  const takenNames = new Set<string>()

  config.vacancies.forEach(({ subject, count }) => {
    for (let i = 0; i < count; i += 1) {
      let drawn = teacherName(source)
      for (let attempt = 0; attempt < 8 && takenNames.has(`${drawn.first} ${drawn.last}`); attempt += 1) {
        drawn = teacherName(source)
      }
      const { first, last, gender } = drawn
      const fullName = `${first} ${last}`
      takenNames.add(fullName)

      const sequence = config.idBase + rows.length
      rows.push({
        id: `${config.idPrefix}${sequence}`,
        userId: 2000 + sequence,
        profileType: 1,
        firstName: first,
        lastName: last,
        fullName,
        displayName: fullName,
        dateOfBirth: `${int(source, 1971, 1996)}-${String(int(source, 1, 12)).padStart(2, '0')}-${String(int(source, 1, 28)).padStart(2, '0')}`,
        gender,
        primaryPhone: String(config.phoneBase + sequence * 137 + int(source, 100, 999)),
        phoneCountryCode: PHONE_COUNTRY_CODE,
        profilePictureUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName)}`,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName)}`,
        teacherId: `${config.codePrefix}-${1000 + sequence}`,
        subject,
        // Left for `teachers.ts` to fill, which spreads every section across
        // the whole faculty rather than letting each half guess.
        assignedClasses: [],
        employmentType: source() < 0.85 ? 'Full-Time' : 'Part-Time',
        email: `${slug(first)}.${slug(last)}@${config.emailDomain}`,
      })
    }
  })

  return rows
}

/**
 * Deal the sections round a school's faculty.
 *
 * `assignedClasses` is authorisation — the classes whose registers and marks a
 * teacher may amend — so it is stated rather than derived from the timetable,
 * for the reason set out on the field itself. What it must not be is lopsided:
 * generated rows arrive with none, and leaving them empty means a third of the
 * staff can read everything and write nothing.
 *
 * Two each, dealt round the section list, so every section is held and no
 * section is held by half the school. Rows that already state their own are
 * left alone: Kendriya's hand-written eighteen say which classes they hold,
 * and the access seed relies on Meera Iyengar holding 8A and 8B.
 */
export function dealSections(faculty: Teacher[], sections: readonly string[]): Teacher[] {
  if (sections.length === 0) return faculty
  let cursor = 0
  faculty.forEach(teacher => {
    const held = teacher.assignedClasses?.length ?? 0
    if (held > 0) {
      cursor += held
      return
    }
    teacher.assignedClasses = [
      sections[cursor % sections.length],
      sections[(cursor + 1) % sections.length],
    ]
    cursor += 2
  })
  return faculty
}
