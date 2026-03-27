/**
 * TimetableSettingsSection — Settings panel sub-section for timetable configuration.
 *
 * 4 tabs: School Days, Bell Schedule, Subjects, Class Sections.
 * All data stored in SchoolConfig (periods, schoolDays) and mock registries
 * (subjects, classSections) which will migrate to API later.
 */

import * as React from 'react'
import { Plus, Trash2, GripVertical, Coffee } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { text, border, accent, background, primary } from '@/theme/colors'
import { spacing } from '@/config/spacing'
import { fontSizes } from '@/config/typography'
import { DAY_LABELS } from '@/features/timetable/types'
import type { SchoolConfig, PeriodDefinition } from '@/config/school-config'
import { subjects as mockSubjects, classSections as mockClassSections } from '@/data/mocks/timetable'
import type { Subject, ClassSection } from '@/features/timetable/types'

// ============================================================================
// Types
// ============================================================================

interface TimetableSettingsSectionProps {
  draft: SchoolConfig
  setDraft: React.Dispatch<React.SetStateAction<SchoolConfig>>
}

type SubTab = 'days' | 'bell' | 'subjects' | 'sections'

const SUB_TABS: { id: SubTab; label: string }[] = [
  { id: 'days', label: 'School Days' },
  { id: 'bell', label: 'Bell Schedule' },
  { id: 'subjects', label: 'Subjects' },
  { id: 'sections', label: 'Class Sections' },
]

// ============================================================================
// Main Component
// ============================================================================

export function TimetableSettingsSection({ draft, setDraft }: TimetableSettingsSectionProps) {
  const [activeTab, setActiveTab] = React.useState<SubTab>('days')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['4'] }}>
      {/* Sub-tab navigation */}
      <div
        className="flex items-center gap-1 rounded-lg overflow-hidden"
        style={{
          backgroundColor: border.subtle,
          padding: spacing['0.5'],
        }}
      >
        {SUB_TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 text-xs font-medium rounded-md px-3 py-2 transition-all cursor-pointer"
            style={{
              backgroundColor: activeTab === tab.id ? background.card : 'transparent',
              color: activeTab === tab.id ? text.heading : text.muted,
              boxShadow: activeTab === tab.id ? '0 1px 2px rgba(0,0,0,0.05)' : undefined,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'days' && <SchoolDaysTab draft={draft} setDraft={setDraft} />}
      {activeTab === 'bell' && <BellScheduleTab draft={draft} setDraft={setDraft} />}
      {activeTab === 'subjects' && <SubjectsTab />}
      {activeTab === 'sections' && <ClassSectionsTab />}
    </div>
  )
}

// ============================================================================
// Tab 1: School Days
// ============================================================================

function SchoolDaysTab({ draft, setDraft }: TimetableSettingsSectionProps) {
  const allDays = [0, 1, 2, 3, 4, 5] // Mon-Sat

  const toggleDay = (day: number) => {
    setDraft(prev => {
      const current = prev.schoolDays
      const next = current.includes(day)
        ? current.filter(d => d !== day)
        : [...current, day].sort()
      return { ...prev, schoolDays: next }
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['4'] }}>
      <div>
        <Label className="text-sm font-semibold" style={{ color: text.heading }}>
          Working Days
        </Label>
        <p style={{ fontSize: fontSizes.xs, color: text.muted, marginTop: spacing['1'] }}>
          Select which days of the week have classes scheduled.
        </p>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {allDays.map(day => {
          const isSelected = draft.schoolDays.includes(day)
          return (
            <button
              key={day}
              type="button"
              onClick={() => toggleDay(day)}
              className="flex flex-col items-center gap-1 rounded-lg px-3 py-3 transition-all cursor-pointer"
              style={{
                backgroundColor: isSelected ? accent.base : background.card,
                border: `1.5px solid ${isSelected ? text.heading : border.default}`,
                color: isSelected ? text.heading : text.muted,
              }}
            >
              <span className="text-sm font-semibold">{DAY_LABELS[day].slice(0, 3)}</span>
              <span className="text-[10px]">{DAY_LABELS[day]}</span>
            </button>
          )
        })}
      </div>

      <p style={{ fontSize: fontSizes.xs, color: text.muted }}>
        {draft.schoolDays.length} day{draft.schoolDays.length !== 1 ? 's' : ''} selected.
        The timetable grid will show only these days.
      </p>
    </div>
  )
}

// ============================================================================
// Tab 2: Bell Schedule (Periods & Breaks)
// ============================================================================

function BellScheduleTab({ draft, setDraft }: TimetableSettingsSectionProps) {
  const updatePeriod = (index: number, field: keyof PeriodDefinition, value: string | boolean) => {
    setDraft(prev => {
      const periods = [...prev.periods]
      periods[index] = { ...periods[index], [field]: value }
      return { ...prev, periods }
    })
  }

  const addPeriod = (isBreak: boolean) => {
    setDraft(prev => {
      const periods = [...prev.periods]
      const lastPeriod = periods[periods.length - 1]
      const periodCount = periods.filter(p => !p.isBreak).length
      const breakCount = periods.filter(p => p.isBreak).length

      const newPeriod: PeriodDefinition = isBreak
        ? {
            id: `break-${breakCount + 1}`,
            label: 'Break',
            startTime: lastPeriod?.endTime ?? '12:00',
            endTime: lastPeriod ? incrementTime(lastPeriod.endTime, 15) : '12:15',
            isBreak: true,
          }
        : {
            id: `p${periodCount + 1}`,
            label: `Period ${periodCount + 1}`,
            startTime: lastPeriod?.endTime ?? '08:00',
            endTime: lastPeriod ? incrementTime(lastPeriod.endTime, 45) : '08:45',
            isBreak: false,
          }

      return { ...prev, periods: [...periods, newPeriod] }
    })
  }

  const removePeriod = (index: number) => {
    setDraft(prev => ({
      ...prev,
      periods: prev.periods.filter((_, i) => i !== index),
    }))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['4'] }}>
      <div>
        <Label className="text-sm font-semibold" style={{ color: text.heading }}>
          Periods & Breaks
        </Label>
        <p style={{ fontSize: fontSizes.xs, color: text.muted, marginTop: spacing['1'] }}>
          Define the daily schedule. Drag to reorder, add periods or breaks as needed.
        </p>
      </div>

      {/* Period list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['2'] }}>
        {draft.periods.map((period, idx) => (
          <div
            key={period.id}
            className="flex items-center gap-2 rounded-lg transition-all"
            style={{
              backgroundColor: period.isBreak ? border.subtle : background.card,
              border: `1px solid ${border.default}`,
              padding: `${spacing['2']} ${spacing['2.5']}`,
            }}
          >
            {/* Drag handle placeholder */}
            <GripVertical className="w-4 h-4 flex-shrink-0" style={{ color: border.default }} />

            {/* Break indicator */}
            {period.isBreak && (
              <Coffee className="w-3.5 h-3.5 flex-shrink-0" style={{ color: text.muted }} />
            )}

            {/* Label */}
            <Input
              value={period.label}
              onChange={e => updatePeriod(idx, 'label', e.target.value)}
              className="text-xs h-8 flex-1 min-w-0"
              style={{
                maxWidth: '140px',
                borderColor: border.default,
                color: text.heading,
              }}
            />

            {/* Start time */}
            <input
              type="time"
              value={period.startTime}
              onChange={e => updatePeriod(idx, 'startTime', e.target.value)}
              className="text-xs rounded-md border px-2 py-1.5 outline-none"
              style={{
                borderColor: border.default,
                color: text.heading,
                backgroundColor: background.card,
                width: '100px',
              }}
            />

            <span className="text-xs" style={{ color: text.muted }}>to</span>

            {/* End time */}
            <input
              type="time"
              value={period.endTime}
              onChange={e => updatePeriod(idx, 'endTime', e.target.value)}
              className="text-xs rounded-md border px-2 py-1.5 outline-none"
              style={{
                borderColor: border.default,
                color: text.heading,
                backgroundColor: background.card,
                width: '100px',
              }}
            />

            {/* Delete */}
            <button
              type="button"
              onClick={() => removePeriod(idx)}
              className="p-1 rounded-md hover:opacity-70 cursor-pointer flex-shrink-0"
              style={{ color: text.muted }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Add buttons */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => addPeriod(false)}
          className="text-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Period
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => addPeriod(true)}
          className="text-xs"
        >
          <Coffee className="w-3.5 h-3.5" />
          Add Break
        </Button>
      </div>

      <p style={{ fontSize: fontSizes.xs, color: text.muted }}>
        {draft.periods.filter(p => !p.isBreak).length} teaching periods,{' '}
        {draft.periods.filter(p => p.isBreak).length} break{draft.periods.filter(p => p.isBreak).length !== 1 ? 's' : ''}.
      </p>
    </div>
  )
}

// ============================================================================
// Tab 3: Subjects
// ============================================================================

function SubjectsTab() {
  // For now, display mock subjects as read-only (will be editable when backend is ready)
  const [localSubjects] = React.useState<Subject[]>(mockSubjects)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['4'] }}>
      <div>
        <Label className="text-sm font-semibold" style={{ color: text.heading }}>
          Subjects
        </Label>
        <p style={{ fontSize: fontSizes.xs, color: text.muted, marginTop: spacing['1'] }}>
          Manage the subjects available for timetable assignment.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['1.5'] }}>
        {localSubjects.map(subject => (
          <div
            key={subject.id}
            className="flex items-center gap-3 rounded-lg"
            style={{
              backgroundColor: background.card,
              border: `1px solid ${border.default}`,
              padding: `${spacing['2']} ${spacing['3']}`,
            }}
          >
            {/* Color dot */}
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: subject.color }}
            />

            {/* Name */}
            <span
              className="text-sm font-medium flex-1"
              style={{ color: text.heading }}
            >
              {subject.name}
            </span>

            {/* Short name badge */}
            <span
              className="text-[10px] font-medium rounded px-2 py-0.5"
              style={{
                backgroundColor: border.subtle,
                color: text.muted,
              }}
            >
              {subject.shortName}
            </span>
          </div>
        ))}
      </div>

      <p style={{ fontSize: fontSizes.xs, color: text.muted }}>
        {localSubjects.length} subjects configured. Subject colors are used in the timetable grid.
      </p>
    </div>
  )
}

// ============================================================================
// Tab 4: Class Sections
// ============================================================================

function ClassSectionsTab() {
  const [localSections] = React.useState<ClassSection[]>(mockClassSections)

  // Group by grade
  const grouped = React.useMemo(() => {
    const map = new Map<string, ClassSection[]>()
    localSections.forEach(s => {
      const list = map.get(s.grade) ?? []
      list.push(s)
      map.set(s.grade, list)
    })
    // Sort by grade number
    return Array.from(map.entries()).sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
  }, [localSections])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['4'] }}>
      <div>
        <Label className="text-sm font-semibold" style={{ color: text.heading }}>
          Class Sections
        </Label>
        <p style={{ fontSize: fontSizes.xs, color: text.muted, marginTop: spacing['1'] }}>
          Define grades and sections. Each section gets its own timetable template.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['3'] }}>
        {grouped.map(([grade, sections]) => (
          <div
            key={grade}
            className="rounded-lg"
            style={{
              backgroundColor: background.card,
              border: `1px solid ${border.default}`,
              padding: `${spacing['2.5']} ${spacing['3']}`,
            }}
          >
            {/* Grade header */}
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-xs font-semibold"
                style={{ color: text.heading }}
              >
                Grade {grade}
              </span>
              <span
                className="text-[10px]"
                style={{ color: text.muted }}
              >
                {sections.length} section{sections.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Section badges */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {sections.map(section => (
                <span
                  key={section.id}
                  className="text-xs font-medium rounded-md px-2.5 py-1"
                  style={{
                    backgroundColor: accent.base,
                    color: text.heading,
                  }}
                >
                  {section.label}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p style={{ fontSize: fontSizes.xs, color: text.muted }}>
        {localSections.length} class sections across {grouped.length} grades.
      </p>
    </div>
  )
}

// ============================================================================
// Helpers
// ============================================================================

/** Add minutes to a HH:mm time string */
function incrementTime(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + minutes
  const newH = Math.floor(total / 60) % 24
  const newM = total % 60
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`
}
