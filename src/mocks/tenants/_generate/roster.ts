/**
 * The student-roster generator.
 *
 * ── Why generated ──────────────────────────────────────────────────────
 * A school of forty students cannot be a demo of a school. Every headline the
 * app showed was a small number multiplied by thirty — 40 × 30 = "1,200
 * Enrolled Students" — so the dashboard described a campus you could not page
 * through, five of the nineteen classes held anyone at all, and grades 1 to 6
 * were empty while the timetable offered them. The multiplier was a way of
 * admitting the roster was too small; this generates a roster that is the
 * right size instead, and the multiplier is gone.
 *
 * ── Families first, students second ────────────────────────────────────
 * The generator builds households and then enrols their children, rather than
 * making four hundred unrelated students. That ordering is what produces the
 * things a school's data actually contains: siblings in different grades who
 * share a surname, an address and one fee-paying father; a parent account that
 * sees two children; a phone number that belongs to a family rather than to a
 * row. Generated student-by-student, none of that exists, and the parent
 * table — which seeds itself by matching guardians across students — would
 * find four hundred families of one.
 *
 * ── Anchors ────────────────────────────────────────────────────────────
 * A handful of students are facts other fixtures depend on: the teacher whose
 * own child is in a class she does not teach, and the father with a child at
 * each of the two schools. Those are hand-written and passed in as `anchors`;
 * the generator fills the rest of their classes around them and never renames
 * or renumbers them.
 */

import type { Student, StudentPerformance } from '@/features/students/types'
import type { Gender } from '@/types/user-profile'
import { rng, int, pick, chance, bell, weighted, type Rng } from './random'
import {
  COMMUNITIES,
  OCCUPATIONS,
  STREET_FORMS,
  ORDINALS,
  HOBBIES,
  MEDICAL_NOTES,
  type City,
  type Community,
} from './names'

// ── Configuration ─────────────────────────────────────────────────────

/** One class the generator has to fill. */
export interface SectionSpec {
  grade: string
  section: string
}

export interface RosterConfig {
  /**
   * Seed namespace — the school's code.
   *
   * Two schools must not draw the same stream, or Vidya Mandir's roster is
   * Kendriya's first N students with different ids, which is the one thing a
   * second school exists to disprove.
   */
  code: string
  /** The catchment its families live in. */
  city: City
  /** Which classes exist here. */
  sections: readonly SectionSpec[]
  /** Roughly how many sit in one, before the per-grade taper below. */
  classSize: readonly [number, number]
  /** Human code prefix — `S-2101`, `VM-3001`. */
  codePrefix: string
  codeBase: number
  /** Admission-number prefix — `ADM-2019-014`. */
  admissionPrefix: string
  /** Profile-id prefix, so two schools' ids never read alike in a log. */
  idPrefix: string
  /** First `users.id` for this school's students. */
  userIdBase: number
  /** First mobile number, so no two families anywhere share one. */
  phoneBase: number
  /** The April the current academic year began. */
  academicYearStart: number
  /** Hand-written rows that must survive verbatim. See the note above. */
  anchors?: readonly Student[]
}

// ── Small helpers ─────────────────────────────────────────────────────

const pad2 = (n: number) => String(n).padStart(2, '0')
const pad3 = (n: number) => String(n).padStart(3, '0')

/** `9845123457` — a plausible Indian mobile, unique by construction. */
function phoneAt(base: number, offset: number): string {
  return String(base + offset)
}

/**
 * Class size, tapering upward through the school.
 *
 * Junior sections are fuller than senior ones everywhere: children leave for
 * other boards, for other cities, and for the schools that promise a better
 * board result in class 11. A school with identical class sizes from 1 to 10
 * has never lost a student.
 */
function sizeFor(source: Rng, grade: string, [min, max]: readonly [number, number]): number {
  const g = Number(grade)
  const taper = g <= 5 ? 1 : g <= 8 ? 0.92 : 0.82
  return Math.max(8, Math.round(bell(source, min, max) * taper))
}

/** An address in this city — house, cross, locality, pincode. */
function addressIn(source: Rng, city: City): string {
  const locality = pick(source, city.localities)
  const form = pick(source, STREET_FORMS)
  const street = form
    .replace('{n}', String(int(source, 1, 240)))
    .replace('{n2}', String(int(source, 101, 706)))
    .replace('{ord}', pick(source, ORDINALS))
    .replace('{locality}', locality.name)
  return `${street}, ${city.name}, ${city.state} ${locality.pincode}, India`
}

/**
 * A date of birth that agrees with the grade.
 *
 * Class 1 at five-going-on-six, one year per grade after that. Ages that do
 * not follow the grade are the fastest way to make a roster read as fake, and
 * the report-card and promotion screens both put an age next to a class.
 */
function dobFor(source: Rng, grade: string, academicYearStart: number): string {
  const year = academicYearStart - 5 - Number(grade)
  const month = int(source, 1, 12)
  // 28 everywhere: a February 30th in a fixture is a bug report waiting to be
  // filed, and nobody looks at the day of the month.
  const day = int(source, 1, 28)
  return `${year}-${pad2(month)}-${pad2(day)}`
}

/**
 * Marks, clustered where a class's marks cluster.
 *
 * Centred in the low seventies, which is where a class average actually sits.
 * A flat draw across the whole pass range puts as many students on 40 as on
 * 85 and makes every chart built on it look like noise; it also inverts the
 * performance bands, so most of the school comes out needing support.
 */
function percentageFor(source: Rng): number {
  // Two populations, not one: the bulk of a class sits in the sixties to
  // nineties, and a real minority is genuinely behind. A single distribution
  // gives you either no struggling students at all or a school where half the
  // roster needs support — and the second is what the intervention screens
  // were being built against.
  return chance(source, 0.88)
    ? Math.round(bell(source, 55, 99))
    : Math.round(bell(source, 28, 62))
}

function performanceFor(percentage: number): StudentPerformance {
  if (percentage >= 65) return 'Good'
  if (percentage >= 45) return 'Needs Support'
  return 'At Risk'
}

const avatarFor = (name: string) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`

// ── Households ────────────────────────────────────────────────────────

/** One family, generated once and drawn on by each of its children. */
interface Household {
  community: Community
  surname: string
  fatherName: string
  motherName: string
  fatherPhone: string
  motherPhone: string
  address: string
  fatherOccupation: string
  motherOccupation: string
  /**
   * Which guardians the school actually has on file.
   *
   * Not every record has both. A school with a father and a mother on every
   * single row has never enrolled a child raised by a grandmother, and the
   * guardian section of the student form exists precisely for the rows that
   * are not the ordinary case.
   */
  guardianShape: 'both' | 'father-only' | 'mother-only' | 'both-plus-guardian'
  /** Grades its children sit in — distinct, because twins are a different case. */
  grades: string[]
}

/**
 * Pick a surname, spreading the load across the community's pool.
 *
 * Two candidates, take the less-used one — "power of two choices", which
 * flattens a distribution far better than one draw for the cost of a second
 * pull. A single draw gave a class of twenty-four with three Baigs and two
 * pairs besides: repeated surnames in a register are real, but that many in
 * one class is the birthday paradox, not a neighbourhood.
 */
function spreadSurname(source: Rng, community: Community, used: Map<string, number>): string {
  const first = pick(source, community.surnames)
  const second = pick(source, community.surnames)
  const count = (name: string) => used.get(name) ?? 0
  const chosen = count(second) < count(first) ? second : first
  used.set(chosen, count(chosen) + 1)
  return chosen
}

function makeHousehold(
  source: Rng,
  config: RosterConfig,
  index: number,
  surnamesUsed: Map<string, number>,
): Household {
  const community = weighted(source, COMMUNITIES)
  const shapeRoll = source()
  return {
    community,
    surname: spreadSurname(source, community, surnamesUsed),
    fatherName: pick(source, community.fathers),
    motherName: pick(source, community.mothers),
    // Two numbers per household, both unique across the school — the second
    // parent needs one of their own or they can never hold an account, since
    // a mobile number identifies exactly one login.
    fatherPhone: phoneAt(config.phoneBase, index * 2),
    motherPhone: phoneAt(config.phoneBase, index * 2 + 1),
    address: addressIn(source, config.city),
    fatherOccupation: pick(source, OCCUPATIONS),
    motherOccupation: pick(source, OCCUPATIONS),
    guardianShape:
      shapeRoll < 0.86
        ? 'both'
        : shapeRoll < 0.92
          ? 'both-plus-guardian'
          : shapeRoll < 0.97
            ? 'father-only'
            : 'mother-only',
    grades: [],
  }
}

/**
 * The guardian block as the school's own records carry it.
 *
 * Derived from the household and nothing else — deliberately not from the
 * generator's stream — because two siblings' records have to name the same
 * father with the same number, character for character. The parents table
 * seeds itself by matching guardians across students, so a one-character
 * difference between two children's copies of their father is two fathers,
 * two parent accounts, and a family view that shows one child each.
 */
function guardiansOf(household: Household): Student['guardians'] {
  const father = {
    name: `${household.fatherName} ${household.surname}`,
    phoneCountryCode: '+91',
    phone: household.fatherPhone,
  }
  const mother = {
    name: `${household.motherName} ${household.surname}`,
    phoneCountryCode: '+91',
    phone: household.motherPhone,
  }
  switch (household.guardianShape) {
    case 'father-only':
      return { father }
    case 'mother-only':
      return { mother }
    case 'both-plus-guardian':
      return {
        father,
        mother,
        alternativeGuardian: {
          name: `${pick(rng(household.fatherPhone), household.community.fathers)} ${household.surname}`,
          phoneCountryCode: '+91',
          relation: 'Uncle',
          phone: String(Number(household.fatherPhone) + 100000),
        },
      }
    default:
      return { father, mother }
  }
}

/** Where a transfer-in came from. Real schools, vaguely; nobody checks. */
const PREVIOUS_SCHOOLS: readonly string[] = [
  'St. Joseph’s Boys High School, Bengaluru',
  'Delhi Public School, Bengaluru North',
  'National Public School, Rajajinagar',
  'Vidyaniketan Public School, Hubballi',
  'Kendriya Vidyalaya, Belagavi',
  'Sri Chaitanya Techno School, Hyderabad',
  'Chinmaya Vidyalaya, Chennai',
  'Army Public School, Pune',
]

// ── The generator ─────────────────────────────────────────────────────

/**
 * Build one school's roster.
 *
 * Deterministic: same config, same students, right down to the roll numbers.
 * The student store fingerprints what it seeded from, so a roster that
 * differed per reload would reseed the directory on every page load and throw
 * away anything the demo had typed into it.
 */
export function generateRoster(config: RosterConfig): Student[] {
  const source = rng(`${config.code}:roster:v1`)
  const anchors = config.anchors ?? []

  // ── How many, and where ──
  // Anchors already sit in their classes, so a class only needs filling up to
  // its target — otherwise pinning a student would quietly make her class one
  // bigger than every other.
  const anchorsByClass = new Map<string, number>()
  anchors.forEach(student => {
    const label = student.class ?? `${student.gradeLevel}${student.section}`
    anchorsByClass.set(label, (anchorsByClass.get(label) ?? 0) + 1)
  })

  const vacancies = config.sections.map(spec => {
    const label = `${spec.grade}${spec.section}`
    const target = sizeFor(source, spec.grade, config.classSize)
    return {
      ...spec,
      label,
      remaining: Math.max(0, target - (anchorsByClass.get(label) ?? 0)),
    }
  })

  const seatsByGrade = new Map<string, number>()
  vacancies.forEach(v => {
    seatsByGrade.set(v.grade, (seatsByGrade.get(v.grade) ?? 0) + v.remaining)
  })
  const totalSeats = vacancies.reduce((sum, v) => sum + v.remaining, 0)

  // ── Households, until the seats are taken ──
  const households: Household[] = []
  const surnamesUsed = new Map<string, number>()
  const children: { household: Household; grade: string }[] = []
  const gradesWithSeats = () =>
    [...seatsByGrade.entries()].filter(([, seats]) => seats > 0).map(([grade]) => grade)

  while (children.length < totalSeats) {
    const household = makeHousehold(source, config, households.length, surnamesUsed)
    households.push(household)

    // Most families have one child here. Two is common, three is not — and a
    // roster with no sibling at all cannot demonstrate the parent account that
    // sees two children, which is the case the family view was built for.
    const roll = source()
    const wanted = roll < 0.7 ? 1 : roll < 0.94 ? 2 : 3

    for (let i = 0; i < wanted; i += 1) {
      const available = gradesWithSeats().filter(grade => !household.grades.includes(grade))
      if (available.length === 0 || children.length >= totalSeats) break
      // Siblings are a couple of years apart, not scattered across the school.
      const grade =
        household.grades.length === 0
          ? pick(source, available)
          : (() => {
              const anchorGrade = Number(household.grades[0])
              const near = available.filter(g => Math.abs(Number(g) - anchorGrade) <= 3)
              return near.length > 0 ? pick(source, near) : pick(source, available)
            })()
      household.grades.push(grade)
      children.push({ household, grade })
      seatsByGrade.set(grade, (seatsByGrade.get(grade) ?? 0) - 1)
    }
  }

  // ── Seat every child in a section of its grade ──
  const byLabel = new Map<string, { household: Household; grade: string; section: string }[]>()
  vacancies.forEach(v => byLabel.set(v.label, []))
  children.forEach(child => {
    const options = vacancies.filter(v => v.grade === child.grade && v.remaining > 0)
    const target = options.length > 0
      ? options.reduce((widest, v) => (v.remaining > widest.remaining ? v : widest))
      : vacancies.find(v => v.grade === child.grade)
    if (!target) return
    target.remaining -= 1
    byLabel.get(target.label)?.push({ ...child, section: target.section })
  })

  // ── Turn seats into records ──
  const usedNames = new Set(
    anchors.map(student => (student.fullName ?? student.name ?? '').toLowerCase()),
  )
  const rows: Student[] = []
  let sequence = 0
  const admissionCounters = new Map<number, number>()

  const orderedLabels = config.sections.map(spec => `${spec.grade}${spec.section}`)

  orderedLabels.forEach(label => {
    const seats = byLabel.get(label) ?? []
    const anchored = anchors.filter(
      student => (student.class ?? `${student.gradeLevel}${student.section}`) === label,
    )

    const drafted = seats.map(seat => {
      const { household, grade, section } = seat
      const gender: Gender = chance(source, 0.51) ? 0 : 1
      const pool = gender === 0 ? household.community.boys : household.community.girls

      // A class with two Aditya Reddys is real; a class where the generator
      // did it four times is not. Re-roll a few times, then accept it.
      let firstName = pick(source, pool)
      for (let attempt = 0; attempt < 6; attempt += 1) {
        if (!usedNames.has(`${firstName} ${household.surname}`.toLowerCase())) break
        firstName = pick(source, pool)
      }
      const fullName = `${firstName} ${household.surname}`
      usedNames.add(fullName.toLowerCase())

      return { household, grade, section, gender, firstName, fullName }
    })

    // Roll numbers follow the alphabet, the way a register does — which also
    // means a roll number changes when a student joins mid-year, and that is
    // true of registers too.
    drafted.sort((a, b) => a.fullName.localeCompare(b.fullName))

    const takenRolls = new Set(anchored.map(student => student.rollNumber))
    let rollCursor = 0
    const nextRoll = (grade: string, section: string) => {
      let candidate = ''
      do {
        rollCursor += 1
        candidate = `${pad2(Number(grade))}${section}-${pad2(rollCursor)}`
      } while (takenRolls.has(candidate))
      return candidate
    }

    drafted.forEach(draft => {
      const { household, grade, section, gender, firstName, fullName } = draft
      sequence += 1

      // Most children came up through the school; a few transferred in. The
      // transfer is the case that breaks assumptions elsewhere — no marks from
      // last term, an admission number out of step with the class — so some of
      // the roster has to be one.
      const transferred = Number(grade) > 1 && chance(source, 0.16)
      const joinedGrade = transferred ? int(source, 2, Number(grade)) : 1
      const admissionYear = config.academicYearStart - (Number(grade) - joinedGrade)
      const withinYear = (admissionCounters.get(admissionYear) ?? 0) + 1
      admissionCounters.set(admissionYear, withinYear)

      const percentage = percentageFor(source)
      const hobbyCount = int(source, 1, 3)
      const hobbies = Array.from({ length: hobbyCount }, () => pick(source, HOBBIES))
      const hasMedicalNote = chance(source, 0.09)
      const needsSupport = chance(source, 0.04)

      const guardians = guardiansOf(household)
      const familyPhone = guardians?.father?.phone ?? guardians?.mother?.phone ?? household.fatherPhone
      // Younger children do not carry a phone; the number on the record is the
      // one the school rings, which is a parent's.
      const ownsPhone = Number(grade) >= 8 && chance(source, 0.55)

      rows.push({
        id: `${config.idPrefix}${config.codeBase + sequence}`,
        userId: config.userIdBase + sequence,
        profileType: 0,

        firstName,
        lastName: household.surname,
        fullName,
        displayName: fullName,
        preferredName: firstName,
        name: fullName,
        dateOfBirth: dobFor(source, grade, config.academicYearStart),
        gender,

        primaryPhone: ownsPhone ? phoneAt(config.phoneBase, 900000 + sequence) : familyPhone,
        phoneCountryCode: '+91',
        profilePictureUrl: avatarFor(fullName),
        avatarUrl: avatarFor(fullName),
        address: household.address,

        studentId: `${config.codePrefix}${config.codeBase + sequence}`,
        admissionNumber: `${config.admissionPrefix}-${admissionYear}-${pad3(withinYear)}`,
        // June, because that is when an Indian school year actually starts —
        // the config's April is the accounting year.
        admissionDate: `${admissionYear}-06-${pad2(int(source, 1, 24))}`,
        rollNumber: nextRoll(grade, section),
        gradeLevel: grade,
        section,
        class: `${grade}${section}`,

        gpa: Math.round((percentage / 100) * 4 * 10) / 10,
        performance: performanceFor(percentage),
        percentage,
        // A school always has a few children away for a term — a long illness,
        // a family posted out of the city and not yet withdrawn.
        status: chance(source, 0.03) ? 'On Leave' : 'Active',

        studentInfo: {
          hobbies: [...new Set(hobbies)].join(', '),
          specialNeedsSupport: needsSupport,
          medicalConditionAlert: hasMedicalNote,
          medicalInfo: hasMedicalNote ? pick(source, MEDICAL_NOTES) : 'No known allergies',
          fatherOccupation: household.fatherOccupation,
          motherOccupation: household.motherOccupation,
          ...(transferred ? { previousSchool: pick(source, PREVIOUS_SCHOOLS) } : {}),
        },

        guardians,

        syncedAt: `${config.academicYearStart}-04-01T09:00:00.000Z`,
        syncVersion: 1,
      })
    })
  })

  // Anchors first, then the generated roster in class order — so the pinned
  // students are the first thing anyone paging the directory sees, which is
  // what a demo wants.
  return [...anchors.map(student => ({ ...student })), ...rows]
}
