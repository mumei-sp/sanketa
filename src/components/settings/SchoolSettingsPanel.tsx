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
  Upload,
  Trash2,
  ImageIcon,
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
  LOGO_MAX_SIZE_BYTES,
  LOGO_MAX_SIZE_LABEL,
  LOGO_ACCEPTED_TYPES,
  LOGO_ACCEPTED_EXTENSIONS,
  LOGO_RECOMMENDED_SIZE,
  type TermStructure,
  type SchoolConfig,
} from '@/config/school-config'
import { getAcademicYear, getTerms } from '@/utils/academic-date'
import { useAppToast } from '@/hooks/use-app-toast'
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
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [logoError, setLogoError] = React.useState<string | null>(null)

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLogoError(null)
    const file = e.target.files?.[0]
    if (!file) return

    // Validate type
    if (!LOGO_ACCEPTED_TYPES.includes(file.type)) {
      setLogoError('Invalid file type. Use PNG, JPG, SVG, or WebP.')
      return
    }

    // Validate size
    if (file.size > LOGO_MAX_SIZE_BYTES) {
      setLogoError(`File too large. Maximum size is ${LOGO_MAX_SIZE_LABEL}.`)
      return
    }

    // Read as data URL
    const reader = new FileReader()
    reader.onload = () => {
      setDraft(prev => ({ ...prev, schoolLogo: reader.result as string }))
    }
    reader.onerror = () => {
      setLogoError('Failed to read file. Please try again.')
    }
    reader.readAsDataURL(file)

    // Reset input so the same file can be re-selected
    e.target.value = ''
  }

  const handleRemoveLogo = () => {
    setDraft(prev => ({ ...prev, schoolLogo: null }))
    setLogoError(null)
  }

  return (
    <>
      <SectionHeading title="General Settings" description="Basic information about your school." />

      {/* School Logo */}
      <div
        className="rounded-xl shadow-sm"
        style={{
          backgroundColor: background.card,
          padding: spacing['6'],
          border: `1px solid ${border.default}`,
        }}
      >
        <FieldGroup label="School Logo" hint={`Recommended: ${LOGO_RECOMMENDED_SIZE}. Max ${LOGO_MAX_SIZE_LABEL}. Accepts PNG, JPG, SVG, WebP.`}>
          <div className="flex items-center" style={{ gap: spacing['4'] }}>
            {/* Logo preview */}
            <div
              className="rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
              style={{
                width: '72px',
                height: '72px',
                backgroundColor: draft.schoolLogo ? 'transparent' : accent.soft,
                border: `2px dashed ${draft.schoolLogo ? 'transparent' : border.default}`,
              }}
            >
              {draft.schoolLogo ? (
                <img
                  src={draft.schoolLogo}
                  alt="School logo"
                  className="w-full h-full object-contain"
                />
              ) : (
                <ImageIcon style={{ width: '28px', height: '28px', color: text.muted }} />
              )}
            </div>

            {/* Upload / Remove buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['2'] }}>
              <div className="flex items-center" style={{ gap: spacing['2'] }}>
                <Button
                  variant="outline"
                  className="text-xs"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ gap: spacing['1.5'] }}
                >
                  <Upload style={{ width: '14px', height: '14px' }} />
                  {draft.schoolLogo ? 'Change Logo' : 'Upload Logo'}
                </Button>
                {draft.schoolLogo && (
                  <Button
                    variant="outline"
                    className="text-xs"
                    onClick={handleRemoveLogo}
                    style={{ gap: spacing['1.5'], color: text.muted }}
                  >
                    <Trash2 style={{ width: '14px', height: '14px' }} />
                    Remove
                  </Button>
                )}
              </div>
              {logoError && (
                <p className="text-xs font-medium" style={{ color: '#D64445' }}>
                  {logoError}
                </p>
              )}
            </div>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept={LOGO_ACCEPTED_EXTENSIONS}
            onChange={handleLogoUpload}
            className="hidden"
          />
        </FieldGroup>
      </div>

      {/* School Name */}
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
  const { showSuccess, showInfo } = useAppToast()

  const [activeSection, setActiveSection] = React.useState('general')
  const [draft, setDraft] = React.useState(config)

  // Detect unsaved changes
  const hasChanges = React.useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(config),
    [draft, config],
  )

  React.useEffect(() => {
    if (isSettingsOpen) {
      setDraft(config)
      setActiveSection('general')
    }
  }, [isSettingsOpen, config])

  const handleSave = () => {
    if (!hasChanges) {
      showInfo('No changes to save')
      return
    }
    updateConfig(draft)
    setSettingsOpen(false)
    showSuccess('Settings saved', { description: 'Your school configuration has been updated.' })
  }
  const handleCancel = () => { setSettingsOpen(false) }
  const handleReset = () => {
    resetConfig()
    setSettingsOpen(false)
    showSuccess('Settings reset', { description: 'All settings have been restored to defaults.' })
  }

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
        style={{ width: 'calc(100vw - 16rem)', maxWidth: '900px' }}
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
              width: '220px',
              backgroundColor: background.card,
              borderRight: `1px solid ${border.default}`,
              padding: spacing['4'],
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['1'] }}>
              {/* Title with logo preview */}
              <div className="flex items-center" style={{ padding: `${spacing['2']} ${spacing['3']}`, marginBottom: spacing['2'], gap: spacing['2.5'] }}>
                {draft.schoolLogo ? (
                  <img
                    src={draft.schoolLogo}
                    alt=""
                    className="shrink-0 rounded-lg object-contain"
                    style={{ width: '32px', height: '32px' }}
                  />
                ) : (
                  <div
                    className="shrink-0 rounded-lg flex items-center justify-center"
                    style={{
                      width: '32px',
                      height: '32px',
                      backgroundColor: accent.soft,
                      border: `1px solid ${border.default}`,
                    }}
                  >
                    <Building2 style={{ width: '16px', height: '16px', color: text.muted }} />
                  </div>
                )}
                <div>
                  <h2 className="text-lg font-bold" style={{ color: text.heading }}>
                    Settings
                  </h2>
                  <p className="text-xs" style={{ color: text.muted, marginTop: spacing['0.5'] }}>
                    {draft.schoolName || 'School configuration'}
                  </p>
                </div>
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
                    className="flex items-center rounded-lg text-left transition-all"
                    style={{
                      padding: `${spacing['2.5']} ${spacing['3']}`,
                      gap: spacing['2.5'],
                      backgroundColor: isActive ? accent.base : 'transparent',
                      opacity: section.enabled ? 1 : 0.45,
                      cursor: section.enabled ? 'pointer' : 'not-allowed',
                    }}
                  >
                    <Icon
                      className="shrink-0"
                      style={{
                        width: '18px',
                        height: '18px',
                        color: isActive ? text.heading : text.muted,
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <span
                        className="text-sm block truncate"
                        style={{ color: isActive ? text.heading : text.body, fontWeight: isActive ? 600 : 400 }}
                      >
                        {section.label}
                      </span>
                    </div>
                    {!section.enabled && (
                      <span
                        className="text-[9px] font-medium rounded-full shrink-0"
                        style={{ backgroundColor: border.default, color: text.muted, padding: `2px ${spacing['1.5']}` }}
                      >
                        Soon
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Reset to defaults — pinned to bottom like Logout in main sidebar */}
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center rounded-lg text-left transition-opacity hover:opacity-70 cursor-pointer"
              style={{
                padding: `${spacing['2.5']} ${spacing['3']}`,
                gap: spacing['2.5'],
                color: text.muted,
                marginTop: spacing['2'],
                borderTop: `1px solid ${border.default}`,
                paddingTop: spacing['4'],
              }}
            >
              <RotateCcw style={{ width: '18px', height: '18px' }} />
              <span className="text-sm">Reset to defaults</span>
            </button>
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
              }}
            >
              {/* Unsaved changes indicator */}
              <div>
                {hasChanges && (
                  <div className="flex items-center" style={{ gap: spacing['2'] }}>
                    <div
                      className="rounded-full"
                      style={{ width: '6px', height: '6px', backgroundColor: accent.base }}
                    />
                    <span className="text-xs font-medium" style={{ color: text.muted }}>
                      You have unsaved changes
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center" style={{ gap: spacing['2'] }}>
                <Button variant="outline" onClick={handleCancel} className="text-sm">
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  className="text-sm relative"
                  style={{
                    backgroundColor: hasChanges ? text.heading : border.default,
                    color: background.card,
                  }}
                >
                  Save Changes
                  {hasChanges && (
                    <span
                      className="absolute -top-1 -right-1 rounded-full"
                      style={{
                        width: '8px',
                        height: '8px',
                        backgroundColor: '#D64445',
                        border: `2px solid ${background.card}`,
                      }}
                    />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
