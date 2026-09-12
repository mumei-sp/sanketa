/**
 * School Configuration Persistence Service
 *
 * Reads/writes school config to localStorage.
 * When the backend is ready, replace the body of these two functions
 * with API calls — no other code needs to change.
 *
 * @example
 * // Future API swap:
 * export async function loadSchoolConfig(): Promise<SchoolConfig> {
 *   const res = await fetch('/api/school/config')
 *   return res.json()
 * }
 */

import {
  type SchoolConfig,
  DEFAULT_SCHOOL_CONFIG,
  DEFAULT_SUBJECTS,
  SCHOOL_CONFIG_STORAGE_KEY,
} from '@/config/school-config'
import { DEFAULT_APPEARANCE, getPreset } from '@/theme/appearance'
import { tenantFixtures } from '@/mocks/schools'
import {
  sectionsAsConfig,
  subjectsAsConfig,
  replaceSections,
  replaceSubjects,
  findSection,
  listSubjects,
  currentYear,
} from '@/mocks/tenant/academic'
import { tenantKey } from '@/mocks/_shared/tenant-context'

/**
 * Load school config from localStorage.
 * Returns DEFAULT_SCHOOL_CONFIG if nothing stored or if JSON is invalid.
 *
 * The `appearance` key is deep-merged so adding new appearance fields later
 * never strands older stored configs without defaults for the new fields.
 */

/**
 * Appearance migration for the Schola refresh:
 *  - The radius scale moved from 0.4 / 0.625 / 0.9 to 0.625 / 1 / 1.25 — each
 *    stored step maps onto the equivalent step of the new scale.
 *  - Retired preset ids: `ocean`→`pacific` and `emerald`→`meadow` follow their
 *    successors (colors included); `soft-pink` / `mono` keep the user's colors
 *    but become `custom` since no successor exists.
 */
const LEGACY_RADIUS_MIGRATIONS: Record<string, number> = {
  '0.4': 0.625,
  '0.625': 1,
  '0.9': 1.25,
}

const LEGACY_PRESET_MIGRATIONS: Record<string, string> = {
  ocean: 'pacific',
  emerald: 'meadow',
  'soft-pink': 'custom',
  mono: 'custom',
}

function migrateAppearance(
  appearance: Partial<SchoolConfig['appearance']> | undefined,
): Partial<SchoolConfig['appearance']> {
  if (!appearance) return {}
  const migrated = { ...appearance }
  if (migrated.radius !== undefined) {
    migrated.radius = LEGACY_RADIUS_MIGRATIONS[String(migrated.radius)] ?? migrated.radius
  }
  const successorId = migrated.presetId && LEGACY_PRESET_MIGRATIONS[migrated.presetId]
  if (successorId) {
    migrated.presetId = successorId as SchoolConfig['appearance']['presetId']
    const successor = getPreset(successorId)
    if (successor) {
      migrated.primary = successor.primary
      migrated.accent = successor.accent
      migrated.heading = successor.heading
    }
  }
  return migrated
}

/**
 * The school's own starting configuration, over the app's defaults.
 *
 * A school's name, its class sections and the subjects it teaches are the
 * school's data. They were the app's: one `DEFAULT_SCHOOL_CONFIG` and one
 * storage key shared by both schools, so renaming 8B at one school renamed it
 * at the other, and a school of 317 ran the nineteen sections of a school of
 * 441 because it had no way to say otherwise.
 */
function baseConfig(): SchoolConfig {
  return {
    ...DEFAULT_SCHOOL_CONFIG,
    ...tenantFixtures().config,
    // Projected from `academic-mgmt`, not stored in the settings blob. A
    // school's sections and subjects are tables; this screen is a view of
    // them. They used to live in the config, which made a school's academic
    // structure a preference — and left a class section as a bare string with
    // nothing to point at.
    classSections: sectionsAsConfig(),
    subjects: subjectsWithColours(),
  }
}

/**
 * The school's subjects, wearing the app's colours.
 *
 * The subject list is the school's; which colour a subject tile is, is the
 * app's — it comes from the active theme preset, and a school that invented
 * "Kannada" has no opinion about its hue. So the names come from the table and
 * the colours are dealt from the palette, by code where the app knows one.
 */
function subjectsWithColours(): SchoolConfig['subjects'] {
  const known = new Map(DEFAULT_SUBJECTS.map(subject => [subject.id, subject.color]))
  const spare = DEFAULT_SUBJECTS.map(subject => subject.color)
  return subjectsAsConfig().map((subject, index) => ({
    ...subject,
    color: known.get(subject.id) ?? spare[index % spare.length],
  }))
}

/**
 * Where an administrator's edits are kept.
 *
 * Per school, like every other tenant-scoped table. Shared, an administrator
 * adding a section at one school added it at the other — and the two schools
 * are not even in the same city.
 */
function configKey(): string {
  return tenantKey(SCHOOL_CONFIG_STORAGE_KEY)
}

export function loadSchoolConfig(): SchoolConfig {
  const base = baseConfig()
  try {
    const raw = localStorage.getItem(configKey())
    if (!raw) return { ...base }

    const parsed = JSON.parse(raw) as Partial<SchoolConfig>

    return {
      ...base,
      ...parsed,
      // After the stored blob, not before. Sections and subjects are tables;
      // the settings key also holds a copy because the panel saves the whole
      // config, and letting that copy win would be the two-sources problem
      // the tables exist to end. The table is the answer, always.
      classSections: base.classSections,
      subjects: base.subjects,
      // Deep-merged like `appearance`, so a config stored before a category
      // existed still gets a default for it rather than treating it as muted.
      notifications: {
        categories: {
          ...base.notifications.categories,
          ...(parsed.notifications?.categories ?? {}),
        },
      },
      appearance: { ...DEFAULT_APPEARANCE, ...migrateAppearance(parsed.appearance) },
    }
  } catch {
    console.warn('Failed to parse school config from localStorage, using defaults')
    return { ...base }
  }
}

/**
 * Save school config to localStorage.
 */
export function saveSchoolConfig(config: SchoolConfig): void {
  // Sections and subjects are tables, so they go to the table. Everything
  // else is a setting and goes to the settings key. Writing the whole blob to
  // one place is what made them a preference in the first place.
  replaceSections(
    config.classSections.map(section => {
      const existing = findSection(section.id)
      return {
        id: section.id,
        gradeLevelId: existing?.gradeLevelId ?? `gl-${section.grade}`,
        name: `Class ${section.grade} ${section.section}`,
        code: section.section,
        capacity: existing?.capacity ?? 30,
        currentEnrollment: 0,
        academicYearId: existing?.academicYearId ?? currentYear()?.id ?? '',
        termId: existing?.termId,
        status: existing?.status ?? 'active',
        classTeacherId: existing?.classTeacherId,
        isActive: true,
      }
    }),
  )
  replaceSubjects(
    config.subjects.map(subject => {
      const existing = listSubjects().find(row => row.code === subject.id)
      return {
        id: existing?.id ?? `sub-${subject.id}`,
        name: subject.name,
        code: subject.id,
        subjectType: existing?.subjectType ?? 'core',
        description: existing?.description,
        department: existing?.department ?? subject.name,
        isActive: true,
      }
    }),
  )

  try {
    localStorage.setItem(configKey(), JSON.stringify(config))
  } catch (err) {
    console.error('Failed to save school config to localStorage:', err)
  }
}

/**
 * Back to how the school started, not to how the app starts.
 *
 * "Reset to Defaults" used to write `DEFAULT_SCHOOL_CONFIG`, which is the
 * app's shape — nineteen sections and the name "Sanketa School". At a school
 * that runs twelve sections and is called something else, that is not a reset,
 * it is another school's configuration. Clearing the stored edits and letting
 * `loadSchoolConfig` rebuild from the school's own base is the reset the
 * button claims to be.
 */
export function resetSchoolConfig(): SchoolConfig {
  try {
    localStorage.removeItem(configKey())
  } catch {
    // Private mode; the returned config still serves this session.
  }
  return loadSchoolConfig()
}
