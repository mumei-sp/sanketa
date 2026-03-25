import * as React from 'react'
import { fontSizes } from '@/config/typography'
import { spacing } from '@/config/spacing'
import { text, border, background } from '@/theme/colors'

export interface CompactTableColumn<T> {
  key: string
  header: string
  /** Custom render function for the cell. If omitted, renders `row[key]` as text. */
  render?: (row: T) => React.ReactNode
  /** Whether the column header text should stay on one line */
  nowrap?: boolean
  /** Whether the cell text should stay on one line */
  cellNowrap?: boolean
  /** Font weight for the cell text (default: 400) */
  cellWeight?: number
  /** Text color for the cell (default: text.body) */
  cellColor?: string
}

interface CompactTableProps<T> {
  columns: CompactTableColumn<T>[]
  data: T[]
  /** Unique key extractor for each row */
  rowKey: (row: T) => string
  /** Max height for vertical scrolling. Default: none */
  maxHeight?: string
}

/**
 * CompactTable - Reusable compact styled table for detail page sections.
 * Provides consistent header/cell styling matching the project's design system.
 * Used for extracurricular activities, behavior logs, schedules, etc.
 */
export function CompactTable<T>({
  columns,
  data,
  rowKey,
  maxHeight,
}: CompactTableProps<T>) {
  return (
    <div
      style={{
        overflowX: 'auto',
        ...(maxHeight ? { maxHeight, overflowY: 'auto' } : {}),
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                style={{
                  fontSize: fontSizes.xs,
                  fontWeight: 500,
                  color: text.body,
                  textAlign: 'left',
                  padding: `${spacing['2']} ${spacing['2']}`,
                  borderBottom: `1px solid ${border.default}`,
                  backgroundColor: background['table-header'],
                  whiteSpace: col.nowrap !== false ? 'nowrap' : undefined,
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
            <tr key={rowKey(row)}>
              {columns.map(col => (
                <td
                  key={col.key}
                  style={{
                    fontSize: fontSizes.xs,
                    fontWeight: col.cellWeight ?? 400,
                    color: col.cellColor ?? text.body,
                    padding: `${spacing['2']} ${spacing['2']}`,
                    borderBottom: `1px solid ${border.subtle}`,
                    whiteSpace: col.cellNowrap ? 'nowrap' : undefined,
                  }}
                >
                  {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
