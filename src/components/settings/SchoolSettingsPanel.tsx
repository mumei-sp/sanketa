/**
 * SchoolSettingsPanel — Right-side Sheet for configuring school settings.
 *
 * Opens when the gear icon in the top bar is clicked.
 * Uses local draft state so Cancel discards edits.
 *
 * Extensible: add new sections by adding form fields and
 * extending SchoolConfig in school-config.ts.
 */

import * as React from 'react'
import { RotateCcw, Calendar, Building2 } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
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
  TERM_STRUCTURE_OPTIONS,
  type TermStructure,
} from '@/config/school-config'
import { getAcademicYear, getTerms } from '@/utils/academic-date'
import { MONTH_SHORT_LABELS } from '@/config/school-config'
import { colors } from '@/theme/colors'
import { spacing } from '@/config/spacing'

/**
 * SchoolSettingsPanel — self-contained settings sheet.
 * Reads open state from SchoolConfigContext, manages its own draft form state.
 */
export function SchoolSettingsPanel() {
  const { config, updateConfig, resetConfig, isSettingsOpen, setSettingsOpen } = useSchoolConfig()

  // Local draft state — initialized from config when panel opens
  const [draft, setDraft] = React.useState(config)

  // Sync draft when panel opens
  React.useEffect(() => {
    if (isSettingsOpen) {
      setDraft(config)
    }
  }, [isSettingsOpen, config])

  // Preview computed from draft
  const previewYear = React.useMemo(
    () => getAcademicYear(new Date(), draft.academicYearStartMonth),
    [draft.academicYearStartMonth],
  )
  const previewTerms = React.useMemo(
    () => getTerms(draft.academicYearStartMonth, draft.termStructure),
    [draft.academicYearStartMonth, draft.termStructure],
  )

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

  return (
    <Sheet open={isSettingsOpen} onOpenChange={setSettingsOpen}>
      <SheetContent
        side="right"
        size="md"
        className="flex flex-col"
        onInteractOutside={e => {
          // Prevent Sheet from closing when interacting with portaled Select dropdowns
          const target = e.target as HTMLElement
          if (target?.closest('[data-radix-popper-content-wrapper]') || target?.closest('[role="listbox"]')) {
            e.preventDefault()
          }
        }}
      >
        <SheetHeader>
          <SheetTitle
            className="text-lg font-bold"
            style={{ color: colors.text.heading }}
          >
            School Settings
          </SheetTitle>
          <SheetDescription className="text-text-muted">
            Configure your school's academic calendar and general settings.
          </SheetDescription>
        </SheetHeader>

        {/* Scrollable body */}
        <div
          className="flex-1 overflow-y-auto -mx-6 px-6"
          style={{ display: 'flex', flexDirection: 'column', gap: spacing['6'] }}
        >
          {/* ═══ SECTION: General ═══ */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4" style={{ color: colors.text.heading }} />
              <h3 className="text-sm font-semibold" style={{ color: colors.text.heading }}>
                General
              </h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="school-name" className="text-xs text-text-muted">
                School Name
              </Label>
              <Input
                id="school-name"
                value={draft.schoolName}
                onChange={e => setDraft(prev => ({ ...prev, schoolName: e.target.value }))}
                className="text-sm"
              />
            </div>
          </div>

          <Separator />

          {/* ═══ SECTION: Academic Calendar ═══ */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4" style={{ color: colors.text.heading }} />
              <h3 className="text-sm font-semibold" style={{ color: colors.text.heading }}>
                Academic Calendar
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['4'] }}>
              {/* Start Month */}
              <div className="space-y-2">
                <Label className="text-xs text-text-muted">Academic Year Start Month</Label>
                <Select
                  value={String(draft.academicYearStartMonth)}
                  onValueChange={v => setDraft(prev => ({ ...prev, academicYearStartMonth: parseInt(v) }))}
                >
                  <SelectTrigger className="w-full text-sm">
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
              </div>

              {/* Term Structure */}
              <div className="space-y-2">
                <Label className="text-xs text-text-muted">Term Structure</Label>
                <RadioGroup
                  value={draft.termStructure}
                  onValueChange={v => setDraft(prev => ({ ...prev, termStructure: v as TermStructure }))}
                  className="space-y-2"
                >
                  {TERM_STRUCTURE_OPTIONS.map(opt => (
                    <div key={opt.value} className="flex items-center gap-2.5">
                      <RadioGroupItem value={opt.value} id={`term-${opt.value}`} />
                      <Label htmlFor={`term-${opt.value}`} className="text-sm cursor-pointer">
                        <span style={{ color: colors.text.heading }}>{opt.label}</span>
                        <span className="text-xs ml-1.5" style={{ color: colors.text.muted }}>
                          — {opt.description}
                        </span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Preview */}
              <div
                className="rounded-lg border"
                style={{
                  backgroundColor: colors.accent.soft,
                  borderColor: colors.border.subtle,
                  padding: spacing['3'],
                }}
              >
                <p className="text-xs font-semibold mb-2" style={{ color: colors.text.heading }}>
                  Preview
                </p>
                <p className="text-xs" style={{ color: colors.text.body }}>
                  <span className="font-medium">Academic Year:</span>{' '}
                  {MONTH_LABELS[draft.academicYearStartMonth]} {previewYear.startYear} –{' '}
                  {MONTH_LABELS[(draft.academicYearStartMonth + 11) % 12]} {previewYear.endYear}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {previewTerms.map(term => (
                    <span
                      key={term.term}
                      className="inline-flex items-center text-[10px] font-medium rounded-md px-2 py-0.5"
                      style={{
                        backgroundColor: colors.accent.base,
                        color: colors.text.heading,
                      }}
                    >
                      {term.label}: {MONTH_SHORT_LABELS[term.startMonth]} – {MONTH_SHORT_LABELS[term.endMonth]}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <SheetFooter className="flex-row items-center justify-between sm:justify-between border-t pt-4">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-70 cursor-pointer"
            style={{ color: colors.text.muted }}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to defaults
          </button>
          <div className="flex items-center gap-2">
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
              Save
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
