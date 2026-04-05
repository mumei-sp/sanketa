import * as React from 'react'

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
  const fullKey = STORAGE_PREFIX + storageKey

  const [selected, setSelected] = React.useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(fullKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.every((g: unknown) => typeof g === 'string')) {
          const valid = (parsed as string[]).filter(g => allItems.includes(g))
          if (valid.length > 0) return valid.slice(0, max)
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
