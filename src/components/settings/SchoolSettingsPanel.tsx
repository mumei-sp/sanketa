/**
 * SchoolSettingsPanel — Full-width right-side Sheet with internal navigation.
 *
 * Opens when the gear icon in the top bar is clicked.
 * Contains an internal sidebar for switching between settings sections.
 * Uses local draft state so Cancel discards edits.
 *
 * To add a new settings section:
 * 1. Add a new entry to SETTINGS_SECTIONS
 * 2. Create the section component
 * 3. Add it to the renderSection switch
 */

import * as React from 'react'
import {
  RotateCcw,
  Calendar,
  Building2,
  Bell,
  Shield,
  Palette,
  type LucideIcon,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useSchoolConfig } from '@/config/SchoolConfigContext'
import {
  MONTH_LABELS,
  MONTH_SHORT_LABELS,
  TERM_STRUCTURE_OPTIONS,
  type TermStructure,
  type SchoolConfig,
} from '@/config/school-config'
import { getAcademicYear, getTerms } from '@/utils/academic-date'
import { colors } from '@/theme/colors'
import { spacing } from '@/config/spacing'

// ============================================================================
// Settings Navigation Registry
// ============================================================================

interface SettingsSection {
  id: string
  label: string
  icon: LucideIcon
  /** Whether this section is available (future sections can be disabled) */
  enabled: boolean
}

const SETTINGS_SECTIONS: SettingsSection[] = [
  { id: 'general', label: 'General', icon: Building2, enabled: true },
  { id: 'academic', label: 'Academic Calendar', icon: Calendar, enabled: true },
  { id: 'notifications', label: 'Notifications', icon: Bell, enabled: false },
  { id: 'appearance', label: 'Appearance', icon: Palette, enabled: false },
  { id: 'security', label: 'Security', icon: Shield, enabled: false },
]

// ============================================================================
// Section Components
// ============================================================================

interface SectionProps {
  draft: SchoolConfig
  setDraft: React.Dispatch<React.SetStateAction<SchoolConfig>>
}

/** General Settings — school name */
function GeneralSection({ draft, setDraft }: SectionProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['4'] }}>
      <div>
        <h3
          className="text-base font-bold"
          style={{ color: colors.text.heading, marginBottom: spacing['1'] }}
        >
          General Settings
        </h3>
        <p className="text-xs" style={{ color: colors.text.muted }}>
          Basic information about your school.
        </p>
      </div>

      <Separator />

      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['3'] }}>
        <Label htmlFor="school-name" className="text-sm font-medium" style={{ color: colors.text.heading }}>
          School Name
        </Label>
        <Input
          id="school-name"
          value={draft.schoolName}
          onChange={e => setDraft(prev => ({ ...prev, schoolName: e.target.value }))}
          className="text-sm"
          style={{ maxWidth: '400px' }}
        />
        <p className="text-xs" style={{ color: colors.text.muted }}>
          This name appears in the sidebar and page headers.
        </p>
      </div>
    </div>
  )
}

/** Academic Calendar Settings — start month + term structure */
function AcademicSection({ draft, setDraft }: SectionProps) {
  const previewYear = React.useMemo(
    () => getAcademicYear(new Date(), draft.academicYearStartMonth),
    [draft.academicYearStartMonth],
  )
  const previewTerms = React.useMemo(
    () => getTerms(draft.academicYearStartMonth, draft.termStructure),
    [draft.academicYearStartMonth, draft.termStructure],
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['4'] }}>
      <div>
        <h3
          className="text-base font-bold"
          style={{ color: colors.text.heading, marginBottom: spacing['1'] }}
        >
          Academic Calendar
        </h3>
        <p className="text-xs" style={{ color: colors.text.muted }}>
          Configure your school's academic year and term structure. All date filters across the app will adjust automatically.
        </p>
      </div>

      <Separator />

      {/* Start Month */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['1.5'] }}>
        <Label className="text-sm font-medium" style={{ color: colors.text.heading }}>
          Academic Year Start Month
        </Label>
        <Select
          value={String(draft.academicYearStartMonth)}
          onValueChange={v => setDraft(prev => ({ ...prev, academicYearStartMonth: parseInt(v) }))}
        >
          <SelectTrigger
            className="text-sm"
            style={{
              maxWidth: '280px',
              backgroundColor: colors.background.card,
              borderColor: colors.border.default,
            }}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTH_LABELS.map((month, idx) => (
              <SelectItem key={idx} value={String(idx)}>
                {month}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs" style={{ color: colors.text.muted }}>
          The month your academic year begins (e.g., April for India, August for US).
        </p>
      </div>

      {/* Term Structure */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['2'] }}>
        <Label className="text-sm font-medium" style={{ color: colors.text.heading }}>
          Term Structure
        </Label>
        <RadioGroup
          value={draft.termStructure}
          onValueChange={v => setDraft(prev => ({ ...prev, termStructure: v as TermStructure }))}
          style={{ display: 'flex', flexDirection: 'column', gap: spacing['2'] }}
        >
          {TERM_STRUCTURE_OPTIONS.map(opt => (
            <label
              key={opt.value}
              htmlFor={`term-${opt.value}`}
              className="flex items-center rounded-lg border cursor-pointer transition-all"
              style={{
                padding: `${spacing['3']} ${spacing['4']}`,
                maxWidth: '400px',
                borderColor: draft.termStructure === opt.value
                  ? colors.text.heading
                  : colors.border.default,
                backgroundColor: draft.termStructure === opt.value
                  ? colors.accent.soft
                  : colors.background.card,
              }}
            >
              <RadioGroupItem value={opt.value} id={`term-${opt.value}`} className="mr-3" />
              <div>
                <span className="text-sm font-medium" style={{ color: colors.text.heading }}>
                  {opt.label}
                </span>
                <span className="text-xs block" style={{ color: colors.text.muted, marginTop: '2px' }}>
                  {opt.description}
                </span>
              </div>
            </label>
          ))}
        </RadioGroup>
      </div>

      {/* Preview Card */}
      <div
        className="rounded-xl border"
        style={{
          backgroundColor: colors.accent.soft,
          borderColor: colors.border.subtle,
          padding: spacing['4'],
          maxWidth: '400px',
        }}
      >
        <p
          className="text-xs font-bold uppercase tracking-wide"
          style={{ color: colors.text.heading, marginBottom: spacing['2'] }}
        >
          Preview
        </p>
        <p className="text-sm" style={{ color: colors.text.body }}>
          <span className="font-semibold" style={{ color: colors.text.heading }}>
            {MONTH_LABELS[draft.academicYearStartMonth]} {previewYear.startYear}
          </span>
          {' – '}
          <span className="font-semibold" style={{ color: colors.text.heading }}>
            {MONTH_LABELS[(draft.academicYearStartMonth + 11) % 12]} {previewYear.endYear}
          </span>
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing['2'], marginTop: spacing['2.5'] }}>
          {previewTerms.map(term => (
            <span
              key={term.term}
              className="inline-flex items-center text-xs font-medium rounded-lg"
              style={{
                backgroundColor: colors.accent.base,
                color: colors.text.heading,
                padding: `${spacing['1']} ${spacing['2.5']}`,
              }}
            >
              {term.label}: {MONTH_SHORT_LABELS[term.startMonth]} – {MONTH_SHORT_LABELS[term.endMonth]}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

/** Placeholder for future sections */
function ComingSoonSection({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['4'] }}>
      <h3
        className="text-base font-bold"
        style={{ color: colors.text.heading }}
      >
        {label}
      </h3>
      <div
        className="rounded-xl border flex items-center justify-center"
        style={{
          backgroundColor: colors.background.surface,
          borderColor: colors.border.subtle,
          padding: spacing['12'],
        }}
      >
        <p className="text-sm" style={{ color: colors.text.muted }}>
          Coming soon — this section is under development.
        </p>
      </div>
    </div>
  )
}

// ============================================================================
// Main Panel Component
// ============================================================================

export function SchoolSettingsPanel() {
  const { config, updateConfig, resetConfig, isSettingsOpen, setSettingsOpen } = useSchoolConfig()

  const [activeSection, setActiveSection] = React.useState('general')
  const [draft, setDraft] = React.useState(config)

  // Sync draft + reset to first section when panel opens
  React.useEffect(() => {
    if (isSettingsOpen) {
      setDraft(config)
      setActiveSection('general')
    }
  }, [isSettingsOpen, config])

  const handleSave = () => {
    updateConfig(draft)
    setSettingsOpen(false)
  }

  const handleCancel = () => {
    setSettingsOpen(false)
  }

  const handleReset = () => {
    resetConfig()
    setSettingsOpen(false)
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'general':
        return <GeneralSection draft={draft} setDraft={setDraft} />
      case 'academic':
        return <AcademicSection draft={draft} setDraft={setDraft} />
      default: {
        const section = SETTINGS_SECTIONS.find(s => s.id === activeSection)
        return <ComingSoonSection label={section?.label ?? 'Settings'} />
      }
    }
  }

  return (
    <Sheet open={isSettingsOpen} onOpenChange={setSettingsOpen}>
      <SheetContent
        side="right"
        size="xl"
        className="flex flex-col p-0"
        onInteractOutside={e => {
          const target = e.target as HTMLElement
          if (target?.closest('[data-radix-popper-content-wrapper]') || target?.closest('[role="listbox"]')) {
            e.preventDefault()
          }
        }}
      >
        {/* ═══ Header ═══ */}
        <SheetTitle className="sr-only">School Settings</SheetTitle>
        <div
          className="flex items-center justify-between shrink-0"
          style={{
            padding: `${spacing['4']} ${spacing['6']}`,
            borderBottom: `1px solid ${colors.border.default}`,
          }}
        >
          <div>
            <h2
              className="text-lg font-bold"
              style={{ color: colors.text.heading }}
            >
              School Settings
            </h2>
            <p className="text-xs" style={{ color: colors.text.muted }}>
              Manage your school configuration
            </p>
          </div>
        </div>

        {/* ═══ Body: Sidebar + Content ═══ */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left sidebar nav */}
          <nav
            className="shrink-0 overflow-y-auto hidden sm:flex flex-col"
            style={{
              width: '200px',
              backgroundColor: colors.background.surface,
              borderRight: `1px solid ${colors.border.default}`,
              padding: `${spacing['3']} ${spacing['2']}`,
              gap: spacing['0.5'],
            }}
          >
            {SETTINGS_SECTIONS.map(section => {
              const isActive = section.id === activeSection
              const Icon = section.icon
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => section.enabled && setActiveSection(section.id)}
                  className="flex items-center rounded-lg text-left transition-all cursor-pointer"
                  style={{
                    padding: `${spacing['2']} ${spacing['3']}`,
                    gap: spacing['2.5'],
                    backgroundColor: isActive ? colors.accent.base : 'transparent',
                    color: isActive ? colors.text.heading : section.enabled ? colors.text.body : colors.text.muted,
                    opacity: section.enabled ? 1 : 0.5,
                    cursor: section.enabled ? 'pointer' : 'not-allowed',
                    fontWeight: isActive ? 600 : 400,
                    fontSize: '0.8125rem',
                  }}
                >
                  <Icon
                    className="w-4 h-4 shrink-0"
                    style={{ color: isActive ? colors.text.heading : section.enabled ? colors.text.muted : colors.border.default }}
                  />
                  {section.label}
                  {!section.enabled && (
                    <span
                      className="text-[10px] ml-auto rounded-full"
                      style={{
                        backgroundColor: colors.border.default,
                        color: colors.text.muted,
                        padding: `${spacing['0.5']} ${spacing['1.5']}`,
                      }}
                    >
                      Soon
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Mobile section tabs (visible on small screens) */}
          <div
            className="flex sm:hidden overflow-x-auto shrink-0 border-b"
            style={{
              borderColor: colors.border.default,
              backgroundColor: colors.background.surface,
              padding: `${spacing['2']} ${spacing['3']}`,
              gap: spacing['1'],
            }}
          >
            {SETTINGS_SECTIONS.filter(s => s.enabled).map(section => {
              const isActive = section.id === activeSection
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className="whitespace-nowrap text-xs font-medium rounded-md transition-all"
                  style={{
                    padding: `${spacing['1.5']} ${spacing['3']}`,
                    backgroundColor: isActive ? colors.accent.base : 'transparent',
                    color: isActive ? colors.text.heading : colors.text.muted,
                  }}
                >
                  {section.label}
                </button>
              )
            })}
          </div>

          {/* Right content area */}
          <div
            className="flex-1 overflow-y-auto"
            style={{ padding: spacing['6'] }}
          >
            {renderSection()}
          </div>
        </div>

        {/* ═══ Footer ═══ */}
        <SheetFooter
          className="flex-row items-center justify-between sm:justify-between shrink-0"
          style={{
            padding: `${spacing['3']} ${spacing['6']}`,
            borderTop: `1px solid ${colors.border.default}`,
          }}
        >
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center text-xs font-medium transition-opacity hover:opacity-70 cursor-pointer"
            style={{ color: colors.text.muted, gap: spacing['1.5'] }}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to defaults
          </button>
          <div className="flex items-center" style={{ gap: spacing['2'] }}>
            <Button variant="outline" onClick={handleCancel} className="text-sm">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="text-sm"
              style={{
                backgroundColor: colors.text.heading,
                color: colors.background.card,
              }}
            >
              Save Changes
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
