/**
 * ImportDialog — Reusable CSV import wizard dialog.
 *
 * 3-step flow: Upload → Preview & Validate → Confirm
 * Zero dependencies — uses native FileReader + custom CSV parser.
 */

import * as React from 'react'
import { Upload, FileText, AlertTriangle, CheckCircle, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
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
  /** Validation function */
  validate?: (value: string) => string | null
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
        if (col.required && !row[col.csvHeader]?.trim()) {
          errors.push(`Row ${idx + 1}: "${col.csvHeader}" is required`)
        }
        if (col.validate && row[col.csvHeader]) {
          const err = col.validate(row[col.csvHeader])
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
    <Dialog open={open} onOpenChange={isImporting ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle style={{ color: text.heading }}>{title}</DialogTitle>
        </DialogHeader>

        {/* ═══ UPLOAD STEP ═══ */}
        {step === 'upload' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['4'] }}>
            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-3 rounded-xl cursor-pointer transition-all"
              style={{
                padding: spacing['8'],
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
          </div>
        )}

        {/* ═══ PREVIEW STEP ═══ */}
        {step === 'preview' && parseResult && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['4'] }}>
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
                  maxHeight: '120px',
                  overflowY: 'auto',
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

            {/* Preview table */}
            <div style={{ maxHeight: '240px', overflowY: 'auto', overflowX: 'auto', borderRadius: '8px', border: `1px solid ${border.default}` }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '6px 10px', backgroundColor: accent.base, color: text.heading, fontWeight: 600, textAlign: 'left', position: 'sticky', top: 0 }}>
                      #
                    </th>
                    {parseResult.headers.map(h => (
                      <th key={h} style={{ padding: '6px 10px', backgroundColor: accent.base, color: text.heading, fontWeight: 600, textAlign: 'left', whiteSpace: 'nowrap', position: 'sticky', top: 0 }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parseResult.rows.slice(0, 20).map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: `1px solid ${border.subtle}` }}>
                      <td style={{ padding: '4px 10px', color: text.muted }}>{idx + 1}</td>
                      {parseResult.headers.map(h => (
                        <td key={h} style={{ padding: '4px 10px', color: text.body, whiteSpace: 'nowrap', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
          </div>
        )}

        {/* ═══ DONE STEP ═══ */}
        {step === 'done' && (
          <div className="flex flex-col items-center gap-3" style={{ padding: spacing['6'] }}>
            <div
              className="rounded-full flex items-center justify-center"
              style={{ width: '48px', height: '48px', backgroundColor: statusColors.success.base }}
            >
              <CheckCircle className="w-6 h-6" style={{ color: '#fff' }} />
            </div>
            <p style={{ fontSize: '16px', fontWeight: 600, color: text.heading }}>Import Complete</p>
            <p style={{ fontSize: '13px', color: text.muted }}>
              {importedCount} records imported successfully.
            </p>
          </div>
        )}

        {/* ═══ FOOTER ═══ */}
        <DialogFooter className="flex-row items-center justify-end gap-2 mt-2">
          {step === 'upload' && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          )}
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('upload')}>Back</Button>
              <Button
                onClick={handleImport}
                disabled={isImporting || (hasErrors && validationErrors.some(e => e.includes('required') || e.includes('Missing')))}
                className="gap-1.5"
                style={{ backgroundColor: text.heading, color: background.card }}
              >
                <Upload className="w-3.5 h-3.5" />
                {isImporting ? 'Importing...' : `Import ${parseResult?.rows.length ?? 0} Records`}
              </Button>
            </>
          )}
          {step === 'done' && (
            <Button onClick={() => onOpenChange(false)} style={{ backgroundColor: text.heading, color: background.card }}>
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
