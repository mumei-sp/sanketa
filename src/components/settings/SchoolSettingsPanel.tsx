/**
 * SchoolSettingsPanel — Full-screen right-side Sheet with internal navigation.
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
  ChevronRight,
  type LucideIcon,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { fontSizes } from '@/config/typography'

// ============================================================================
// Settings Navigation Registry
// ============================================================================

interface SettingsSection {
  id: string
  label: string
  description: string
  icon: LucideIcon
  enabled: boolean
}

const SETTINGS_SECTIONS: SettingsSection[] = [
  { id: 'general', label: 'General', description: 'School name & info', icon: Building2, enabled: true },
  { id: 'academic', label: 'Academic Calendar', description: 'Year & term structure', icon: Calendar, enabled: true },
  { id: 'notifications', label: 'Notifications', description: 'Alerts & reminders', icon: Bell, enabled: false },
  { id: 'appearance', label: 'Appearance', description: 'Theme & layout', icon: Palette, enabled: false },
  { id: 'security', label: 'Security', description: 'Access & permissions', icon: Shield, enabled: false },
]

// ============================================================================
// Shared Styled Wrapper for Form Fields
// ============================================================================

function FieldGroup({ label, hint, children, maxWidth = '480px' }: {
  label: string
  hint?: string
  children: React.ReactNode
  maxWidth?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['2'], maxWidth }}>
      <Label
        className="text-sm font-semibold"
        style={{ color: colors.text.heading }}
      >
        {label}
      </Label>
      {children}
      {hint && (
        <p style={{ fontSize: fontSizes.xs, color: colors.text.muted, lineHeight: 1.4 }}>
          {hint}
        </p>
      )}
    </div>
  )
}

// ============================================================================
// Section Components
// ============================================================================

interface SectionProps {
  draft: SchoolConfig
  setDraft: React.Dispatch<React.SetStateAction<SchoolConfig>>
}

/** General Settings */
function GeneralSection({ draft, setDraft }: SectionProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['8'] }}>
      <SectionHeader
        title="General Settings"
        description="Basic information about your school that appears across the application."
      />

      <FieldGroup label="School Name" hint="Displayed in the sidebar header and exported reports.">
        <Input
          id="school-name"
          value={draft.schoolName}
          onChange={e => setDraft(prev => ({ ...prev, schoolName: e.target.value }))}
          className="text-sm"
          style={{
            backgroundColor: colors.background.card,
            borderColor: colors.border.default,
          }}
        />
      </FieldGroup>
    </div>
  )
}

/** Academic Calendar Settings */
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['8'] }}>
      <SectionHeader
        title="Academic Calendar"
        description="Configure your school's academic year and term structure. All date filters and semester labels across the app adjust automatically."
      />

      {/* Start Month */}
      <FieldGroup
        label="Academic Year Start Month"
        hint="The month your academic year begins. Common: April (India), August (US), September (UK)."
      >
        <Select
          value={String(draft.academicYearStartMonth)}
          onValueChange={v => setDraft(prev => ({ ...prev, academicYearStartMonth: parseInt(v) }))}
        >
          <SelectTrigger
            className="text-sm"
            style={{
              maxWidth: '240px',
              backgroundColor: colors.background.card,
              borderColor: colors.border.default,
              color: colors.text.heading,
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
      </FieldGroup>

      {/* Term Structure */}
      <FieldGroup label="Term Structure" maxWidth="520px">
        <RadioGroup
          value={draft.termStructure}
          onValueChange={v => setDraft(prev => ({ ...prev, termStructure: v as TermStructure }))}
          style={{ display: 'flex', flexDirection: 'column', gap: spacing['2.5'] }}
        >
          {TERM_STRUCTURE_OPTIONS.map(opt => {
            const isSelected = draft.termStructure === opt.value
            return (
              <label
                key={opt.value}
                htmlFor={`term-${opt.value}`}
                className="flex items-center rounded-xl border-2 cursor-pointer transition-all"
                style={{
                  padding: `${spacing['3']} ${spacing['4']}`,
                  borderColor: isSelected ? colors.text.heading : colors.border.default,
                  backgroundColor: isSelected ? colors.accent.soft : colors.background.card,
                }}
              >
                <RadioGroupItem value={opt.value} id={`term-${opt.value}`} className="mr-4 shrink-0" />
                <div className="flex-1">
                  <span
                    className="text-sm font-semibold block"
                    style={{ color: colors.text.heading }}
                  >
                    {opt.label}
                  </span>
                  <span
                    className="text-xs block"
                    style={{ color: colors.text.muted, marginTop: spacing['0.5'] }}
                  >
                    {opt.description}
                  </span>
                </div>
                {isSelected && (
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 ml-3"
                    style={{ backgroundColor: colors.text.heading }}
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
      </FieldGroup>

      {/* Preview Card */}
      <div
        className="rounded-xl"
        style={{
          backgroundColor: colors.accent.soft,
          border: `1px solid ${colors.accent.base}`,
          padding: spacing['5'],
          maxWidth: '520px',
        }}
      >
        <div className="flex items-center" style={{ gap: spacing['2'], marginBottom: spacing['3'] }}>
          <Calendar className="w-4 h-4" style={{ color: colors.text.heading }} />
          <p
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: colors.text.heading }}
          >
            Academic Year Preview
          </p>
        </div>

        <p className="text-sm font-semibold" style={{ color: colors.text.heading, marginBottom: spacing['3'] }}>
          {MONTH_LABELS[draft.academicYearStartMonth]} {previewYear.startYear}
          {' — '}
          {MONTH_LABELS[(draft.academicYearStartMonth + 11) % 12]} {previewYear.endYear}
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing['2'] }}>
          {previewTerms.map(term => (
            <div
              key={term.term}
              className="rounded-lg"
              style={{
                backgroundColor: colors.background.card,
                border: `1px solid ${colors.border.default}`,
                padding: `${spacing['2']} ${spacing['3']}`,
              }}
            >
              <p className="text-xs font-semibold" style={{ color: colors.text.heading }}>
                {term.label}
              </p>
              <p className="text-xs" style={{ color: colors.text.muted, marginTop: spacing['0.5'] }}>
                {MONTH_SHORT_LABELS[term.startMonth]} — {MONTH_SHORT_LABELS[term.endMonth]}
                <span style={{ marginLeft: spacing['1'], opacity: 0.6 }}>
                  ({term.monthCount} months)
                </span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/** Section header with title + description */
function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div style={{ borderBottom: `1px solid ${colors.border.default}`, paddingBottom: spacing['4'] }}>
      <h3
        className="text-lg font-bold"
        style={{ color: colors.text.heading, marginBottom: spacing['1'] }}
      >
        {title}
      </h3>
      <p className="text-sm" style={{ color: colors.text.muted, lineHeight: 1.5, maxWidth: '600px' }}>
        {description}
      </p>
    </div>
  )
}

/** Placeholder for future sections */
function ComingSoonSection({ section }: { section: SettingsSection }) {
  const Icon = section.icon
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['8'] }}>
      <SectionHeader title={section.label} description={section.description} />

      <div
        className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center"
        style={{
          borderColor: colors.border.default,
          padding: `${spacing['16']} ${spacing['8']}`,
        }}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ backgroundColor: colors.accent.soft, marginBottom: spacing['4'] }}
        >
          <Icon className="w-6 h-6" style={{ color: colors.text.muted }} />
        </div>
        <p className="text-sm font-medium" style={{ color: colors.text.heading }}>
          Coming Soon
        </p>
        <p className="text-xs text-center" style={{ color: colors.text.muted, marginTop: spacing['1'], maxWidth: '280px' }}>
          This settings section is under development and will be available in a future update.
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
        return section ? <ComingSoonSection section={section} /> : null
      }
    }
  }

  return (
    <Sheet open={isSettingsOpen} onOpenChange={setSettingsOpen}>
      <SheetContent
        side="right"
        size="full"
        className="flex flex-col p-0 gap-0"
        onInteractOutside={e => {
          const target = e.target as HTMLElement
          if (target?.closest('[data-radix-popper-content-wrapper]') || target?.closest('[role="listbox"]')) {
            e.preventDefault()
          }
        }}
      >
        {/* Accessibility title */}
        <SheetTitle className="sr-only">School Settings</SheetTitle>

        {/* ═══ Header ═══ */}
        <div
          className="flex items-center justify-between shrink-0"
          style={{
            padding: `${spacing['4']} ${spacing['8']}`,
            borderBottom: `1px solid ${colors.border.default}`,
            backgroundColor: colors.background.card,
          }}
        >
          <div>
            <h2
              className="text-xl font-bold"
              style={{ color: colors.text.heading }}
            >
              Settings
            </h2>
            <p className="text-xs" style={{ color: colors.text.muted, marginTop: spacing['0.5'] }}>
              Manage your school configuration and preferences
            </p>
          </div>
          <div className="flex items-center" style={{ gap: spacing['2'] }}>
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center text-xs font-medium transition-opacity hover:opacity-70 cursor-pointer"
              style={{ color: colors.text.muted, gap: spacing['1.5'] }}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
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
        </div>

        {/* ═══ Body: Sidebar + Content ═══ */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* ── Left sidebar nav ── */}
          <nav
            className="shrink-0 overflow-y-auto hidden md:flex flex-col"
            style={{
              width: '260px',
              backgroundColor: colors.background.page,
              borderRight: `1px solid ${colors.border.default}`,
              padding: `${spacing['4']} ${spacing['3']}`,
              gap: spacing['1'],
            }}
          >
            <p
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{
                color: colors.text.muted,
                padding: `${spacing['1']} ${spacing['3']}`,
                marginBottom: spacing['1'],
              }}
            >
              Settings
            </p>

            {SETTINGS_SECTIONS.map(section => {
              const isActive = section.id === activeSection
              const Icon = section.icon
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => section.enabled && setActiveSection(section.id)}
                  className="flex items-center rounded-xl text-left transition-all"
                  style={{
                    padding: `${spacing['2.5']} ${spacing['3']}`,
                    gap: spacing['3'],
                    backgroundColor: isActive ? colors.accent.base : 'transparent',
                    opacity: section.enabled ? 1 : 0.45,
                    cursor: section.enabled ? 'pointer' : 'not-allowed',
                  }}
                >
                  {/* Icon circle */}
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: isActive ? colors.text.heading : colors.background.card,
                      border: isActive ? 'none' : `1px solid ${colors.border.default}`,
                    }}
                  >
                    <Icon
                      className="w-4 h-4"
                      style={{ color: isActive ? colors.background.card : colors.text.muted }}
                    />
                  </div>

                  {/* Label + description */}
                  <div className="flex-1 min-w-0">
                    <span
                      className="text-sm block truncate"
                      style={{
                        color: isActive ? colors.text.heading : colors.text.body,
                        fontWeight: isActive ? 600 : 400,
                      }}
                    >
                      {section.label}
                    </span>
                    <span
                      className="text-[10px] block truncate"
                      style={{ color: colors.text.muted, marginTop: '1px' }}
                    >
                      {section.description}
                    </span>
                  </div>

                  {/* Active indicator or "Soon" badge */}
                  {isActive ? (
                    <ChevronRight className="w-4 h-4 shrink-0" style={{ color: colors.text.heading }} />
                  ) : !section.enabled ? (
                    <span
                      className="text-[9px] font-semibold uppercase rounded-full shrink-0"
                      style={{
                        backgroundColor: colors.border.default,
                        color: colors.text.muted,
                        padding: `${spacing['0.5']} ${spacing['2']}`,
                      }}
                    >
                      Soon
                    </span>
                  ) : null}
                </button>
              )
            })}
          </nav>

          {/* ── Mobile section tabs ── */}
          <div
            className="flex md:hidden overflow-x-auto shrink-0 border-b"
            style={{
              borderColor: colors.border.default,
              backgroundColor: colors.background.page,
              padding: `${spacing['2']} ${spacing['4']}`,
              gap: spacing['1.5'],
            }}
          >
            {SETTINGS_SECTIONS.filter(s => s.enabled).map(section => {
              const isActive = section.id === activeSection
              const Icon = section.icon
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className="flex items-center whitespace-nowrap text-xs font-medium rounded-lg transition-all"
                  style={{
                    padding: `${spacing['2']} ${spacing['3']}`,
                    gap: spacing['1.5'],
                    backgroundColor: isActive ? colors.accent.base : 'transparent',
                    color: isActive ? colors.text.heading : colors.text.muted,
                  }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {section.label}
                </button>
              )
            })}
          </div>

          {/* ── Right content area ── */}
          <div
            className="flex-1 overflow-y-auto"
            style={{
              padding: `${spacing['8']} ${spacing['10']}`,
              backgroundColor: colors.background.card,
            }}
          >
            {renderSection()}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
