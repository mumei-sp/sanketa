/**
 * GradingSettingsSection — Settings panel sub-section for grade scale configuration.
 *
 * Allows admins to:
 * 1. Select a grading preset (CBSE, ICSE, Percentage-only, Custom)
 * 2. Edit grade scale entries (label, min/max %, points, description)
 * 3. Reorder entries via drag-and-drop
 * 4. Set passing threshold
 *
 * All data stored in SchoolConfig.grading and persisted via context.
 */

import * as React from 'react'
import { Plus, Trash2, AlertTriangle, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { SortableList, SortableItem, SortableDragHandle } from '@/components/ui/sortable-list'
import { text, border, accent, background, status, baseColors } from '@/theme/colors'
import { spacing } from '@/config/spacing'
import { fontSizes } from '@/config/typography'
import type { SchoolConfig, GradingConfig, GradeScaleEntry, GradeScalePreset } from '@/config/school-config'
import {
  CBSE_GRADE_SCALE,
  ICSE_GRADE_SCALE,
  GRADE_SCALE_PRESET_OPTIONS,
} from '@/config/school-config'

// ============================================================================
// Types
// ============================================================================

interface GradingSettingsSectionProps {
  draft: SchoolConfig
  setDraft: React.Dispatch<React.SetStateAction<SchoolConfig>>
}

// ============================================================================
// Helpers
// ============================================================================

/** Get the preset entries for a given preset value */
function getPresetEntries(preset: GradeScalePreset): GradeScaleEntry[] {
  switch (preset) {
    case 'cbse': return CBSE_GRADE_SCALE.map(e => ({ ...e }))
    case 'icse': return ICSE_GRADE_SCALE.map(e => ({ ...e }))
    case 'percentage': return []
    case 'custom': return []
    default: return []
  }
}

/** Get preset passing threshold */
function getPresetThreshold(preset: GradeScalePreset): number {
  switch (preset) {
    case 'cbse': return 33
    case 'icse': return 33
    default: return 33
  }
}

/** Find the grade label that matches a given percentage */
function getGradeForPercentage(entries: GradeScaleEntry[], pct: number): string | null {
  const entry = entries.find(e => pct >= e.minPercent && pct <= e.maxPercent)
  return entry?.label || null
}

/** Validate grade entries and return warnings */
function validateEntries(entries: GradeScaleEntry[]): string[] {
  const warnings: string[] = []

  for (let i = 0; i < entries.length; i++) {
    const e = entries[i]
    if (e.minPercent > e.maxPercent) {
      warnings.push(`"${e.label || `Entry ${i + 1}`}": Min (${e.minPercent}%) is greater than Max (${e.maxPercent}%)`)
    }
  }

  // Check overlapping ranges
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const a = entries[i], b = entries[j]
      if (a.minPercent <= b.maxPercent && b.minPercent <= a.maxPercent) {
        warnings.push(`"${a.label || `Entry ${i + 1}`}" and "${b.label || `Entry ${j + 1}`}" have overlapping ranges`)
      }
    }
  }

  // Duplicate grade points
  const pointMap = new Map<number, string[]>()
  entries.forEach(e => {
    const existing = pointMap.get(e.gradePoints) || []
    existing.push(e.label || e.id)
    pointMap.set(e.gradePoints, existing)
  })
  pointMap.forEach((labels, pts) => {
    if (labels.length > 1) {
      warnings.push(`Duplicate grade points (${pts}): ${labels.join(', ')}`)
    }
  })

  return warnings
}

// ============================================================================
// Main Component
// ============================================================================

export function GradingSettingsSection({ draft, setDraft }: GradingSettingsSectionProps) {
  const grading = draft.grading

  // ── Updaters ──

  const updateGrading = React.useCallback((patch: Partial<GradingConfig>) => {
    setDraft(prev => ({
      ...prev,
      grading: { ...prev.grading, ...patch },
    }))
  }, [setDraft])

  const updateEntry = React.useCallback((id: string, field: keyof GradeScaleEntry, value: string | number) => {
    setDraft(prev => {
      const entries = prev.grading.entries.map(e =>
        e.id === id ? { ...e, [field]: value } : e,
      )
      return { ...prev, grading: { ...prev.grading, entries } }
    })
  }, [setDraft])

  const removeEntry = React.useCallback((id: string) => {
    setDraft(prev => ({
      ...prev,
      grading: {
        ...prev.grading,
        entries: prev.grading.entries.filter(e => e.id !== id),
      },
    }))
  }, [setDraft])

  const addEntry = React.useCallback(() => {
    setDraft(prev => {
      const entries = [...prev.grading.entries]
      const newEntry: GradeScaleEntry = {
        id: `grade-${Date.now()}`,
        label: '',
        minPercent: 0,
        maxPercent: 0,
        gradePoints: 0,
        description: '',
      }
      return { ...prev, grading: { ...prev.grading, entries: [...entries, newEntry] } }
    })
  }, [setDraft])

  const handleReorder = React.useCallback((reordered: GradeScaleEntry[]) => {
    setDraft(prev => ({ ...prev, grading: { ...prev.grading, entries: reordered } }))
  }, [setDraft])

  const handlePresetChange = React.useCallback((preset: GradeScalePreset) => {
    updateGrading({
      preset,
      entries: getPresetEntries(preset),
      passingThreshold: getPresetThreshold(preset),
    })
  }, [updateGrading])

  const keyExtractor = React.useCallback((e: GradeScaleEntry) => e.id, [])

  // ── Computed ──

  const warnings = React.useMemo(
    () => grading.preset !== 'percentage' ? validateEntries(grading.entries) : [],
    [grading.entries, grading.preset],
  )

  const passingGrade = React.useMemo(
    () => getGradeForPercentage(grading.entries, grading.passingThreshold),
    [grading.entries, grading.passingThreshold],
  )

  const isPercentageOnly = grading.preset === 'percentage'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['6'] }}>

      {/* ═══ PRESET SELECTOR ═══ */}
      <div
        className="rounded-xl shadow-sm"
        style={{
          backgroundColor: background.card,
          padding: spacing['6'],
          border: `1px solid ${border.default}`,
        }}
      >
        <Label className="text-sm font-semibold" style={{ color: text.heading }}>
          Grading System
        </Label>
        <p style={{ fontSize: fontSizes.xs, color: text.muted, marginTop: spacing['1'] }}>
          Select a preset or define a custom grading scale.
        </p>

        <RadioGroup
          value={grading.preset}
          onValueChange={(v: string) => handlePresetChange(v as GradeScalePreset)}
          className="mt-3"
          style={{ display: 'flex', flexDirection: 'column', gap: spacing['2'] }}
        >
          {GRADE_SCALE_PRESET_OPTIONS.map(opt => {
            const isSelected = grading.preset === opt.value
            return (
              <label
                key={opt.value}
                htmlFor={`preset-${opt.value}`}
                className="flex items-center rounded-xl cursor-pointer transition-all"
                style={{
                  padding: `${spacing['3']} ${spacing['4']}`,
                  border: `2px solid ${isSelected ? text.heading : border.default}`,
                  backgroundColor: isSelected ? accent.soft : background.surface,
                }}
              >
                <RadioGroupItem
                  value={opt.value}
                  id={`preset-${opt.value}`}
                  className="sr-only"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold" style={{ color: text.heading }}>
                    {opt.label}
                  </span>
                  <span
                    className="text-xs block mt-0.5"
                    style={{ color: text.muted }}
                  >
                    {opt.description}
                  </span>
                </div>
                {isSelected && (
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ml-3"
                    style={{ backgroundColor: text.heading }}
                  >
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </label>
            )
          })}
        </RadioGroup>
      </div>

      {/* ═══ GRADE SCALE TABLE ═══ */}
      {!isPercentageOnly && (
        <div
          className="rounded-xl shadow-sm"
          style={{
            backgroundColor: background.card,
            padding: spacing['6'],
            border: `1px solid ${border.default}`,
          }}
        >
          <Label className="text-sm font-semibold" style={{ color: text.heading }}>
            Grade Scale
          </Label>
          <p style={{ fontSize: fontSizes.xs, color: text.muted, marginTop: spacing['1'] }}>
            {grading.entries.length} grade{grading.entries.length !== 1 ? 's' : ''} defined.
            Drag to reorder. Edit labels, ranges, and points as needed.
          </p>

          {/* Column headers */}
          <div
            className="flex items-center gap-2 mt-3 mb-1"
            style={{ paddingLeft: '32px', paddingRight: '32px' }}
          >
            {[
              { label: 'Grade', width: '72px' },
              { label: 'Min %', width: '64px' },
              { label: 'Max %', width: '64px' },
              { label: 'Points', width: '64px' },
              { label: 'Description', width: 'auto' },
            ].map(col => (
              <span
                key={col.label}
                className="text-[10px] font-medium uppercase tracking-wider"
                style={{ color: text.muted, width: col.width === 'auto' ? undefined : col.width, flex: col.width === 'auto' ? 1 : undefined }}
              >
                {col.label}
              </span>
            ))}
          </div>

          {/* Sortable entries */}
          {grading.entries.length > 0 ? (
            <SortableList
              items={grading.entries}
              onReorder={handleReorder}
              keyExtractor={keyExtractor}
              style={{ display: 'flex', flexDirection: 'column', gap: spacing['1.5'] }}
            >
              {(entry) => (
                <SortableItem
                  key={entry.id}
                  id={entry.id}
                  className="flex items-center gap-2 rounded-lg transition-all"
                  style={{
                    backgroundColor: background.card,
                    border: `1px solid ${border.default}`,
                    padding: `${spacing['1.5']} ${spacing['2']}`,
                  }}
                >
                  <SortableDragHandle />

                  {/* Label */}
                  <Input
                    value={entry.label}
                    onChange={e => updateEntry(entry.id, 'label', e.target.value)}
                    placeholder="A1"
                    className="text-xs h-8"
                    style={{ width: '72px', borderColor: border.default, color: text.heading }}
                  />

                  {/* Min % */}
                  <Input
                    type="number"
                    value={entry.minPercent}
                    onChange={e => updateEntry(entry.id, 'minPercent', parseInt(e.target.value) || 0)}
                    min={0}
                    max={100}
                    className="text-xs h-8"
                    style={{ width: '64px', borderColor: border.default, color: text.heading }}
                  />

                  {/* Max % */}
                  <Input
                    type="number"
                    value={entry.maxPercent}
                    onChange={e => updateEntry(entry.id, 'maxPercent', parseInt(e.target.value) || 0)}
                    min={0}
                    max={100}
                    className="text-xs h-8"
                    style={{ width: '64px', borderColor: border.default, color: text.heading }}
                  />

                  {/* Points */}
                  <Input
                    type="number"
                    value={entry.gradePoints}
                    onChange={e => updateEntry(entry.id, 'gradePoints', parseInt(e.target.value) || 0)}
                    min={0}
                    className="text-xs h-8"
                    style={{ width: '64px', borderColor: border.default, color: text.heading }}
                  />

                  {/* Description */}
                  <Input
                    value={entry.description}
                    onChange={e => updateEntry(entry.id, 'description', e.target.value)}
                    placeholder="Outstanding"
                    className="text-xs h-8 flex-1 min-w-0"
                    style={{ borderColor: border.default, color: text.heading }}
                  />

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => removeEntry(entry.id)}
                    className="w-7 h-7 rounded-md flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
                    style={{ backgroundColor: accent.soft }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = status.danger.soft }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = accent.soft }}
                  >
                    <Trash2 className="w-3.5 h-3.5" style={{ color: text.heading }} />
                  </button>
                </SortableItem>
              )}
            </SortableList>
          ) : (
            <div
              className="flex items-center justify-center rounded-lg"
              style={{
                padding: spacing['8'],
                backgroundColor: border.subtle,
                color: text.muted,
                marginTop: spacing['2'],
              }}
            >
              <span className="text-sm">No grades defined. Add entries below.</span>
            </div>
          )}

          {/* Add button */}
          <div className="mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={addEntry}
              className="gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Grade
            </Button>
          </div>
        </div>
      )}

      {/* ═══ PERCENTAGE-ONLY INFO ═══ */}
      {isPercentageOnly && (
        <div
          className="flex items-start gap-3 rounded-xl"
          style={{
            backgroundColor: accent.soft,
            border: `1px solid ${accent.base}`,
            padding: spacing['4'],
          }}
        >
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: text.heading }} />
          <div>
            <p className="text-sm font-medium" style={{ color: text.heading }}>
              Percentage-based grading
            </p>
            <p className="text-xs mt-1" style={{ color: text.muted }}>
              Students are scored by percentage only — no letter grades or grade points.
              You can still set a passing threshold below.
            </p>
          </div>
        </div>
      )}

      {/* ═══ PASSING THRESHOLD ═══ */}
      <div
        className="rounded-xl shadow-sm"
        style={{
          backgroundColor: background.card,
          padding: spacing['6'],
          border: `1px solid ${border.default}`,
        }}
      >
        <Label className="text-sm font-semibold" style={{ color: text.heading }}>
          Passing Threshold
        </Label>
        <p style={{ fontSize: fontSizes.xs, color: text.muted, marginTop: spacing['1'] }}>
          Minimum percentage required to pass. Students below this are marked as failing.
        </p>

        <div className="flex items-center gap-3 mt-3">
          <Input
            type="number"
            value={grading.passingThreshold}
            onChange={e => updateGrading({ passingThreshold: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })}
            min={0}
            max={100}
            className="text-sm h-9"
            style={{ width: '100px', borderColor: border.default, color: text.heading }}
          />
          <span className="text-sm" style={{ color: text.muted }}>%</span>
          {passingGrade && (
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ backgroundColor: accent.soft, color: text.heading }}
            >
              Grade {passingGrade}
            </span>
          )}
        </div>
      </div>

      {/* ═══ VALIDATION WARNINGS ═══ */}
      {warnings.length > 0 && (
        <div
          className="flex items-start gap-3 rounded-xl"
          style={{
            backgroundColor: status.warning.soft,
            border: `1px solid ${status.warning.base}`,
            padding: spacing['4'],
          }}
        >
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: status.warning.base }} />
          <div>
            <p className="text-sm font-medium" style={{ color: status.warning.text }}>
              Grade scale warnings
            </p>
            <ul className="mt-1" style={{ display: 'flex', flexDirection: 'column', gap: spacing['1'] }}>
              {warnings.map((w, i) => (
                <li key={i} className="text-xs" style={{ color: text.muted }}>
                  • {w}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
