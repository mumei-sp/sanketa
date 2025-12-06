import * as React from 'react'
import { TableBody } from '@/components/ui/table'
import { useDataTable } from '../DataTableContext'
import { DataTableRow } from './DataTableRow'
import { cn } from '@/lib/utils'
import type { Table as TanStackTable, Row } from '@tanstack/react-table'

/**
 * Props for DataTableBody component.
 * Renders table body rows with support for custom renderers and empty state.
 */
export interface DataTableBodyProps<TData> {
  renderBody?: (table: TanStackTable<TData>) => React.ReactNode
  renderRow?: (row: Row<TData>, table: TanStackTable<TData>) => React.ReactNode
  renderEmpty?: (table: TanStackTable<TData>) => React.ReactNode
  className?: string
  rowClassName?: string | ((row: Row<TData>) => string)
  rowProps?: Omit<React.ComponentProps<typeof DataTableRow<TData>>, 'row'>
  as?: React.ElementType
  wrapperProps?: React.HTMLAttributes<HTMLElement>
  emptyMessage?: string | React.ReactNode
  emptyClassName?: string
  showEmptyState?: boolean
}

/**
 * Body component for DataTable.
 * Renders table rows and handles empty state display.
 */
export function DataTableBody<TData>({
  renderBody,
  renderRow,
  renderEmpty,
  className,
  rowClassName,
  rowProps,
  as: WrapperComponent = TableBody,
  wrapperProps,
  emptyMessage = 'No results.',
  emptyClassName,
  showEmptyState = true,
}: DataTableBodyProps<TData>) {
  const table = useDataTable<TData>()

  if (renderBody) {
    return <>{renderBody(table)}</>
  }

  const rows = table.getRowModel().rows

  return (
    <WrapperComponent className={cn(className, wrapperProps?.className)} {...wrapperProps}>
      {rows?.length
        ? rows.map(row => {
            if (renderRow) {
              return <React.Fragment key={row.id}>{renderRow(row, table)}</React.Fragment>
            }

            return (
              <DataTableRow
                key={row.id}
                row={row}
                className={typeof rowClassName === 'function' ? rowClassName(row) : rowClassName}
                {...rowProps}
              />
            )
          })
        : showEmptyState &&
          (renderEmpty ? (
            renderEmpty(table)
          ) : (
            <DataTableEmpty table={table} message={emptyMessage} className={emptyClassName} />
          ))}
    </WrapperComponent>
  )
}

function DataTableEmpty<TData>({
  table,
  message,
  className,
}: {
  table: TanStackTable<TData>
  message?: string | React.ReactNode
  className?: string
}) {
  const columnCount = table.getVisibleLeafColumns().length

  return (
    <tr>
      <td colSpan={columnCount} className={cn('h-24 text-center', className)}>
        {message || 'No results.'}
      </td>
    </tr>
  )
}
