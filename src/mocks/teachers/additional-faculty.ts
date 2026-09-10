/**
 * The rest of the staff room.
 *
 * ── Why there had to be more of them ───────────────────────────────────
 * The faculty list held eighteen teachers. The school runs nineteen sections
 * of six teaching periods over a five-day week, which is 570 class-periods to
 * cover; a teacher takes somewhere around twenty-four a week and needs the
 * rest for marking, duties and the staff meeting. Eighteen teachers cannot
 * staff that, and the arithmetic is not close — it would be thirty-two periods
 * each, more than there are periods in the week.
 *
 * That never showed while three classes had a timetable and sixteen did not.
 * Building the other sixteen is what surfaced it: a generator that refuses to
 * double-book a teacher simply runs out of people, and the honest fix is to
 * hire rather than to let Ms Lee teach two classes at once. Which is what the
 * fixture used to do — its four teachers appeared in every period of every one
 * of the three timetables that existed.
 *
 * ── Why generated rather than typed ───────────────────────────────────
 * The eighteen are hand-written and stay hand-written: other fixtures name
 * them, T-1006 is a profile in the access seed, and they are good rows. What
 * is added is arithmetic — so many Hindi teachers, so many for English —
 * driven by the table below, which is the load the timetable actually implies.
 * Typing thirteen more rows by hand would be thirteen more chances to invent a
 * name from the wrong country.
 */

import type { Teacher } from '@/features/teachers/types'
import { SCHOOL_DOMAIN, PHONE_COUNTRY_CODE } from '@/mocks/_shared/constants'
import { rng, int, pick, type Rng } from '@/mocks/tenants/_generate/random'
import { COMMUNITIES } from '@/mocks/tenants/_generate/names'

/**
 * How many more each department needs, and the subject the new rows carry.
 *
 * Counted from the weekly quotas in `timetable/generate.ts`: the periods a
 * department owes across all nineteen sections, divided by a teacher's week.
 * The eighteen already in post are subtracted, which is why Social Studies and
 * Art appear nowhere here — they are staffed.
 */
const VACANCIES: readonly { subject: string; count: number }[] = [
  { subject: 'Mathematics', count: 2 },
  { subject: 'English Language', count: 2 },
  { subject: 'English Literature', count: 1 },
  { subject: 'Science - Biology', count: 1 },
  { subject: 'Hindi', count: 3 },
  { subject: 'Computer Science', count: 1 },
  { subject: 'Physical Education', count: 1 },
  { subject: 'Arts - Music', count: 1 },
  // Nobody ran the library, and every class has a library period.
  { subject: 'Library', count: 1 },
]

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
 * The generated half of the faculty.
 *
 * Ids continue the hand-written series — T-1019 upward — so the two halves
 * read as one list and nothing has to know which is which.
 */
export const additionalFaculty: Teacher[] = (() => {
  const source = rng('faculty:v1')
  const rows: Teacher[] = []
  const takenNames = new Set<string>()

  VACANCIES.forEach(({ subject, count }) => {
    for (let i = 0; i < count; i += 1) {
      let drawn = teacherName(source)
      for (let attempt = 0; attempt < 8 && takenNames.has(`${drawn.first} ${drawn.last}`); attempt += 1) {
        drawn = teacherName(source)
      }
      const { first, last, gender } = drawn
      const fullName = `${first} ${last}`
      takenNames.add(fullName)

      const sequence = 19 + rows.length
      rows.push({
        id: String(sequence),
        userId: 2000 + sequence,
        profileType: 1,
        firstName: first,
        lastName: last,
        fullName,
        displayName: fullName,
        dateOfBirth: `${int(source, 1971, 1996)}-${String(int(source, 1, 12)).padStart(2, '0')}-${String(int(source, 1, 28)).padStart(2, '0')}`,
        gender,
        primaryPhone: String(9740000000 + sequence * 137 + int(source, 100, 999)),
        phoneCountryCode: PHONE_COUNTRY_CODE,
        profilePictureUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName)}`,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName)}`,
        teacherId: `T-${1000 + sequence}`,
        subject,
        // Left for `teachers.ts` to fill, which spreads every section across
        // the whole faculty rather than letting each half guess.
        assignedClasses: [],
        employmentType: source() < 0.85 ? 'Full-Time' : 'Part-Time',
        email: `${slug(first)}.${slug(last)}@${SCHOOL_DOMAIN}`,
      })
    }
  })

  return rows
})()
