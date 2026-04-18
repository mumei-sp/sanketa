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
  SCHOOL_CONFIG_STORAGE_KEY,
} from '@/config/school-config'
import { DEFAULT_APPEARANCE } from '@/theme/appearance'

/**
 * Load school config from localStorage.
 * Returns DEFAULT_SCHOOL_CONFIG if nothing stored or if JSON is invalid.
 *
 * The `appearance` key is deep-merged so adding new appearance fields later
 * never strands older stored configs without defaults for the new fields.
 */
/**
 * One-time migration for older configs that stored the original pink/cyan
 * hexes directly in subject.color. Users who never reset their config would
 * otherwise be stuck seeing the old brand palette on timetable tiles even
 * after switching appearance preset. Only old Sanketa-Classic hexes are
 * rewritten; custom user colors are preserved.
 */
const LEGACY_BRAND_MIGRATIONS: Record<string, string> = {
  '#FECCFD': 'var(--primary)',
  '#feccfd': 'var(--primary)',
  '#CDEAF0': 'var(--accent)',
  '#cdeaf0': 'var(--accent)',
  '#15446E': 'var(--heading)',
  '#15446e': 'var(--heading)',
}

function migrateSubjectColors(subjects: SchoolConfig['subjects'] | undefined) {
  if (!subjects) return undefined
  return subjects.map(s => ({
    ...s,
    color: LEGACY_BRAND_MIGRATIONS[s.color] ?? s.color,
  }))
}

export function loadSchoolConfig(): SchoolConfig {
  try {
    const raw = localStorage.getItem(SCHOOL_CONFIG_STORAGE_KEY)
    if (!raw) return { ...DEFAULT_SCHOOL_CONFIG }

    const parsed = JSON.parse(raw) as Partial<SchoolConfig>
    const migratedSubjects = migrateSubjectColors(parsed.subjects)

    return {
      ...DEFAULT_SCHOOL_CONFIG,
      ...parsed,
      ...(migratedSubjects ? { subjects: migratedSubjects } : {}),
      appearance: { ...DEFAULT_APPEARANCE, ...(parsed.appearance ?? {}) },
    }
  } catch {
    console.warn('Failed to parse school config from localStorage, using defaults')
    return { ...DEFAULT_SCHOOL_CONFIG }
  }
}

/**
 * Save school config to localStorage.
 */
export function saveSchoolConfig(config: SchoolConfig): void {
  try {
    localStorage.setItem(SCHOOL_CONFIG_STORAGE_KEY, JSON.stringify(config))
  } catch (err) {
    console.error('Failed to save school config to localStorage:', err)
  }
}
