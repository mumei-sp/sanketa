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
  Clock,
  Upload,
  Trash2,
  Plus,
  ImageIcon,
  GraduationCap,
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
import { text, border, accent, background, status, primary } from '@/theme/colors'
import { spacing } from '@/config/spacing'
import { fontSizes } from '@/config/typography'
import { TimetableSettingsSection } from './TimetableSettingsSection'
import { GradingSettingsSection } from './GradingSettingsSection'
import { AppearanceSettingsSection } from './AppearanceSettingsSection'
import type { Subject } from '@/config/school-config'
import type { ClassSection } from '@/config/school-config'

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
  { id: 'timetable', label: 'Timetable', description: 'Periods, days & subjects', icon: Clock, enabled: true },
  { id: 'grades', label: 'Grades', description: 'Grade scale & report cards', icon: GraduationCap, enabled: true },
  { id: 'notifications', label: 'Notifications', description: 'Alerts & reminders', icon: Bell, enabled: false },
  { id: 'appearance', label: 'Appearance', description: 'Theme & layout', icon: Palette, enabled: true },
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
                <p className="text-xs font-medium" style={{ color: status.danger.base }}>
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

      {/* Subjects Management */}
      <SubjectsCard draft={draft} setDraft={setDraft} />

      {/* Class Sections Management */}
      <ClassSectionsCard draft={draft} setDraft={setDraft} />
    </>
  )
}

// ============================================================================
// General: Subjects Management (editable)
// ============================================================================

function SubjectsCard({ draft, setDraft }: SectionProps) {
  const [newName, setNewName] = React.useState('')
  const [newShort, setNewShort] = React.useState('')

  const subjects = draft.subjects

  const addSubject = () => {
    if (!newName.trim() || !newShort.trim()) return
    const id = newName.toLowerCase().replace(/\s+/g, '-')
    if (subjects.some(s => s.id === id)) return
    const colorOptions = [accent.base, primary.base, accent.soft, primary.soft, accent.muted]
    const color = colorOptions[subjects.length % colorOptions.length]
    const newSubject: Subject = { id, name: newName.trim(), shortName: newShort.trim(), color }
    setDraft(prev => ({ ...prev, subjects: [...prev.subjects, newSubject] }))
    setNewName('')
    setNewShort('')
  }

  const removeSubject = (id: string) => {
    setDraft(prev => ({ ...prev, subjects: prev.subjects.filter(s => s.id !== id) }))
  }

  return (
    <div
      className="rounded-xl shadow-sm"
      style={{
        backgroundColor: background.card,
        padding: spacing['6'],
        border: `1px solid ${border.default}`,
      }}
    >
      <FieldGroup label="Subjects" hint="Subjects available for timetable assignment. Add, edit, or remove as needed.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['2'] }}>
          {subjects.map(subject => (
            <div
              key={subject.id}
              className="flex items-center gap-3 rounded-lg"
              style={{
                backgroundColor: border.subtle,
                padding: `${spacing['2']} ${spacing['3']}`,
              }}
            >
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: subject.color }}
              />
              <span className="text-sm font-medium flex-1" style={{ color: text.heading }}>
                {subject.name}
              </span>
              <span
                className="text-[10px] font-medium rounded px-2 py-0.5"
                style={{ backgroundColor: background.card, color: text.muted }}
              >
                {subject.shortName}
              </span>
              {/* Delete — matches project pattern: w-7 h-7, accent.soft bg, danger.soft on hover */}
              <button
                type="button"
                onClick={() => removeSubject(subject.id)}
                className="w-7 h-7 rounded-md flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
                style={{ backgroundColor: accent.soft }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = status.danger.soft }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = accent.soft }}
              >
                <Trash2 className="w-3.5 h-3.5" style={{ color: text.heading }} />
              </button>
            </div>
          ))}

          {/* Add new subject row */}
          <div className="flex items-center gap-2 mt-2">
            <Input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Subject name"
              className="text-sm h-9 flex-1"
              style={{ maxWidth: '200px' }}
            />
            <Input
              value={newShort}
              onChange={e => setNewShort(e.target.value)}
              placeholder="Short"
              className="text-sm h-9"
              style={{ maxWidth: '80px' }}
            />
            {/* Add — matches project pattern: same h-9 as inputs, outline style */}
            <Button
              variant="outline"
              size="default"
              onClick={addSubject}
              disabled={!newName.trim() || !newShort.trim()}
              className="h-9"
            >
              <Plus className="w-4 h-4" />
              Add
            </Button>
          </div>
        </div>
      </FieldGroup>
    </div>
  )
}

// ============================================================================
// General: Class Sections Management (editable)
// ============================================================================

function ClassSectionsCard({ draft, setDraft }: SectionProps) {
  const [newGrade, setNewGrade] = React.useState('')
  const [newSection, setNewSection] = React.useState('')

  const sections = draft.classSections

  // Group by grade
  const grouped = React.useMemo(() => {
    const map = new Map<string, ClassSection[]>()
    sections.forEach(s => {
      const list = map.get(s.grade) ?? []
      list.push(s)
      map.set(s.grade, list)
    })
    return Array.from(map.entries()).sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
  }, [sections])

  const addSection = () => {
    if (!newGrade.trim() || !newSection.trim()) return
    const grade = newGrade.trim()
    const section = newSection.toUpperCase().trim()
    const label = `${grade}${section}`
    const id = `cls-${grade}${section.toLowerCase()}`
    if (sections.some(s => s.id === id)) return
    const newItem: ClassSection = { id, grade, section, label }
    setDraft(prev => ({ ...prev, classSections: [...prev.classSections, newItem] }))
    setNewGrade('')
    setNewSection('')
  }

  const removeSection = (id: string) => {
    setDraft(prev => ({ ...prev, classSections: prev.classSections.filter(s => s.id !== id) }))
  }

  return (
    <div
      className="rounded-xl shadow-sm"
      style={{
        backgroundColor: background.card,
        padding: spacing['6'],
        border: `1px solid ${border.default}`,
      }}
    >
      <FieldGroup label="Class Sections" hint="Define grades and sections. Each section gets its own timetable.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['3'] }}>
          {grouped.map(([grade, grpSections]) => (
            <div
              key={grade}
              className="rounded-lg"
              style={{
                backgroundColor: border.subtle,
                padding: `${spacing['2.5']} ${spacing['3']}`,
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold" style={{ color: text.heading }}>
                  Grade {grade}
                </span>
                <span className="text-[10px]" style={{ color: text.muted }}>
                  {grpSections.length} section{grpSections.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {grpSections.map(section => (
                  <span
                    key={section.id}
                    className="inline-flex items-center gap-1.5 text-xs font-medium rounded-md px-2.5 py-1.5"
                    style={{ backgroundColor: accent.base, color: text.heading }}
                  >
                    {section.label}
                    <button
                      type="button"
                      onClick={() => removeSection(section.id)}
                      className="w-4 h-4 rounded-sm flex items-center justify-center transition-colors cursor-pointer"
                      style={{ backgroundColor: 'transparent' }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = status.danger.soft }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
                    >
                      <Trash2 className="w-3 h-3" style={{ color: text.heading }} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ))}

          {/* Add new section row */}
          <div className="flex items-center gap-2 mt-2">
            <Input
              value={newGrade}
              onChange={e => setNewGrade(e.target.value)}
              placeholder="Grade (e.g. 11)"
              className="text-sm h-9"
              style={{ maxWidth: '120px' }}
            />
            <Input
              value={newSection}
              onChange={e => setNewSection(e.target.value)}
              placeholder="Section (e.g. A)"
              className="text-sm h-9"
              style={{ maxWidth: '120px' }}
            />
            <Button
              variant="outline"
              size="default"
              onClick={addSection}
              disabled={!newGrade.trim() || !newSection.trim()}
              className="h-9"
            >
              <Plus className="w-4 h-4" />
              Add
            </Button>
          </div>
        </div>
      </FieldGroup>
    </div>
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
    } else {
      // On close, drop any in-progress draft so live-preview effects
      // (e.g. AppearanceSection) revert to the saved config.
      setDraft(config)
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
      case 'timetable': return <TimetableSettingsSection draft={draft} setDraft={setDraft} />
      case 'grades': return <GradingSettingsSection draft={draft} setDraft={setDraft} />
      case 'appearance': return <AppearanceSettingsSection draft={draft} setDraft={setDraft} />
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
                      className="rounded-full animate-pulse"
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
                      className="absolute -top-1 -right-1 rounded-full animate-pulse"
                      style={{
                        width: '8px',
                        height: '8px',
                        backgroundColor: status.danger.base,
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
