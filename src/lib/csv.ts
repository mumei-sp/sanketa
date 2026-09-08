/**
 * CSV utilities — powered by Papa Parse for robust parsing and generation.
 *
 * Same public API as before, so all existing call sites are unaffected.
 * Papa Parse handles edge cases: newlines inside quotes, BOM stripping,
 * CRLF/LF mixed line endings, malformed fields with proper error messages.
 */

import Papa from 'papaparse'

// ============================================================================
// Types
// ============================================================================

export interface CsvParseResult {
  headers: string[]
  rows: Record<string, string>[]
  errors: string[]
}

// ============================================================================
// Parse CSV
// ============================================================================

/** Parse a CSV string into headers + rows using Papa Parse */
export function parseCsv(text: string): CsvParseResult {
  const errors: string[] = []

  if (!text.trim()) {
    return { headers: [], rows: [], errors: ['File is empty'] }
  }

  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,       // keep everything as string — we validate types ourselves
    transformHeader: h => h.trim(),
    transform: v => v.trim(),
  })

  // Surface Papa Parse errors
  result.errors.forEach(e => {
    errors.push(`Row ${(e.row ?? 0) + 1}: ${e.message}`)
  })

  const headers = result.meta.fields ?? []

  if (headers.length === 0) {
    return { headers: [], rows: [], errors: ['No headers found in file'] }
  }

  return {
    headers,
    rows: result.data,
    errors,
  }
}

/** Read a File object as CSV — Papa Parse handles BOM + encoding automatically */
export function readFileAsCsv(file: File): Promise<CsvParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      transformHeader: h => h.trim(),
      transform: v => v.trim(),
      complete: result => {
        const errors: string[] = []
        result.errors.forEach(e => {
          errors.push(`Row ${(e.row ?? 0) + 1}: ${e.message}`)
        })
        resolve({
          headers: result.meta.fields ?? [],
          rows: result.data,
          errors,
        })
      },
      error: err => reject(new Error(err.message)),
    })
  })
}

// ============================================================================
// Generate CSV
// ============================================================================

/**
 * Convert an array of objects to a CSV string using Papa Parse's unparser.
 *
 * Unconstrained in `T` on purpose. It used to require
 * `Record<string, unknown>`, which no domain interface satisfies without an
 * index signature — so every one of the nine call sites reached for `as any`
 * to get past it, throwing away the column-key checking this signature exists
 * to provide. `keyof T` indexes any object type perfectly well.
 */
export function generateCsv<T>(
  data: T[],
  columns: { key: keyof T; header: string }[],
): string {
  const fields = columns.map(c => c.header)
  const rows = data.map(row =>
    columns.reduce<Record<string, string>>((acc, c) => {
      acc[c.header] = String(row[c.key] ?? '')
      return acc
    }, {}),
  )
  return Papa.unparse({ fields, data: rows })
}

// ============================================================================
// Download
// ============================================================================

/** Trigger a CSV file download in the browser (with UTF-8 BOM for Excel) */
export function downloadCsv(csvContent: string, filename: string): void {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// ============================================================================
// Template Generation
// ============================================================================

/** Generate a CSV template with headers and optional sample rows */
export function generateTemplate(
  headers: string[],
  sampleRows?: string[][],
): string {
  if (!sampleRows || sampleRows.length === 0) {
    return Papa.unparse({ fields: headers, data: [] })
  }
  const data = sampleRows.map(row =>
    headers.reduce<Record<string, string>>((acc, h, i) => {
      acc[h] = row[i] ?? ''
      return acc
    }, {}),
  )
  return Papa.unparse({ fields: headers, data })
}
