/**
 * School Configuration React Context
 *
 * Provides global access to school settings (academic year, term structure, etc.)
 * from any component in the tree.
 *
 * Pattern: follows the exact DataTableContext pattern from
 * src/components/table/DataTableContext.tsx — createContext + Provider + hook with guard.
 *
 * @example
 * // In any component:
 * const { config, updateConfig } = useSchoolConfig()
 * console.log(config.academicYearStartMonth) // 3 (April)
 *
 * @example
 * // Open settings panel from anywhere:
 * const { setSettingsOpen } = useSchoolConfig()
 * setSettingsOpen(true)
 */

import * as React from 'react'
import type { SchoolConfig } from './school-config'
import {
  loadSchoolConfig,
  saveSchoolConfig,
  resetSchoolConfig,
} from '@/api/services/school-config-service'
import { applyAppearance, subscribeToSystemMode } from '@/theme/apply-appearance'

// ============================================================================
// Context Value Type
// ============================================================================

interface SchoolConfigContextValue {
  /** Current school configuration */
  config: SchoolConfig
  /** Update one or more config fields (merges with existing) */
  updateConfig: (patch: Partial<SchoolConfig>) => void
  /** Reset all settings to defaults */
  resetConfig: () => void
  /** Whether the settings panel is open */
  isSettingsOpen: boolean
  /** Open/close the settings panel */
  setSettingsOpen: (open: boolean) => void
}

// ============================================================================
// Context + Hook
// ============================================================================

const SchoolConfigContext = React.createContext<SchoolConfigContextValue | undefined>(undefined)

/**
 * Hook to access school configuration from any component.
 * Must be used within a SchoolConfigProvider.
 */
export function useSchoolConfig(): SchoolConfigContextValue {
  const ctx = React.useContext(SchoolConfigContext)
  if (!ctx) {
    throw new Error('useSchoolConfig must be used within a SchoolConfigProvider')
  }
  return ctx
}

// ============================================================================
// Provider
// ============================================================================

interface SchoolConfigProviderProps {
  children: React.ReactNode
}

/**
 * SchoolConfigProvider — wraps the entire app to provide global school settings.
 *
 * Initializes from localStorage on mount. Persists changes immediately.
 * Place this above <RouterProvider> in App.tsx.
 */
export function SchoolConfigProvider({ children }: SchoolConfigProviderProps) {
  const [config, setConfig] = React.useState<SchoolConfig>(() => loadSchoolConfig())
  const [isSettingsOpen, setSettingsOpen] = React.useState(false)

  // Apply theme synchronously before first paint — no flash of default tokens
  // on cold reload. Re-runs whenever the saved appearance changes.
  React.useLayoutEffect(() => {
    applyAppearance(config.appearance)
  }, [config.appearance])

  // Keep `mode: 'system'` live against OS color-scheme changes.
  React.useEffect(() => {
    const cleanup = subscribeToSystemMode(() => config.appearance)
    return cleanup
  }, [config.appearance])

  const updateConfig = React.useCallback((patch: Partial<SchoolConfig>) => {
    setConfig(prev => {
      const merged = { ...prev, ...patch }
      saveSchoolConfig(merged)
      return merged
    })
  }, [])

  const resetConfig = React.useCallback(() => {
    // Back to how *this school* started. Writing `DEFAULT_SCHOOL_CONFIG` gave
    // every school the app's nineteen sections and the name "Sanketa School",
    // which at a school running twelve is not a reset but a replacement.
    setConfig(resetSchoolConfig())
  }, [])

  const value = React.useMemo<SchoolConfigContextValue>(
    () => ({
      config,
      updateConfig,
      resetConfig,
      isSettingsOpen,
      setSettingsOpen,
    }),
    [config, updateConfig, resetConfig, isSettingsOpen],
  )

  return (
    <SchoolConfigContext.Provider value={value}>
      {children}
    </SchoolConfigContext.Provider>
  )
}
