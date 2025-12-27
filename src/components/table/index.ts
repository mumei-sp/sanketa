/**
 * DataTable Package
 *
 * A comprehensive table component library built on TanStack Table.
 *
 * @packageDocumentation
 *
 * @example Basic usage
 * ```tsx
 * import { DataTable } from "@/components/table";
 * import { ColumnDef } from "@tanstack/react-table";
 *
 * const columns: ColumnDef<User>[] = [
 *   { accessorKey: "name", header: "Name" },
 *   { accessorKey: "email", header: "Email" },
 * ];
 *
 * <DataTable columns={columns} data={users} />
 * ```
 */

// Main export
export { DataTable } from './DataTable'
export type { DataTableProps } from './DataTable'

// Context and hooks
export { DataTableProvider, useDataTable } from './DataTableContext'
export type { DataTableContextValue } from './DataTableContext'

// Header components
export { DataTableHeader } from './header/DataTableHeader'
export type { DataTableHeaderProps } from './header/DataTableHeader'
export { DataTableHeaderRow } from './header/DataTableHeaderRow'
export type { DataTableHeaderRowProps } from './header/DataTableHeaderRow'
export { DataTableHeaderCell } from './header/DataTableHeaderCell'
export type { DataTableHeaderCellProps } from './header/DataTableHeaderCell'
export { DataTableColumnHeader } from './header/DataTableColumnHeader'
export type { DataTableColumnHeaderProps } from './header/DataTableColumnHeader'

// Body components
export { DataTableBody } from './body/DataTableBody'
export type { DataTableBodyProps } from './body/DataTableBody'
export { DataTableRow } from './body/DataTableRow'
export type { DataTableRowProps } from './body/DataTableRow'
export { DataTableCell } from './body/DataTableCell'
export type { DataTableCellProps } from './body/DataTableCell'

// Toolbar components
export { DataTableToolbar } from './toolbar/DataTableToolbar'
export type { DataTableToolbarProps } from './toolbar/DataTableToolbar'
export { DataTableSearch } from './toolbar/DataTableSearch'
export type { DataTableSearchProps } from './toolbar/DataTableSearch'
export { DataTableViewOptions } from './toolbar/DataTableViewOptions'
export type { DataTableViewOptionsProps } from './toolbar/DataTableViewOptions'

// Pagination components
export { DataTablePagination } from './pagination/DataTablePagination'
export type { DataTablePaginationProps } from './pagination/DataTablePagination'
export { DataTablePaginationCustom } from './DataTablePaginationCustom'
export type { DataTablePaginationCustomProps } from './DataTablePaginationCustom'
