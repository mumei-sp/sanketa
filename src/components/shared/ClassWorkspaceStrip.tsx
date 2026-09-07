/**
 * ClassWorkspaceStrip — the class switcher above attendance and grade rosters.
 *
 * Teachers work the same register or exam across several sections ("UT1 Math
 * for 9A, 9B, 9C"). The strip shows the classes they have loaded as chips and
 * pins the picker that edits that set at the end.
 *
 * The chips scroll in a track of their own rather than in the bordered box:
 * as direct flex children of the box they shrink instead of overflowing, so a
 * sixth class squeezes every chip toward illegibility instead of scrolling
 * out of view. Keeping the picker outside that track also means it can never
 * be scrolled out of reach.
 *
 * @example
 * ```tsx
 * <ClassWorkspaceStrip
 *   storageKey="grade-entry-workspace"
 *   classes={classes}
 *   loadedClasses={loadedClasses}
 *   selectedClass={selectedClass}
 *   onSelect={cls => handleParamChange('class', cls)}
 *   onLoadedChange={setLoadedClasses}
 *   className={TOOLBAR_FULL}
 * />
 * ```
 */

import { colors, withOpacity } from '@/theme/colors'
import { cn } from '@/lib/utils'
import { ClassPicker } from './ClassPicker'

export interface ClassWorkspaceStripProps {
  /** Per-page localStorage key, so each page remembers its own workspace. */
  storageKey: string
  /** Every class label the school has, used for the picker's initial pick. */
  classes: string[]
  /** The classes currently loaded into the workspace. */
  loadedClasses: string[]
  /** The one being edited right now. */
  selectedClass: string
  /** Fired when a chip is tapped. */
  onSelect: (cls: string) => void
  /** Fired when the picker changes which classes are loaded. */
  onLoadedChange: (classes: string[]) => void
  /** How many classes the picker allows. Default 6. */
  max?: number
  /** Sizing for the strip within its toolbar — pass a TOOLBAR_* token. */
  className?: string
}

export function ClassWorkspaceStrip({
  storageKey,
  classes,
  loadedClasses,
  selectedClass,
  onSelect,
  onLoadedChange,
  max = 6,
  className,
}: ClassWorkspaceStripProps) {
  return (
    <div
      className={cn('flex items-center gap-1 rounded-md border', className)}
      style={{
        borderColor: colors.border.default,
        backgroundColor: colors.background.card,
        padding: 3,
      }}
    >
      <div className="scrollbar-none flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
        {loadedClasses.length === 0 ? (
          <span className="text-xs px-2" style={{ color: colors.text.muted, paddingBlock: 4 }}>
            Pick one or more classes
          </span>
        ) : (
          loadedClasses.map(cls => {
            const active = cls === selectedClass
            return (
              <button
                key={cls}
                type="button"
                onClick={() => onSelect(cls)}
                className="tap-target shrink-0 text-xs font-medium rounded transition-colors"
                style={{
                  padding: '4px 10px',
                  backgroundColor: active ? withOpacity('var(--accent)', 0.55) : 'transparent',
                  color: 'var(--heading)',
                }}
              >
                {cls}
              </button>
            )
          })
        )}
      </div>
      <ClassPicker
        storageKey={storageKey}
        mode="section"
        max={max}
        defaultSelected={classes.slice(0, 1)}
        onChange={onLoadedChange}
      />
    </div>
  )
}
