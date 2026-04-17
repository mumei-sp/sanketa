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
import { Check, ChevronRight, RotateCcw, Settings2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
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
  /** Called when selection changes. Grade strings in grade mode, section labels in section mode. */
  onChange: (selected: string[]) => void
}

// ============================================================================
// Grade Mode — Grid of Grade Cards
// ============================================================================

function GradeGrid({
  allGrades,
  selected,
  isMaxed,
  gradeCounts,
  onToggle,
}: {
  allGrades: string[]
  selected: string[]
  isMaxed: boolean
  gradeCounts?: Map<string, number>
  onToggle: (grade: string) => void
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

        return (
          <button
            key={grade}
            type="button"
            onClick={() => !isDisabled && onToggle(grade)}
            disabled={isDisabled}
            className="relative flex flex-col items-center text-center rounded-lg border-2 transition-all"
            style={{
              padding: `${spacing['3']} ${spacing['2']}`,
              borderColor: isSelected ? colors.accent.base : colors.border.default,
              backgroundColor: isSelected ? colors.accent.soft : colors.background.card,
              opacity: isDisabled ? 0.45 : 1,
              cursor: isDisabled ? 'not-allowed' : 'pointer',
            }}
          >
            {/* Checkmark badge */}
            {isSelected && (
              <div
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ backgroundColor: colors.text.heading }}
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
                  ? withOpacity(baseColors.blue, 0.5)
                  : withOpacity(baseColors.blue, 0.25),
              }}
            >
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: colors.text.heading,
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
          </button>
        )
      })}
    </div>
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
                style={{ color: colors.text.heading }}
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
                        borderColor: isSelected ? colors.accent.base : colors.border.default,
                        backgroundColor: isSelected
                          ? withOpacity(baseColors.blue, 0.4)
                          : colors.background.card,
                        opacity: isDisabled ? 0.45 : 1,
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {isSelected && (
                        <Check
                          className="w-3 h-3 mr-1"
                          style={{ color: colors.text.heading }}
                        />
                      )}
                      <span
                        className="text-xs font-semibold tabular-nums"
                        style={{ color: colors.text.heading }}
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
  onChange,
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

  const allItems = mode === 'grade' ? allGrades : allSectionLabels

  // Compute sensible defaults
  const defaultItems = React.useMemo(() => {
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
  }, [mode, gradeCounts, allGrades, allSectionLabels, max])

  const { selected, toggle, setSelected, reset, isMaxed, isDefault } = useClassPick(
    allItems,
    defaultItems,
    { storageKey, max },
  )

  // Notify parent on mount and when selection changes
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
            <DialogTitle style={{ color: colors.text.heading }}>{title}</DialogTitle>
            <DialogDescription>
              {description}{' '}
              <span className="font-medium" style={{ color: colors.text.heading }}>
                {selected.length}/{max}
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
              onToggle={toggle}
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
                backgroundColor: colors.text.heading,
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
