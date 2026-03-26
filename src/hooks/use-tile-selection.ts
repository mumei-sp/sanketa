import * as React from 'react'

interface UseTileSelectionOptions {
  /** localStorage key for persisting selections */
  storageKey: string
  /** Default selected tile IDs (used on first load when no localStorage entry exists) */
  defaults: string[]
  /** Maximum number of tiles the user can select */
  maxSelections: number
}

interface UseTileSelectionResult<T extends { id: string }> {
  /** Currently selected items from the registry, in selection order */
  selectedTiles: T[]
  /** All available items from the registry */
  allTiles: T[]
  /** IDs of currently selected tiles */
  selectedIds: string[]
  /** Toggle a tile on/off. Adds if under max, removes if already selected. */
  toggle: (id: string) => void
  /** Reorder selected tiles by moving item at fromIndex to toIndex */
  reorder: (fromIndex: number, toIndex: number) => void
  /** Reset selections to defaults */
  reset: () => void
  /** Whether the maximum number of selections has been reached */
  isMaxed: boolean
}

/**
 * Reusable hook for managing tile selection, ordering, and persistence.
 *
 * Generic — works with any registry of items that have an `id` field.
 * Persists selections to localStorage; easy to swap to API later.
 *
 * @example
 * ```tsx
 * const { selectedTiles, selectedIds, toggle, reset, isMaxed } = useTileSelection(
 *   myTileRegistry,
 *   { storageKey: 'sanketa:dashboard-tiles', defaults: ['tile-a', 'tile-b'], maxSelections: 4 },
 * )
 * ```
 */
export function useTileSelection<T extends { id: string }>(
  registry: T[],
  options: UseTileSelectionOptions,
): UseTileSelectionResult<T> {
  const { storageKey, defaults, maxSelections } = options

  // Initialize from localStorage or defaults
  const [selectedIds, setSelectedIds] = React.useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.every(id => typeof id === 'string')) {
          // Filter out any IDs that no longer exist in the registry
          const validIds = parsed.filter((id: string) => registry.some(r => r.id === id))
          if (validIds.length > 0) return validIds.slice(0, maxSelections)
        }
      }
    } catch {
      // Corrupted localStorage — fall through to defaults
    }
    return [...defaults].slice(0, maxSelections)
  })

  // Persist to localStorage whenever selectedIds changes
  React.useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(selectedIds))
    } catch {
      // localStorage full or unavailable — silently ignore
    }
  }, [storageKey, selectedIds])

  const toggle = React.useCallback((id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        // Remove
        return prev.filter(existingId => existingId !== id)
      }
      if (prev.length >= maxSelections) {
        // At max — cannot add more
        return prev
      }
      // Add
      return [...prev, id]
    })
  }, [maxSelections])

  const reorder = React.useCallback((fromIndex: number, toIndex: number) => {
    setSelectedIds(prev => {
      if (fromIndex < 0 || fromIndex >= prev.length || toIndex < 0 || toIndex >= prev.length) {
        return prev
      }
      const next = [...prev]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return next
    })
  }, [])

  const reset = React.useCallback(() => {
    setSelectedIds([...defaults].slice(0, maxSelections))
  }, [defaults, maxSelections])

  const selectedTiles = React.useMemo(
    () => selectedIds
      .map(id => registry.find(r => r.id === id))
      .filter((item): item is T => item !== undefined),
    [selectedIds, registry],
  )

  const isMaxed = selectedIds.length >= maxSelections

  return {
    selectedTiles,
    allTiles: registry,
    selectedIds,
    toggle,
    reorder,
    reset,
    isMaxed,
  }
}
