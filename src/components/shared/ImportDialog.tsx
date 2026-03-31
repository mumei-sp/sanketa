/**
 * ImportDialog — Reusable CSV import wizard, rendered as a slide-in Sheet.
 *
 * 3-step flow: Upload → Preview & Validate → Confirm
 */

import * as React from 'react'
import { Upload, FileText, AlertTriangle, CheckCircle } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { text, border, accent, background, status as statusColors } from '@/theme/colors'
import { spacing } from '@/config/spacing'
import { readFileAsCsv, downloadCsv, generateTemplate } from '@/lib/csv'
import type { CsvParseResult } from '@/lib/csv'

// ============================================================================
// Types
// ============================================================================

export interface ImportColumn {
  /** CSV header name */
  csvHeader: string
  /** Target field key */
  fieldKey: string
  /** Display label */
  label: string
  /** Whether the field is required */
  required?: boolean
  /**
   * Built-in type validator — runs after required check, before custom validate.
   * - email   → must match RFC-5322 simple pattern
   * - phone   → 7–15 digits, optional leading +
   * - date    → YYYY-MM-DD | DD/MM/YYYY | MM/DD/YYYY
   * - number  → must be numeric
   * - enum    → must be one of enumValues (case-insensitive)
   */
  type?: 'email' | 'phone' | 'date' | 'number' | 'enum'
  /** Required when type is 'enum' — list of allowed values */
  enumValues?: string[]
  /** Custom validation function (runs last) */
  validate?: (value: string) => string | null
}

// ============================================================================
// Built-in type validators
// ============================================================================

const TYPE_VALIDATORS: Record<
  NonNullable<ImportColumn['type']>,
  (value: string, col: ImportColumn) => string | null
> = {
  email: v =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
      ? null
      : 'must be a valid email address',
  phone: v =>
    /^\+?\d{7,15}$/.test(v.replace(/[\s\-().]/g, ''))
      ? null
      : 'must be a valid phone number (7–15 digits)',
  date: v =>
    /^\d{4}-\d{2}-\d{2}$/.test(v) ||
    /^\d{2}\/\d{2}\/\d{4}$/.test(v) ||
    /^\d{2}-\d{2}-\d{4}$/.test(v)
      ? null
      : 'must be a valid date (YYYY-MM-DD or DD/MM/YYYY)',
  number: v =>
    !isNaN(Number(v)) && v.trim() !== '' ? null : 'must be a number',
  enum: (v, col) => {
    const allowed = col.enumValues ?? []
    return allowed.some(a => a.toLowerCase() === v.toLowerCase())
      ? null
      : `must be one of: ${allowed.join(', ')}`
  },
}

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Title for the dialog (e.g., "Import Students") */
  title: string
  /** Column mapping configuration */
  columns: ImportColumn[]
  /** Template sample rows for download */
  templateSampleRows?: string[][]
  /** Called with validated rows on import */
  onImport: (rows: Record<string, string>[]) => Promise<void>
}

type Step = 'upload' | 'preview' | 'done'

// ============================================================================
// Component
// ============================================================================

export function ImportDialog({ open, onOpenChange, title, columns, templateSampleRows, onImport }: ImportDialogProps) {
  const [step, setStep] = React.useState<Step>('upload')
  const [parseResult, setParseResult] = React.useState<CsvParseResult | null>(null)
  const [validationErrors, setValidationErrors] = React.useState<string[]>([])
  const [importedCount, setImportedCount] = React.useState(0)
  const [isImporting, setIsImporting] = React.useState(false)
  const [isDragging, setIsDragging] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Reset on open
  React.useEffect(() => {
    if (open) {
      setStep('upload')
      setParseResult(null)
      setValidationErrors([])
      setImportedCount(0)
    }
  }, [open])

  // Download template
  const handleDownloadTemplate = React.useCallback(() => {
    const headers = columns.map(c => c.csvHeader)
    const template = generateTemplate(headers, templateSampleRows)
    downloadCsv(template, `${title.toLowerCase().replace(/\s+/g, '-')}-template.csv`)
  }, [columns, templateSampleRows, title])

  // Handle file selection
  const handleFile = React.useCallback(async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setValidationErrors(['Please upload a .csv file'])
      return
    }

    const result = await readFileAsCsv(file)
    setParseResult(result)

    // Validate columns
    const errors = [...result.errors]
    const requiredCols = columns.filter(c => c.required)
    requiredCols.forEach(col => {
      if (!result.headers.includes(col.csvHeader)) {
        errors.push(`Missing required column: "${col.csvHeader}"`)
      }
    })

    // Validate rows
    result.rows.forEach((row, idx) => {
      columns.forEach(col => {
        const value = row[col.csvHeader]?.trim() ?? ''

        // 1. Required check
        if (col.required && !value) {
          errors.push(`Row ${idx + 1}: "${col.label}" is required`)
          return
        }

        // 2. Built-in type validation (only when value is present)
        if (col.type && value) {
          const typeErr = TYPE_VALIDATORS[col.type](value, col)
          if (typeErr) {
            errors.push(`Row ${idx + 1}: "${col.label}" ${typeErr}`)
            return
          }
        }

        // 3. Custom validation (runs last)
        if (col.validate && value) {
          const err = col.validate(value)
          if (err) errors.push(`Row ${idx + 1}: ${err}`)
        }
      })
    })

    setValidationErrors(errors)
    setStep('preview')
  }, [columns])

  const handleFileInput = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleDrop = React.useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  // Import
  const handleImport = React.useCallback(async () => {
    if (!parseResult) return
    setIsImporting(true)
    try {
      await onImport(parseResult.rows)
      setImportedCount(parseResult.rows.length)
      setStep('done')
    } catch (err) {
      console.error('Import failed:', err)
    } finally {
      setIsImporting(false)
    }
  }, [parseResult, onImport])

  const hasErrors = validationErrors.length > 0

  return (
    <Sheet open={open} onOpenChange={isImporting ? undefined : onOpenChange}>
      <SheetContent
        side="right"
        className="flex flex-col p-0"
        style={{ width: '560px', maxWidth: '100vw' }}
      >
        {/* ── Header ── */}
        <SheetHeader
          style={{
            padding: `${spacing['5']} ${spacing['6']}`,
            borderBottom: `1px solid ${border.subtle}`,
            flexShrink: 0,
          }}
        >
          <SheetTitle style={{ color: text.heading }}>{title}</SheetTitle>
        </SheetHeader>

        {/* ── Scrollable body ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: `${spacing['5']} ${spacing['6']}`, display: 'flex', flexDirection: 'column', gap: spacing['5'] }}>

          {/* ═══ UPLOAD STEP ═══ */}
          {step === 'upload' && (
            <>
              {/* Drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-3 rounded-xl cursor-pointer transition-all"
                style={{
                  padding: spacing['10'],
                  border: `2px dashed ${isDragging ? text.heading : border.default}`,
                  backgroundColor: isDragging ? accent.base : 'transparent',
                }}
              >
                <Upload className="w-8 h-8" style={{ color: isDragging ? text.heading : border.default }} />
                <div className="text-center">
                  <p style={{ fontSize: '14px', fontWeight: 500, color: text.heading }}>
                    Drop CSV file here or click to browse
                  </p>
                  <p style={{ fontSize: '11px', color: text.muted, marginTop: '4px' }}>
                    Only .csv files are supported
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </div>

              {/* Template download */}
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="flex items-center justify-center gap-2 text-xs font-medium cursor-pointer transition-opacity hover:opacity-70"
                style={{ color: text.heading, textDecoration: 'underline', textUnderlineOffset: '3px' }}
              >
                <FileText className="w-3.5 h-3.5" />
                Download CSV template
              </button>

              {/* Column hints */}
              <div style={{ borderRadius: 8, border: `1px solid ${border.subtle}`, overflow: 'hidden' }}>
                <p style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 600, color: text.heading, backgroundColor: accent.base }}>
                  Expected columns
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '10px 12px' }}>
                  {columns.map(col => (
                    <span
                      key={col.csvHeader}
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: 4,
                        backgroundColor: col.required ? accent.base : background.surface,
                        color: text.heading,
                        border: `1px solid ${border.subtle}`,
                      }}
                    >
                      {col.csvHeader}{col.required ? ' *' : ''}
                    </span>
                  ))}
                </div>
                <p style={{ padding: '0 12px 8px', fontSize: '10px', color: text.muted }}>* Required</p>
              </div>
            </>
          )}

          {/* ═══ PREVIEW STEP ═══ */}
          {step === 'preview' && parseResult && (
            <>
              {/* Stats */}
              <div className="flex items-center gap-4">
                <span style={{ fontSize: '13px', color: text.heading }}>
                  <strong>{parseResult.rows.length}</strong> rows found
                </span>
                <span style={{ fontSize: '13px', color: text.heading }}>
                  <strong>{parseResult.headers.length}</strong> columns
                </span>
                {hasErrors && (
                  <span style={{ fontSize: '13px', color: statusColors.danger.text }}>
                    <strong>{validationErrors.length}</strong> issues
                  </span>
                )}
              </div>

              {/* Errors */}
              {hasErrors && (
                <div
                  className="rounded-lg"
                  style={{
                    padding: spacing['3'],
                    backgroundColor: statusColors.danger.soft,
                    border: `1px solid ${statusColors.danger.base}`,
                    maxHeight: '140px',
                    overflowY: 'auto',
                    flexShrink: 0,
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" style={{ color: statusColors.danger.text }} />
                    <span style={{ fontSize: '11px', fontWeight: 600, color: statusColors.danger.text }}>Validation Issues</span>
                  </div>
                  {validationErrors.slice(0, 10).map((err, i) => (
                    <p key={i} style={{ fontSize: '11px', color: text.muted, lineHeight: 1.5 }}>• {err}</p>
                  ))}
                  {validationErrors.length > 10 && (
                    <p style={{ fontSize: '11px', color: text.muted }}>...and {validationErrors.length - 10} more</p>
                  )}
                </div>
              )}

              {/* Preview table — takes remaining space, scrolls inside */}
              <div style={{ borderRadius: '8px', border: `1px solid ${border.default}`, overflow: 'auto', flex: 1, minHeight: 0 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '7px 10px', backgroundColor: accent.base, color: text.heading, fontWeight: 600, textAlign: 'left', position: 'sticky', top: 0, zIndex: 1, whiteSpace: 'nowrap' }}>
                        #
                      </th>
                      {parseResult.headers.map(h => (
                        <th key={h} style={{ padding: '7px 10px', backgroundColor: accent.base, color: text.heading, fontWeight: 600, textAlign: 'left', whiteSpace: 'nowrap', position: 'sticky', top: 0, zIndex: 1 }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parseResult.rows.slice(0, 20).map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: `1px solid ${border.subtle}` }}>
                        <td style={{ padding: '5px 10px', color: text.muted }}>{idx + 1}</td>
                        {parseResult.headers.map(h => (
                          <td key={h} style={{ padding: '5px 10px', color: text.body, whiteSpace: 'nowrap', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {row[h] || '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parseResult.rows.length > 20 && (
                  <p style={{ padding: '8px 10px', fontSize: '11px', color: text.muted, textAlign: 'center' }}>
                    Showing first 20 of {parseResult.rows.length} rows
                  </p>
                )}
              </div>
            </>
          )}

          {/* ═══ DONE STEP ═══ */}
          {step === 'done' && (
            <div className="flex flex-col items-center justify-center gap-3" style={{ flex: 1, padding: spacing['8'] }}>
              <div
                className="rounded-full flex items-center justify-center"
                style={{ width: '56px', height: '56px', backgroundColor: statusColors.success.base }}
              >
                <CheckCircle className="w-7 h-7" style={{ color: '#fff' }} />
              </div>
              <p style={{ fontSize: '16px', fontWeight: 600, color: text.heading }}>Import Complete</p>
              <p style={{ fontSize: '13px', color: text.muted }}>
                {importedCount} records imported successfully.
              </p>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <SheetFooter
          className="flex-row items-center justify-end"
          style={{
            padding: `${spacing['3']} ${spacing['6']}`,
            borderTop: `1px solid ${border.subtle}`,
            flexShrink: 0,
            gap: spacing['2'],
          }}
        >
          {step === 'upload' && (
            <Button size="sm" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          )}
          {step === 'preview' && (
            <>
              <Button size="sm" variant="outline" onClick={() => setStep('upload')}>Back</Button>
              <Button
                size="sm"
                onClick={handleImport}
                disabled={isImporting || (hasErrors && validationErrors.some(e => e.includes('required') || e.includes('Missing')))}
                className="gap-1.5"
                style={{ backgroundColor: text.heading, color: background.card }}
              >
                <Upload className="w-3 h-3" />
                {isImporting ? 'Importing...' : `Import ${parseResult?.rows.length ?? 0} Records`}
              </Button>
            </>
          )}
          {step === 'done' && (
            <Button size="sm" onClick={() => onOpenChange(false)} style={{ backgroundColor: text.heading, color: background.card }}>
              Done
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
