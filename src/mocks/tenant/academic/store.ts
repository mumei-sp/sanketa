/**
 * `academic-mgmt` — one school's years, terms, grades, sections and subjects.
 *
 * Five tables in one key. They are written together, read together, and a
 * section is meaningless without the grade and year it belongs to, so
 * splitting them would mean five round trips to answer one question.
 *
 * ── What this replaced ─────────────────────────────────────────────────
 * A class section was a bare string. `'8B'` on a student, on a teacher's
 * assignment, on a register, in a timetable — with nothing to point at. The
 * only list of them was `SchoolConfig.classSections`, a UI settings blob,
 * which made a school's academic structure a *preference* rather than a table.
 *
 * The settings screen still edits it, and still should. What changed is which
 * way the data flows: the tables are the source, and `loadSchoolConfig()`
 * projects them into the shape the settings panel speaks.
 *
 * ── Two columns that were doing real damage by their absence ───────────
 * `class_sections.class_teacher_id` — a class had no class teacher, so the
 * register's signature was picked by hashing the section label. A school
 * decides who takes a class; it is not derivable from a timetable, because
 * teaching a class is not the same as being responsible for it.
 *
 * `class_sections.capacity` — "is 8B full?" had no answer. It does now, and
 * `currentEnrollment` is counted off the roster rather than typed, so the two
 * cannot drift.
 */

import { seedSignature } from '@/mocks/_shared/seed-signature'
import { tenantKey, onTenantSwitch } from '@/mocks/_shared/tenant-context'
import { tenantFixtures } from '@/mocks/schools'
// The students *store*, not the students barrel. A barrel re-exports the
// derived modules beside the table — the dashboard series, the academic
// performance chart — and those call `loadSchoolConfig()` while they
// initialise, which comes straight back here before this module's own `db`
// exists. `Cannot access 'db' before initialization`, from a file that never
// mentions the academic tables. A store imports a store.
import { listStudents } from '@/mocks/tenant/students/store'
import type {
  AcademicFixtures,
  AcademicYear,
  ClassSection,
  GradeLevel,
  Subject,
  Term,
} from './types'

export type * from './types'

const TABLE = 'academic'

interface Database extends AcademicFixtures {
  /** Which fixture these rows came from — see `seedSignature`. */
  seed?: string
}

let db: Database | null = null

onTenantSwitch(() => {
  db = null
})

function signatureOf(): string {
  return seedSignature(tenantFixtures().academic)
}

/**
 * The school's structure, with enrolment counted off the roster.
 *
 * ── What this deliberately does *not* read ────────────────────────────
 * The faculty. `classTeacherId` is a column a school sets — see
 * `setClassTeacher` — and filling it here from `assignedClasses` would make
 * this store import the staff list, which imports the school's fixtures, which
 * is where this store's own seed comes from. That cycle is not theoretical: it
 * threw `teachersData is undefined` the first time the dashboard asked for the
 * school config during module init, because the faculty had not finished
 * evaluating.
 *
 * So the join lives in `teachers/assignments.ts`, which already holds both
 * sides and is nobody's dependency. The direction is one way: staff may ask
 * about sections, sections never ask about staff.
 */
function seed(): Database {
  const fixtures = tenantFixtures().academic
  const roster = listStudents()

  const sections: ClassSection[] = fixtures.sections.map(section => {
    const grade = fixtures.gradeLevels.find(level => level.id === section.gradeLevelId)
    const label = `${grade?.code ?? ''}${section.code}`
    return {
      ...section,
      currentEnrollment: roster.filter(
        student => `${student.gradeLevel}${student.section}` === label,
      ).length,
    }
  })

  return {
    years: fixtures.years.map(row => ({ ...row })),
    terms: fixtures.terms.map(row => ({ ...row })),
    gradeLevels: fixtures.gradeLevels.map(row => ({ ...row })),
    sections,
    subjects: fixtures.subjects.map(row => ({ ...row })),
    curriculum: fixtures.curriculum.map(row => ({ ...row })),
    seed: signatureOf(),
  }
}

function load(): Database {
  if (db) return db
  try {
    const raw = localStorage.getItem(tenantKey(TABLE))
    if (raw) {
      const parsed = JSON.parse(raw) as Database
      if (
        Array.isArray(parsed.years) &&
        Array.isArray(parsed.terms) &&
        Array.isArray(parsed.gradeLevels) &&
        Array.isArray(parsed.sections) &&
        Array.isArray(parsed.subjects) &&
        Array.isArray(parsed.curriculum) &&
        parsed.seed === signatureOf()
      ) {
        db = parsed
        return db
      }
    }
  } catch {
    // Unparseable or unavailable (private mode, cleared site data) — reseed.
  }
  db = seed()
  persist()
  return db
}

function persist(): void {
  if (!db) return
  try {
    localStorage.setItem(tenantKey(TABLE), JSON.stringify(db))
  } catch {
    // Quota or private mode; the in-memory copy still serves this session.
  }
}

// ── Reads ─────────────────────────────────────────────────────────────

/** The year every unqualified question means. */
export function currentYear(): AcademicYear | undefined {
  const found = load().years.find(year => year.isCurrent) ?? load().years[0]
  return found ? { ...found } : undefined
}

export function listTerms(): Term[] {
  return load().terms.map(row => ({ ...row }))
}

/** The term today falls in. */
export function currentTerm(): Term | undefined {
  const found = load().terms.find(term => term.isCurrent) ?? load().terms[0]
  return found ? { ...found } : undefined
}

/** Grades in teaching order — Class 10 after Class 9, not after Class 1. */
export function listGradeLevels(): GradeLevel[] {
  return [...load().gradeLevels].sort((a, b) => a.levelOrder - b.levelOrder).map(row => ({ ...row }))
}

export function listSections(): ClassSection[] {
  return load().sections.filter(row => row.isActive).map(row => ({ ...row }))
}

export function findSection(id: string): ClassSection | undefined {
  const found = load().sections.find(row => row.id === id)
  return found ? { ...found } : undefined
}

/** `8B` → the section. The label is what every other table still holds. */
export function findSectionByLabel(label: string): ClassSection | undefined {
  const database = load()
  const found = database.sections.find(section => {
    const grade = database.gradeLevels.find(level => level.id === section.gradeLevelId)
    return `${grade?.code ?? ''}${section.code}` === label
  })
  return found ? { ...found } : undefined
}

/** `cls-8b` → `8B`. */
export function labelOf(section: ClassSection): string {
  const grade = load().gradeLevels.find(level => level.id === section.gradeLevelId)
  return `${grade?.code ?? ''}${section.code}`
}

export function listSubjects(): Subject[] {
  return load().subjects.filter(row => row.isActive).map(row => ({ ...row }))
}

/**
 * The sections in the flat shape the settings panel and the older mocks speak.
 *
 * `{ id, grade, section, label }` — a projection, not a second list. It used
 * to be the only list there was, living in a UI settings blob; now the table
 * is the source and this is the view of it.
 */
export function sectionsAsConfig(): { id: string; grade: string; section: string; label: string }[] {
  const database = load()
  const order = new Map(database.gradeLevels.map(level => [level.id, level]))
  return [...database.sections]
    .filter(section => section.isActive)
    .sort((a, b) => {
      const ga = order.get(a.gradeLevelId)?.levelOrder ?? 0
      const gb = order.get(b.gradeLevelId)?.levelOrder ?? 0
      return ga - gb || a.code.localeCompare(b.code)
    })
    .map(section => {
      const grade = order.get(section.gradeLevelId)?.code ?? ''
      return { id: section.id, grade, section: section.code, label: `${grade}${section.code}` }
    })
}

/**
 * Periods a week per subject, for one band.
 *
 * `'junior'` is Classes 1–5, `'senior'` 6–10. Subjects the band does not take
 * are dropped rather than returned as zero, because a quota of zero and an
 * absence read the same to a timetable and only one of them is a fact.
 */
export function curriculumFor(band: 'junior' | 'senior'): Record<string, number> {
  const active = new Set(listSubjects().map(subject => subject.code))
  return Object.fromEntries(
    load()
      .curriculum.filter(row => active.has(row.subjectCode) && row[band] > 0)
      .map(row => [row.subjectCode, row[band]]),
  )
}

/** The subjects in the settings panel's shape. */
export function subjectsAsConfig(): { id: string; name: string; shortName: string }[] {
  return listSubjects().map(subject => ({
    id: subject.code,
    name: subject.name,
    // `Mathematics` → `Math`, `Social Studies` → `SS`. A column header has
    // room for about four characters.
    shortName:
      subject.name.length <= 7
        ? subject.name
        : subject.name.includes(' ')
          ? subject.name.split(' ').map(word => word[0]).join('')
          : subject.name.slice(0, 4),
  }))
}

// ── Writes ────────────────────────────────────────────────────────────

/**
 * Replace the section list wholesale — what the settings screen does.
 *
 * Wholesale because that screen edits a list and saves it, and because a
 * section removed there has to actually go. Enrolment is recounted rather than
 * trusted from the caller: the settings panel does not know the roster.
 */
export function replaceSections(sections: ClassSection[]): void {
  const database = load()
  const roster = listStudents()
  database.sections = sections.map(section => ({
    ...section,
    currentEnrollment: roster.filter(student => {
      const grade = database.gradeLevels.find(level => level.id === section.gradeLevelId)
      return `${student.gradeLevel}${student.section}` === `${grade?.code ?? ''}${section.code}`
    }).length,
  }))
  persist()
}

export function replaceSubjects(subjects: Subject[]): void {
  load().subjects = subjects.map(row => ({ ...row }))
  persist()
}

/** Who takes a class. The column the register's signature should come from. */
export function setClassTeacher(sectionId: string, profileId: string | undefined): boolean {
  const database = load()
  const section = database.sections.find(row => row.id === sectionId)
  if (!section) return false
  section.classTeacherId = profileId
  persist()
  return true
}
