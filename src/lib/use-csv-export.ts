/**
 * CSV export for a list, in one hook.
 *
 * Nine lists had grown their own copy of the same six lines — build the rows,
 * unparse, name the file, download, toast — and each copy had drifted a
 * little: some named the file with a date, some did not, some told you it had
 * worked, some said nothing, and none of them checked whether there was
 * anything to export before handing over an empty file.
 *
 * Pair it with `ListToolbar`'s `secondaryActions`, which already renders a
 * button on desktop and folds into the ⋯ menu on phones:
 *
 * ```tsx
 * const exportCsv = useCsvExport({
 *   rows: filtered,
 *   columns: [{ key: 'name', header: 'Name' }],
 *   filename: 'students',
 *   label: 'students',
 * })
 *
 * <ListToolbar
 *   secondaryActions={[
 *     { id: 'export', label: 'Export', icon: <Download className="size-4" />, onSelect: exportCsv },
 *   ]}
 * />
 * ```
 */

import * as React from 'react'
import { toast } from 'sonner'
import { generateCsv, downloadCsv } from '@/lib/csv'

export interface CsvExportColumn<T> {
  key: keyof T
  header: string
}

export interface UseCsvExportOptions<T> {
  /**
   * The rows to write.
   *
   * Pass the *filtered* list, not the full one: someone who has narrowed a
   * table to one class and hits Export means that class, and silently handing
   * them the whole school is the kind of surprise that gets noticed after the
   * file has been mailed on.
   */
  rows: T[]
  columns: CsvExportColumn<T>[]
  /** Base filename, without extension. A date is appended. */
  filename: string
  /** What the rows are, for the toast: "Exported 24 students". */
  label?: string
}

/**
 * Returns a callback that writes the file.
 *
 * The filename carries the date because these end up in a downloads folder
 * beside last month's copy, and `students.csv (3)` tells you nothing about
 * which is which.
 */
export function useCsvExport<T>({
  rows,
  columns,
  filename,
  label = 'rows',
}: UseCsvExportOptions<T>): () => void {
  return React.useCallback(() => {
    if (rows.length === 0) {
      // A zero-row CSV downloads without complaint and looks like a broken
      // export rather than an empty table, so say so instead.
      toast.info(`No ${label} to export`, {
        description: 'Adjust the filters and try again.',
      })
      return
    }

    try {
      const csv = generateCsv(rows, columns)
      const stamp = new Date().toISOString().slice(0, 10)
      downloadCsv(csv, `${filename}-${stamp}`)
      toast.success(`Exported ${rows.length} ${rows.length === 1 ? label.replace(/s$/, '') : label}`)
    } catch (error) {
      console.error('CSV export failed', error)
      toast.error('Export failed', { description: 'Could not build the file.' })
    }
  }, [rows, columns, filename, label])
}
