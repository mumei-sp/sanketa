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

/**
 * Load school config from localStorage.
 * Returns DEFAULT_SCHOOL_CONFIG if nothing stored or if JSON is invalid.
 */
export function loadSchoolConfig(): SchoolConfig {
  try {
    const raw = localStorage.getItem(SCHOOL_CONFIG_STORAGE_KEY)
    if (!raw) return { ...DEFAULT_SCHOOL_CONFIG }

    const parsed = JSON.parse(raw) as Partial<SchoolConfig>

    // Merge with defaults so new fields added later get their defaults
    return { ...DEFAULT_SCHOOL_CONFIG, ...parsed }
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
