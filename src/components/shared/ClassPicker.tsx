/**
 * ClassPicker — Premium class/grade selection dialog.
 *
 * A single, globally reusable component with two selection modes:
 *
 * - `mode: 'grade'`   — Select whole grades (e.g. stat cards, charts)
 * - `mode: 'section'` — Select individual class sections (e.g. "7A", "8B")
 *
 * Follows TileCustomizeModal design language: Dialog with grid of selectable
 * cards, accent borders, checkmark badges, max enforcement, reset + done footer.
 *
 * Each consumer passes a unique `storageKey` — selections are independent
 * and persisted to localStorage.
 *
 * @example
 * ```tsx
 * <ClassPicker
 *   storageKey="student-stats"
 *   mode="grade"
 *   max={3}
 *   gradeCounts={countMap}
 *   onChange={setSelectedGrades}
 * />
 * ```
 */

import * as React from 'react'
import { Check, ChevronRight, Layers, RotateCcw, Settings2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useSchoolConfig } from '@/config/SchoolConfigContext'
import { getUniqueGrades, getGroupedByGrade } from '@/utils/class-section-helpers'
import { useClassPick } from '@/hooks/use-class-pick'
import { colors, withOpacity, baseColors } from '@/theme/colors'
import { spacing } from '@/config/spacing'

// ============================================================================
// Types
// ============================================================================

interface ClassPickerProps {
  /** Unique key for localStorage persistence */
  storageKey: string
  /** 'grade' = select whole grades, 'section' = select individual class sections */
  mode: 'grade' | 'section'
  /** Max selections allowed (default: 3) */
  max?: number
  /** Grade → student count map for showing counts on grade cards */
  gradeCounts?: Map<string, number>
  /**
   * Override the default initial selection. Pass `[]` for consumers that
   * treat "no selection" as "show all" (e.g. table filters). Without this,
   * the picker preselects the first `max` items.
   */
  defaultSelected?: string[]
  /** Called when selection changes. Grade strings in grade mode, section labels in section mode. */
  onChange: (selected: string[]) => void
  /**
   * (grade mode only) Fires with the current section-level selection whenever
   * the user toggles a specific section chip inside a selected grade card.
   *
   * The primary `onChange` still emits grade strings so existing consumers
   * keep working. Opt into this callback to drive charts that can render at
   * section granularity. When omitted, section chips act as a visual preview
   * only and toggling them still emits the parent grade via `onChange`.
   */
  onSectionsChange?: (sectionLabels: string[]) => void
  /**
   * (grade mode only) Fires with the list of grades the user has flagged as
   * "compare sections" — meaning the chart should draw one bar per picked
   * section of that grade instead of a single grade-average bar.
   *
   * Driven by the explicit "Compare sections" toggle inside each grade's
   * section popover. Keeping this as its own signal (rather than inferring
   * from "some sections off") lets the user also compare grades that have
   * only 2 sections, where picking both wouldn't otherwise trigger a split.
   */
  onCompareGradesChange?: (grades: string[]) => void
}

// ============================================================================
// Grade Mode — Grid of Grade Cards (cards expand with section chips when picked)
// ============================================================================

/**
 * The selected grade cards reveal their sections as small pill buttons inline,
 * keeping the grade-grid aesthetic while also letting the user drill into a
 * specific section (e.g. "only 7A" instead of "all of Grade 7"). Unselected
 * cards stay compact, so the UI is only dense where it needs to be.
 *
 * Interaction:
 *   - Click the grade card body  → toggle the whole grade (all sections).
 *   - Click a section chip       → toggle that specific section.
 *   - Deselecting all sections of a grade implicitly deselects the grade.
 *   - Re-selecting a grade restores "all sections" of that grade.
 */
function GradeGrid({
  allGrades,
  selected,
  isMaxed,
  gradeCounts,
  sectionsByGrade,
  selectedSections,
  compareGrades,
  onToggle,
  onSectionToggle,
  onCompareToggle,
}: {
  allGrades: string[]
  selected: string[]
  isMaxed: boolean
  gradeCounts?: Map<string, number>
  sectionsByGrade: Map<string, string[]>
  selectedSections: Set<string>
  compareGrades: Set<string>
  onToggle: (grade: string) => void
  onSectionToggle: (grade: string, sectionLabel: string) => void
  onCompareToggle: (grade: string) => void
}) {
  return (
    <div
      className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 overflow-y-auto flex-1"
      style={{ gap: spacing['3'], maxHeight: '50vh', padding: spacing['1.5'] }}
    >
      {allGrades.map(grade => {
        const isSelected = selected.includes(grade)
        const isDisabled = !isSelected && isMaxed
        const count = gradeCounts?.get(grade)
        const gradeSections = sectionsByGrade.get(grade) ?? []
        const hasMultipleSections = gradeSections.length > 1

        return (
          <div
            key={grade}
            onClick={() => !isDisabled && onToggle(grade)}
            role="button"
            tabIndex={isDisabled ? -1 : 0}
            onKeyDown={e => {
              if (!isDisabled && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault()
                onToggle(grade)
              }
            }}
            className="relative flex flex-col items-center text-center rounded-lg border-2 transition-all focus:outline-none"
            style={{
              padding: `${spacing['3']} ${spacing['2']}`,
              borderColor: isSelected ? 'var(--accent)' : colors.border.default,
              backgroundColor: isSelected ? colors.accent.soft : colors.background.card,
              opacity: isDisabled ? 0.45 : 1,
              cursor: isDisabled ? 'not-allowed' : 'pointer',
            }}
          >
            {/* Checkmark badge */}
            {isSelected && (
              <div
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'var(--heading)' }}
              >
                <Check className="w-3 h-3" style={{ color: colors.background.card }} />
              </div>
            )}

            {/* Grade number in colored circle */}
            <div
              className="flex items-center justify-center rounded-full mb-1.5"
              style={{
                width: 40,
                height: 40,
                backgroundColor: isSelected
                  ? withOpacity('var(--accent)', 0.5)
                  : withOpacity('var(--accent)', 0.25),
              }}
            >
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: 'var(--heading)',
                  lineHeight: 1,
                }}
              >
                {grade}
              </span>
            </div>

            {/* Count */}
            {count !== undefined && (
              <span
                className="text-[10px] font-medium leading-tight"
                style={{ color: colors.text.muted }}
              >
                {count.toLocaleString('en-US')} student{count !== 1 ? 's' : ''}
              </span>
            )}

            {/*
             * Section drill-down trigger — small, in-corner, only on a selected
             * card with more than one section. Clicking the trigger opens a
             * Popover anchored to the card, so the card itself stays compact
             * and the grid row keeps its uniform height.
             *
             * Shows a count badge (e.g. "2/3") when the user has narrowed
             * the grade down to a subset of its sections — so from the outer
             * grid you can tell at a glance that Grade 7 is partially filtered.
             */}
            {isSelected && hasMultipleSections && (
              <SectionsPopover
                grade={grade}
                sections={gradeSections}
                selectedSections={selectedSections}
                onSectionToggle={onSectionToggle}
                compareMode={compareGrades.has(grade)}
                onCompareToggle={onCompareToggle}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

/**
 * Floating section-chip panel anchored to a selected grade card. Rendered
 * inside the card but absolutely-positioned trigger so the card's overall
 * box stays compact. Stops click propagation so section toggles never fire
 * the parent card's grade-toggle.
 */
function SectionsPopover({
  grade,
  sections,
  selectedSections,
  onSectionToggle,
  compareMode,
  onCompareToggle,
}: {
  grade: string
  sections: string[]
  selectedSections: Set<string>
  onSectionToggle: (grade: string, sectionLabel: string) => void
  compareMode: boolean
  onCompareToggle: (grade: string) => void
}) {
  const activeCount = sections.filter(l => selectedSections.has(l)).length
  const partial = activeCount > 0 && activeCount < sections.length
  // The card's corner badge is "interesting" if the user is either viewing a
  // subset of sections OR has explicitly asked to compare them side-by-side.
  const highlighted = partial || compareMode

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          // Keep the trigger click inside the popover's own context — without
          // stopPropagation it would also fire the grade card's onClick.
          onClick={e => e.stopPropagation()}
          onKeyDown={e => e.stopPropagation()}
          className="absolute bottom-1.5 right-1.5 inline-flex items-center gap-1 rounded-full transition-colors"
          style={{
            padding: '1px 6px',
            fontSize: 10,
            fontWeight: 600,
            color: 'var(--heading)',
            backgroundColor: highlighted
              ? withOpacity('var(--primary)', 0.55)
              : withOpacity('var(--accent)', 0.55),
            border: `1px solid ${highlighted ? 'var(--accent)' : 'transparent'}`,
          }}
          aria-label={
            compareMode
              ? `Grade ${grade} — comparing ${activeCount} sections`
              : partial
              ? `Grade ${grade} — ${activeCount} of ${sections.length} sections active`
              : `Pick specific sections of Grade ${grade}`
          }
        >
          <Layers className="w-2.5 h-2.5" />
          {compareMode
            ? `${activeCount}×`
            : partial
            ? `${activeCount}/${sections.length}`
            : sections.length}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="center"
        sideOffset={6}
        className="w-auto min-w-[200px] p-2"
        // Prevent the outer card onClick from firing when the user clicks
        // anywhere inside the popover content.
        onClick={e => e.stopPropagation()}
      >
        <div
          className="text-[10px] font-semibold uppercase tracking-wide mb-1.5"
          style={{ color: colors.text.muted }}
        >
          Grade {grade} sections
        </div>

        {/*
         * Compare-sections toggle — explicit signal that the user wants to
         * see each picked section as its OWN bar, even when all sections are
         * ticked. Without this, picking "both 9A and 9B" is indistinguishable
         * from "Grade 9 as a whole" (which is exactly the ambiguity that
         * prevented comparing grades with only 2 sections).
         */}
        <label
          className="flex items-center gap-2 rounded-md px-2 py-1.5 mb-1.5 cursor-pointer transition-colors"
          style={{
            backgroundColor: compareMode
              ? withOpacity('var(--primary)', 0.25)
              : 'transparent',
            border: `1px solid ${compareMode ? 'var(--accent)' : colors.border.subtle}`,
          }}
        >
          <Checkbox
            checked={compareMode}
            onCheckedChange={() => onCompareToggle(grade)}
            className="cursor-pointer"
          />
          <span
            className="text-[11px] font-medium flex-1"
            style={{ color: 'var(--heading)' }}
          >
            Compare sections
          </span>
        </label>
        <div className="flex flex-wrap gap-1.5">
          {sections.map(label => {
            const active = selectedSections.has(label)
            return (
              <button
                key={label}
                type="button"
                onClick={() => onSectionToggle(grade, label)}
                className="inline-flex items-center rounded-full transition-colors"
                style={{
                  padding: '3px 10px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--heading)',
                  backgroundColor: active
                    ? withOpacity('var(--accent)', 0.7)
                    : colors.background.card,
                  border: `1px solid ${active ? 'var(--accent)' : colors.border.default}`,
                }}
                aria-pressed={active}
              >
                {active && (
                  <Check
                    className="w-2.5 h-2.5 mr-1"
                    style={{ color: 'var(--heading)' }}
                  />
                )}
                {label}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ============================================================================
// Section Mode — Tree Cascader (expandable Grade rows with section children)
// ============================================================================

/**
 * A hierarchical checklist:
 *
 *   ┌─ Select classes ───────────────────────┐
 *   │ ▸ ☐ Grade 7   (3 sections)             │
 *   │ ▾ ☒ Grade 8   (2 of 2)                 │
 *   │      ☑ 8A   ☑ 8B                       │
 *   │ ▸ ■ Grade 9   (1 of 3)                 │
 *   └────────────────────────────────────────┘
 *
 * The grade checkbox is tri-state — clicking it selects all sections of
 * that grade in one go (or clears them if all were already selected).
 * The expand chevron toggles whether the child section checkboxes render.
 * Grades that already have selections are auto-expanded on open.
 */
function SectionTree({
  selected,
  isMaxed,
  onToggle,
  onToggleGrade,
}: {
  selected: string[]
  isMaxed: boolean
  onToggle: (section: string) => void
  onToggleGrade: (gradeLabels: string[]) => void
}) {
  const { config } = useSchoolConfig()
  const grouped = React.useMemo(
    () => getGroupedByGrade(config.classSections),
    [config.classSections],
  )

  // Auto-expand any grade that has at least one selected section.
  const initialExpanded = React.useMemo(() => {
    const map: Record<string, boolean> = {}
    grouped.forEach(([grade, sections]) => {
      if (sections.some(s => selected.includes(s.label))) map[grade] = true
    })
    return map
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grouped.length])
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>(initialExpanded)

  const toggleExpanded = (grade: string) =>
    setExpanded(prev => ({ ...prev, [grade]: !prev[grade] }))

  return (
    <div
      className="overflow-y-auto flex-1 rounded-md border"
      style={{
        maxHeight: '50vh',
        borderColor: colors.border.default,
        backgroundColor: colors.background.card,
      }}
    >
      {grouped.map(([grade, sections], idx) => {
        const sectionLabels = sections.map(s => s.label)
        const selectedInGrade = sectionLabels.filter(l => selected.includes(l))
        const allSelected = selectedInGrade.length === sectionLabels.length
        const someSelected = selectedInGrade.length > 0 && !allSelected
        const isOpen = !!expanded[grade]

        return (
          <div
            key={grade}
            style={{
              borderTop: idx === 0 ? 'none' : `1px solid ${colors.border.subtle}`,
            }}
          >
            {/* Grade row — clicking the chevron/row toggles expanded state. */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => toggleExpanded(grade)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  toggleExpanded(grade)
                }
              }}
              className="flex items-center gap-2 cursor-pointer select-none transition-colors"
              style={{
                padding: `${spacing['2.5']} ${spacing['3']}`,
                backgroundColor: isOpen ? colors.accent.soft : 'transparent',
              }}
              onMouseEnter={e => {
                if (!isOpen) e.currentTarget.style.backgroundColor = colors.background.highlight
              }}
              onMouseLeave={e => {
                if (!isOpen) e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <ChevronRight
                className="w-4 h-4 shrink-0 transition-transform"
                style={{
                  color: colors.text.muted,
                  transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                }}
              />

              {/* Tri-state parent checkbox — select all / none of the grade's sections. */}
              <span
                onClick={e => e.stopPropagation()}
                onKeyDown={e => e.stopPropagation()}
                className="flex items-center"
              >
                <Checkbox
                  checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                  onCheckedChange={() => onToggleGrade(sectionLabels)}
                  className="cursor-pointer"
                  aria-label={
                    allSelected
                      ? `Deselect all sections of Grade ${grade}`
                      : `Select all sections of Grade ${grade}`
                  }
                />
              </span>

              <span
                className="flex-1 text-xs font-semibold"
                style={{ color: 'var(--heading)' }}
              >
                Grade {grade}
              </span>

              <span
                className="text-[10px] font-medium tabular-nums"
                style={{ color: colors.text.muted }}
              >
                {selectedInGrade.length > 0
                  ? `${selectedInGrade.length} of ${sectionLabels.length}`
                  : `${sectionLabels.length} section${sectionLabels.length !== 1 ? 's' : ''}`}
              </span>
            </div>

            {/* Section children — render only when expanded. */}
            {isOpen && (
              <div
                className="flex flex-wrap"
                style={{
                  gap: spacing['2'],
                  // Indent so children visibly belong to the parent row.
                  padding: `${spacing['2']} ${spacing['3']} ${spacing['3']} ${spacing['9']}`,
                }}
              >
                {sections.map(section => {
                  const isSelected = selected.includes(section.label)
                  const isDisabled = !isSelected && isMaxed

                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => !isDisabled && onToggle(section.label)}
                      disabled={isDisabled}
                      className="relative flex items-center justify-center rounded-md border transition-all"
                      style={{
                        minWidth: 48,
                        padding: `${spacing['1.5']} ${spacing['3']}`,
                        borderColor: isSelected ? 'var(--accent)' : colors.border.default,
                        backgroundColor: isSelected
                          ? withOpacity('var(--accent)', 0.4)
                          : colors.background.card,
                        opacity: isDisabled ? 0.45 : 1,
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {isSelected && (
                        <Check
                          className="w-3 h-3 mr-1"
                          style={{ color: 'var(--heading)' }}
                        />
                      )}
                      <span
                        className="text-xs font-semibold tabular-nums"
                        style={{ color: 'var(--heading)' }}
                      >
                        {section.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function ClassPicker({
  storageKey,
  mode,
  max = 3,
  gradeCounts,
  defaultSelected,
  onChange,
  onSectionsChange,
  onCompareGradesChange,
}: ClassPickerProps) {
  const { config } = useSchoolConfig()
  const [open, setOpen] = React.useState(false)

  // Compute available items based on mode
  const allGrades = React.useMemo(
    () => getUniqueGrades(config.classSections),
    [config.classSections],
  )

  const allSectionLabels = React.useMemo(
    () => config.classSections.map(s => s.label),
    [config.classSections],
  )

  // Lookup: grade → its section labels (in admin-defined order).
  const sectionsByGrade = React.useMemo(() => {
    const map = new Map<string, string[]>()
    config.classSections.forEach(s => {
      const list = map.get(s.grade) ?? []
      list.push(s.label)
      map.set(s.grade, list)
    })
    return map
  }, [config.classSections])

  const allItems = mode === 'grade' ? allGrades : allSectionLabels

  // Compute sensible defaults.
  // Consumer-provided `defaultSelected` wins (empty array = start with nothing,
  // which is how table filters express "show all").
  const defaultItems = React.useMemo(() => {
    if (defaultSelected !== undefined) return defaultSelected
    if (mode === 'grade') {
      if (gradeCounts && gradeCounts.size > 0) {
        return [...gradeCounts.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, max)
          .map(([grade]) => grade)
      }
      return allGrades.slice(0, max)
    }
    // Section mode: default to first N sections
    return allSectionLabels.slice(0, max)
  }, [defaultSelected, mode, gradeCounts, allGrades, allSectionLabels, max])

  const { selected, toggle, setSelected, reset, isMaxed: rawIsMaxed, isDefault } = useClassPick(
    allItems,
    defaultItems,
    { storageKey, max },
  )

  /**
   * Section-level selection (grade mode only).
   *
   * Whenever a grade is "selected" in the primary `selected` array, by default
   * ALL of that grade's sections count as picked. The user can drill in by
   * toggling individual section chips — doing so may implicitly remove the
   * parent grade (if the last section is turned off) or re-add it (if a
   * section from an unselected grade is turned on).
   *
   * Computed as a Set for O(1) membership checks in the grid render.
   */
  const derivedSections = React.useMemo(() => {
    if (mode !== 'grade') return new Set<string>()
    const out = new Set<string>()
    selected.forEach(grade => {
      (sectionsByGrade.get(grade) ?? []).forEach(label => out.add(label))
    })
    return out
  }, [mode, selected, sectionsByGrade])

  /**
   * `selectedSections` holds the user-driven overrides on top of the
   * grade-implied defaults. Initialised to the full derived set so the first
   * open mirrors what `selected` already says.
   */
  const [selectedSections, setSelectedSections] = React.useState<Set<string>>(derivedSections)

  /**
   * `compareGrades` is the set of grades the user has flipped into "compare
   * sections" mode via the toggle inside each popover. When a grade is in
   * this set, its chart consumers should render one series per picked
   * section instead of a single grade-average series.
   */
  const [compareGrades, setCompareGrades] = React.useState<Set<string>>(new Set())

  // When `selected` changes via the grade-card click, resync the section set
  // so newly-picked grades contribute all their sections, and newly-dropped
  // grades have their sections removed.
  React.useEffect(() => {
    setSelectedSections(prev => {
      const next = new Set<string>()
      selected.forEach(grade => {
        const gradeSections = sectionsByGrade.get(grade) ?? []
        // Keep any user overrides for this grade; if none were set, take all.
        const overrides = gradeSections.filter(l => prev.has(l))
        const effective = overrides.length > 0 ? overrides : gradeSections
        effective.forEach(l => next.add(l))
      })
      return next
    })
  }, [selected, sectionsByGrade])

  // Notify parent on mount and when selection changes.
  const prevSelectedRef = React.useRef(selected)
  React.useEffect(() => {
    if (prevSelectedRef.current !== selected) {
      prevSelectedRef.current = selected
      onChange(selected)
    }
  }, [selected, onChange])

  React.useEffect(() => {
    onChange(selected)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Emit the section-level selection whenever it changes. Callers only opt in
  // via `onSectionsChange`; the primary `onChange` contract (grade strings) is
  // preserved for existing consumers.
  const prevSectionsRef = React.useRef<Set<string>>(selectedSections)
  React.useEffect(() => {
    if (!onSectionsChange) return
    // Skip emits when the set is unchanged to avoid render loops.
    const a = prevSectionsRef.current
    const b = selectedSections
    if (a.size === b.size && [...a].every(x => b.has(x))) return
    prevSectionsRef.current = b
    onSectionsChange([...b])
  }, [selectedSections, onSectionsChange])

  // Emit compare-mode changes to consumers that opted in. Also keep the set
  // pruned — if a grade gets deselected elsewhere, it drops out of compare
  // mode automatically.
  React.useEffect(() => {
    setCompareGrades(prev => {
      const pruned = new Set<string>()
      prev.forEach(g => {
        if (selected.includes(g)) pruned.add(g)
      })
      return pruned.size === prev.size ? prev : pruned
    })
  }, [selected])

  const prevCompareRef = React.useRef<Set<string>>(compareGrades)
  React.useEffect(() => {
    if (!onCompareGradesChange) return
    const a = prevCompareRef.current
    const b = compareGrades
    if (a.size === b.size && [...a].every(x => b.has(x))) return
    prevCompareRef.current = b
    onCompareGradesChange([...b])
  }, [compareGrades, onCompareGradesChange])

  /**
   * Flip a grade in/out of "compare sections" mode.
   */
  /**
   * "Effective series count" — how many bars/slices the chart will actually
   * draw given the current picks. A grade contributes 1 slot normally, OR
   * `sections.length` slots if compare-mode is on (and it has >1 section).
   *
   * Used instead of raw `selected.length` to enforce the `max` cap — so the
   * picker disables additional grade cards when compare-mode on an existing
   * grade has already consumed the series budget.
   */
  const effectiveCount = React.useMemo(() => {
    if (mode !== 'grade') return selected.length
    return selected.reduce((sum, grade) => {
      const sections = sectionsByGrade.get(grade) ?? []
      const expanded = compareGrades.has(grade) && sections.length > 1
      return sum + (expanded ? sections.length : 1)
    }, 0)
  }, [mode, selected, sectionsByGrade, compareGrades])

  // Override the hook's raw isMaxed with one that respects compare-mode's
  // series multiplication. In section mode this equals rawIsMaxed.
  const isMaxed = mode === 'grade' ? effectiveCount >= max : rawIsMaxed

  const handleCompareToggle = React.useCallback((grade: string) => {
    setCompareGrades(prev => {
      const next = new Set(prev)
      if (next.has(grade)) {
        // Turning compare OFF always frees slots — safe.
        next.delete(grade)
        return next
      }
      // Turning compare ON adds (sectionCount - 1) extra effective slots.
      const sections = sectionsByGrade.get(grade) ?? []
      if (sections.length <= 1) return prev // nothing to compare
      const extraSlots = sections.length - 1
      if (effectiveCount + extraSlots > max) return prev // would exceed budget
      next.add(grade)
      return next
    })
  }, [effectiveCount, max, sectionsByGrade])

  // Section mode: toggle all sections in a grade at once
  const handleToggleGrade = React.useCallback((sectionLabels: string[]) => {
    setSelected(prev => {
      const allIn = sectionLabels.every(l => prev.includes(l))
      if (allIn) {
        // Deselect all in this grade
        return prev.filter(s => !sectionLabels.includes(s))
      }
      // Select all in this grade that aren't already selected (respecting max)
      const toAdd = sectionLabels.filter(l => !prev.includes(l))
      const available = max - prev.length
      return [...prev, ...toAdd.slice(0, available)]
    })
  }, [max, setSelected])

  /**
   * Grade-mode section toggle. The primary source of truth stays the grade
   * array (so `onChange(grades)` keeps working), but we adjust:
   *   - Turning OFF the last section of a selected grade → drop that grade.
   *   - Turning ON a section of an unselected grade → add that grade (if
   *     under max). Newly-added grade keeps the single-chip selection.
   */
  const handleSectionToggle = React.useCallback((grade: string, sectionLabel: string) => {
    setSelectedSections(prev => {
      const gradeSections = sectionsByGrade.get(grade) ?? []
      const next = new Set(prev)
      if (next.has(sectionLabel)) next.delete(sectionLabel)
      else next.add(sectionLabel)

      // Count how many of this grade's sections are now selected.
      const activeForGrade = gradeSections.filter(l => next.has(l))
      const gradeIsSelected = selected.includes(grade)

      if (activeForGrade.length === 0 && gradeIsSelected) {
        // Dropped the last section — remove the grade from the primary
        // selection so the card collapses back to compact form.
        setSelected(prevGrades => prevGrades.filter(g => g !== grade))
      } else if (activeForGrade.length > 0 && !gradeIsSelected) {
        // Section of an unselected grade turned on — add the grade if we're
        // not already at the cap. Otherwise undo the section toggle.
        if (selected.length >= max) {
          // Revert: can't pull in another grade right now.
          if (next.has(sectionLabel)) next.delete(sectionLabel)
          return next
        }
        setSelected(prevGrades => [...prevGrades, grade])
      }
      return next
    })
  }, [selected, max, sectionsByGrade, setSelected])

  const title = mode === 'grade' ? 'Select Grades' : 'Select Classes'
  const description = mode === 'grade'
    ? 'Choose which grades to display.'
    : 'Choose which class sections to display.'

  return (
    <>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center justify-center rounded-md transition-colors cursor-pointer"
        style={{
          width: 28,
          height: 28,
          backgroundColor: 'transparent',
        }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = colors.accent.soft }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
        aria-label={title}
      >
        <Settings2 className="w-3.5 h-3.5" style={{ color: colors.text.muted }} />
      </button>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[520px] max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--heading)' }}>{title}</DialogTitle>
            <DialogDescription>
              {description}{' '}
              <span className="font-medium" style={{ color: 'var(--heading)' }}>
                {mode === 'grade' ? effectiveCount : selected.length}/{max}
              </span>{' '}
              selected.
            </DialogDescription>
          </DialogHeader>

          {mode === 'grade' ? (
            <GradeGrid
              allGrades={allGrades}
              selected={selected}
              isMaxed={isMaxed}
              gradeCounts={gradeCounts}
              sectionsByGrade={sectionsByGrade}
              selectedSections={selectedSections}
              compareGrades={compareGrades}
              onToggle={toggle}
              onSectionToggle={handleSectionToggle}
              onCompareToggle={handleCompareToggle}
            />
          ) : (
            <SectionTree
              selected={selected}
              isMaxed={isMaxed}
              onToggle={toggle}
              onToggleGrade={handleToggleGrade}
            />
          )}

          <DialogFooter className="flex-row items-center justify-between sm:justify-between">
            {!isDefault ? (
              <button
                type="button"
                onClick={reset}
                className="flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-70 cursor-pointer"
                style={{ color: colors.text.muted }}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset to defaults
              </button>
            ) : (
              <span />
            )}
            <Button
              onClick={() => setOpen(false)}
              className="text-sm"
              style={{
                backgroundColor: 'var(--heading)',
                color: colors.background.card,
              }}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
