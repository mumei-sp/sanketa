import * as React from 'react'
import { authUtils } from '@/api/utils/auth'

interface UseClassPickOptions {
  /** localStorage key suffix — stored as `sanketa:class-pick:{storageKey}` */
  storageKey: string
  /** Maximum number of items the user can select */
  max: number
}

interface UseClassPickResult {
  /** Currently selected items (grade strings or section labels) */
  selected: string[]
  /** Toggle an item on/off. Adds if under max, removes if already selected. */
  toggle: (item: string) => void
  /** Replace the entire selection (respects max) */
  setSelected: React.Dispatch<React.SetStateAction<string[]>>
  /** Reset to the provided defaults */
  reset: () => void
  /** Whether the maximum number of selections has been reached */
  isMaxed: boolean
  /** Whether the current selection matches the defaults */
  isDefault: boolean
}

const STORAGE_PREFIX = 'sanketa:class-pick:'

/**
 * The key a picker's selection is remembered under.
 *
 * Scoped to the school, because a class is. Shared, a teacher who picked 9B at
 * one school carried that choice to the next — where 9B is different children,
 * or does not exist at all. The stored labels are filtered against the
 * school's own list on read, so nothing crashed; the selection just collapsed
 * to empty and the charts came up blank with no way to tell why.
 *
 * Read off the session rather than the mock's tenant context: which school a
 * person is looking at is a fact about their session, and this is a UI hook.
 */
function keyFor(storageKey: string): string {
  const tenant = authUtils.getUser()?.activeTenant ?? 'none'
  return `${STORAGE_PREFIX}${tenant}:${storageKey}`
}

/**
 * Manages per-widget class/grade selection with localStorage persistence.
 *
 * Works for both grade-level and section-level selections — the items are
 * just strings. Each consumer passes a unique `storageKey` so selections
 * are independent.
 *
 * @example
 * ```tsx
 * const { selected, toggle, reset, isMaxed } = useClassPick(
 *   allItems,          // ['1', '2', ... '10'] or ['7A', '7B', '8A', ...]
 *   defaultItems,      // computed top N by enrollment
 *   { storageKey: 'student-stats', max: 3 },
 * )
 * ```
 */
export function useClassPick(
  allItems: string[],
  defaultItems: string[],
  options: UseClassPickOptions,
): UseClassPickResult {
  const { storageKey, max } = options
  const fullKey = keyFor(storageKey)

  const [selected, setSelected] = React.useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(fullKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.every((g: unknown) => typeof g === 'string')) {
          // Accept stored empty arrays — some consumers (table filters) treat
          // "nothing selected" as the intentional "All" state and must be
          // allowed to persist that. Previous value was `> 0` which silently
          // coerced an empty persistence back into defaults on reload.
          const valid = (parsed as string[]).filter(g => allItems.includes(g))
          return valid.slice(0, max)
        }
      }
    } catch {
      // Corrupted localStorage — fall through to defaults
    }
    return [...defaultItems].slice(0, max)
  })

  // Persist whenever selection changes
  React.useEffect(() => {
    try {
      localStorage.setItem(fullKey, JSON.stringify(selected))
    } catch {
      // localStorage full or unavailable — silently ignore
    }
  }, [fullKey, selected])

  const toggle = React.useCallback((item: string) => {
    setSelected(prev => {
      if (prev.includes(item)) {
        return prev.filter(g => g !== item)
      }
      if (prev.length >= max) {
        return prev
      }
      return [...prev, item]
    })
  }, [max])

  const reset = React.useCallback(() => {
    setSelected([...defaultItems].slice(0, max))
  }, [defaultItems, max])

  const isMaxed = selected.length >= max

  const isDefault = React.useMemo(() => {
    if (selected.length !== defaultItems.length) return false
    const sortedSelected = [...selected].sort()
    const sortedDefaults = [...defaultItems].sort()
    return sortedSelected.every((g, i) => g === sortedDefaults[i])
  }, [selected, defaultItems])

  return { selected, toggle, setSelected, reset, isMaxed, isDefault }
}
