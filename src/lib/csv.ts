/**
 * CSV utilities — zero-dependency CSV parsing, generation, and export.
 *
 * Uses native browser APIs (FileReader, Blob, URL.createObjectURL).
 * CSV files are universally openable in Excel, Google Sheets, etc.
 */

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

/** Parse a CSV string into headers + rows */
export function parseCsv(text: string): CsvParseResult {
  const errors: string[] = []
  const lines = text.split(/\r?\n/).filter(line => line.trim() !== '')

  if (lines.length === 0) {
    return { headers: [], rows: [], errors: ['File is empty'] }
  }

  const headers = parseCsvLine(lines[0]).map(h => h.trim())

  if (headers.length === 0) {
    return { headers: [], rows: [], errors: ['No headers found'] }
  }

  const rows: Record<string, string>[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i])
    if (values.length !== headers.length) {
      errors.push(`Row ${i}: expected ${headers.length} columns, got ${values.length}`)
      continue
    }
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => { row[h] = values[idx]?.trim() ?? '' })
    rows.push(row)
  }

  return { headers, rows, errors }
}

/** Parse a single CSV line handling quoted fields */
function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}

/** Read a File object as CSV text */
export function readFileAsCsv(file: File): Promise<CsvParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const text = reader.result as string
      resolve(parseCsv(text))
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

// ============================================================================
// Generate CSV
// ============================================================================

/** Convert an array of objects to CSV string */
export function generateCsv<T extends Record<string, unknown>>(
  data: T[],
  columns: { key: keyof T; header: string }[],
): string {
  const headers = columns.map(c => escapeCsvField(c.header))
  const rows = data.map(row =>
    columns.map(c => escapeCsvField(String(row[c.key] ?? ''))),
  )
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
}

/** Escape a CSV field (quote if it contains commas, quotes, or newlines) */
function escapeCsvField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`
  }
  return field
}

// ============================================================================
// Download
// ============================================================================

/** Trigger a CSV file download in the browser */
export function downloadCsv(csvContent: string, filename: string): void {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' }) // BOM for Excel UTF-8
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
  const lines = [headers.join(',')]
  if (sampleRows) {
    sampleRows.forEach(row => {
      lines.push(row.map(escapeCsvField).join(','))
    })
  }
  return lines.join('\n')
}
