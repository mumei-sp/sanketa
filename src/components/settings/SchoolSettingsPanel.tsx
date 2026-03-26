/**
 * SchoolSettingsPanel — Full-screen settings overlay with internal navigation.
 *
 * Uses the project's Tile/SectionCard components for consistent card styling.
 * Opens from the gear icon in the top bar.
 *
 * To add a new settings section:
 * 1. Add entry to SETTINGS_SECTIONS
 * 2. Create the section component
 * 3. Add to renderSection switch
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
import { text, border, accent, background } from '@/theme/colors'
import { spacing } from '@/config/spacing'
import { fontSizes } from '@/config/typography'

// ============================================================================
// Settings Navigation
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
// Reusable form field wrapper
// ============================================================================

function FieldGroup({ label, hint, children }: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['2'] }}>
      <Label className="text-sm font-semibold" style={{ color: text.heading }}>
        {label}
      </Label>
      {children}
      {hint && (
        <p style={{ fontSize: fontSizes.xs, color: text.muted, lineHeight: 1.5 }}>{hint}</p>
      )}
    </div>
  )
}

// ============================================================================
// Section: General
// ============================================================================

interface SectionProps {
  draft: SchoolConfig
  setDraft: React.Dispatch<React.SetStateAction<SchoolConfig>>
}

function GeneralSection({ draft, setDraft }: SectionProps) {
  return (
    <>
      <SectionHeading title="General Settings" description="Basic information about your school." />

      <div
        className="rounded-xl shadow-sm"
        style={{
          backgroundColor: background.card,
          padding: spacing['6'],
          border: `1px solid ${border.default}`,
        }}
      >
        <FieldGroup label="School Name" hint="Displayed in the sidebar header and exported reports.">
          <Input
            value={draft.schoolName}
            onChange={e => setDraft(prev => ({ ...prev, schoolName: e.target.value }))}
            className="text-sm"
            style={{ maxWidth: '420px' }}
          />
        </FieldGroup>
      </div>
    </>
  )
}

// ============================================================================
// Section: Academic Calendar
// ============================================================================

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
    <>
      <SectionHeading
        title="Academic Calendar"
        description="Configure your academic year and term structure. All date filters across the app adjust automatically."
      />

      {/* Start Month Card */}
      <div
        className="rounded-xl shadow-sm"
        style={{
          backgroundColor: background.card,
          padding: spacing['6'],
          border: `1px solid ${border.default}`,
        }}
      >
        <FieldGroup
          label="Academic Year Start Month"
          hint="The month your academic year begins. Common: April (India), August (US), September (UK)."
        >
          <Select
            value={String(draft.academicYearStartMonth)}
            onValueChange={v => setDraft(prev => ({ ...prev, academicYearStartMonth: parseInt(v) }))}
          >
            <SelectTrigger className="text-sm" style={{ maxWidth: '240px' }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTH_LABELS.map((month, idx) => (
                <SelectItem key={idx} value={String(idx)}>{month}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldGroup>
      </div>

      {/* Term Structure Card */}
      <div
        className="rounded-xl shadow-sm"
        style={{
          backgroundColor: background.card,
          padding: spacing['6'],
          border: `1px solid ${border.default}`,
        }}
      >
        <FieldGroup label="Term Structure">
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
                  className="flex items-center rounded-xl cursor-pointer transition-all"
                  style={{
                    padding: `${spacing['3']} ${spacing['4']}`,
                    maxWidth: '460px',
                    border: `2px solid ${isSelected ? text.heading : border.default}`,
                    backgroundColor: isSelected ? accent.soft : background.surface,
                  }}
                >
                  <RadioGroupItem value={opt.value} id={`term-${opt.value}`} className="mr-4 shrink-0" />
                  <div className="flex-1">
                    <span className="text-sm font-semibold" style={{ color: text.heading }}>
                      {opt.label}
                    </span>
                    <span className="text-xs block" style={{ color: text.muted, marginTop: '2px' }}>
                      {opt.description}
                    </span>
                  </div>
                  {isSelected && (
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 ml-3"
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
        </FieldGroup>
      </div>

      {/* Preview Card */}
      <div
        className="rounded-xl shadow-sm"
        style={{
          backgroundColor: accent.soft,
          padding: spacing['6'],
          border: `1px solid ${accent.base}`,
        }}
      >
        <div className="flex items-center" style={{ gap: spacing['2'], marginBottom: spacing['3'] }}>
          <Calendar className="w-4 h-4" style={{ color: text.heading }} />
          <p
            style={{
              fontSize: fontSizes.xs,
              fontWeight: 700,
              color: text.heading,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Academic Year Preview
          </p>
        </div>

        <p className="text-sm font-semibold" style={{ color: text.heading, marginBottom: spacing['4'] }}>
          {MONTH_LABELS[draft.academicYearStartMonth]} {previewYear.startYear}
          {' — '}
          {MONTH_LABELS[(draft.academicYearStartMonth + 11) % 12]} {previewYear.endYear}
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing['3'] }}>
          {previewTerms.map(term => (
            <div
              key={term.term}
              className="rounded-lg shadow-sm"
              style={{
                backgroundColor: background.card,
                border: `1px solid ${border.default}`,
                padding: `${spacing['3']} ${spacing['4']}`,
                minWidth: '140px',
              }}
            >
              <p className="text-xs font-bold" style={{ color: text.heading }}>
                {term.label}
              </p>
              <p className="text-xs" style={{ color: text.muted, marginTop: spacing['1'] }}>
                {MONTH_SHORT_LABELS[term.startMonth]} — {MONTH_SHORT_LABELS[term.endMonth]}
                <span style={{ opacity: 0.6, marginLeft: spacing['1'] }}>
                  · {term.monthCount}mo
                </span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

// ============================================================================
// Section heading
// ============================================================================

function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <div style={{ marginBottom: spacing['2'] }}>
      <h3 className="text-lg font-bold" style={{ color: text.heading }}>
        {title}
      </h3>
      <p className="text-sm" style={{ color: text.muted, lineHeight: 1.5, marginTop: spacing['1'] }}>
        {description}
      </p>
    </div>
  )
}

// ============================================================================
// Coming Soon placeholder
// ============================================================================

function ComingSoonSection({ section }: { section: SettingsSection }) {
  const Icon = section.icon
  return (
    <>
      <SectionHeading title={section.label} description={section.description} />

      <div
        className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center"
        style={{
          borderColor: border.default,
          padding: `${spacing['16']} ${spacing['8']}`,
          backgroundColor: background.surface,
        }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm"
          style={{ backgroundColor: accent.soft, marginBottom: spacing['4'] }}
        >
          <Icon className="w-6 h-6" style={{ color: text.muted }} />
        </div>
        <p className="text-sm font-semibold" style={{ color: text.heading }}>
          Coming Soon
        </p>
        <p
          className="text-xs text-center"
          style={{ color: text.muted, marginTop: spacing['1.5'], maxWidth: '300px', lineHeight: 1.5 }}
        >
          This settings section is under development and will be available in a future update.
        </p>
      </div>
    </>
  )
}

// ============================================================================
// Main Panel
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

  const handleSave = () => { updateConfig(draft); setSettingsOpen(false) }
  const handleCancel = () => { setSettingsOpen(false) }
  const handleReset = () => { resetConfig(); setSettingsOpen(false) }

  const renderSection = () => {
    switch (activeSection) {
      case 'general': return <GeneralSection draft={draft} setDraft={setDraft} />
      case 'academic': return <AcademicSection draft={draft} setDraft={setDraft} />
      default: {
        const s = SETTINGS_SECTIONS.find(x => x.id === activeSection)
        return s ? <ComingSoonSection section={s} /> : null
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
        <SheetTitle className="sr-only">School Settings</SheetTitle>

        {/* ═══ Body: Sidebar + Content ═══ */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* ── Left sidebar nav ── */}
          <nav
            className="shrink-0 overflow-y-auto hidden md:flex flex-col justify-between"
            style={{
              width: '260px',
              backgroundColor: background.card,
              borderRight: `1px solid ${border.default}`,
              padding: spacing['4'],
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['1'] }}>
              {/* Title */}
              <div style={{ padding: `${spacing['2']} ${spacing['3']}`, marginBottom: spacing['2'] }}>
                <h2 className="text-lg font-bold" style={{ color: text.heading }}>
                  Settings
                </h2>
                <p className="text-xs" style={{ color: text.muted, marginTop: spacing['0.5'] }}>
                  School configuration
                </p>
              </div>

              {/* Nav items */}
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
                      backgroundColor: isActive ? accent.base : 'transparent',
                      opacity: section.enabled ? 1 : 0.45,
                      cursor: section.enabled ? 'pointer' : 'not-allowed',
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: isActive ? text.heading : background.surface,
                        border: isActive ? 'none' : `1px solid ${border.default}`,
                      }}
                    >
                      <Icon className="w-4 h-4" style={{ color: isActive ? background.card : text.muted }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span
                        className="text-sm block truncate"
                        style={{ color: isActive ? text.heading : text.body, fontWeight: isActive ? 600 : 400 }}
                      >
                        {section.label}
                      </span>
                      <span className="text-[10px] block truncate" style={{ color: text.muted }}>
                        {section.description}
                      </span>
                    </div>
                    {isActive ? (
                      <ChevronRight className="w-4 h-4 shrink-0" style={{ color: text.heading }} />
                    ) : !section.enabled ? (
                      <span
                        className="text-[9px] font-semibold uppercase rounded-full shrink-0"
                        style={{ backgroundColor: border.default, color: text.muted, padding: `2px ${spacing['1.5']}` }}
                      >
                        Soon
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          </nav>

          {/* ── Mobile tabs ── */}
          <div
            className="flex md:hidden overflow-x-auto shrink-0"
            style={{
              borderBottom: `1px solid ${border.default}`,
              backgroundColor: background.card,
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
                    backgroundColor: isActive ? accent.base : 'transparent',
                    color: isActive ? text.heading : text.muted,
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
            className="flex-1 overflow-y-auto flex flex-col"
            style={{ backgroundColor: background.page }}
          >
            {/* Content */}
            <div
              className="flex-1"
              style={{
                padding: `${spacing['8']} ${spacing['10']}`,
                display: 'flex',
                flexDirection: 'column',
                gap: spacing['5'],
                maxWidth: '720px',
              }}
            >
              {renderSection()}
            </div>

            {/* ── Footer — bottom of content area ── */}
            <div
              className="shrink-0 flex items-center justify-between"
              style={{
                padding: `${spacing['4']} ${spacing['10']}`,
                borderTop: `1px solid ${border.default}`,
                backgroundColor: background.card,
              }}
            >
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center text-xs font-medium transition-opacity hover:opacity-70 cursor-pointer"
                style={{ color: text.muted, gap: spacing['1.5'] }}
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
                  style={{ backgroundColor: text.heading, color: background.card }}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
