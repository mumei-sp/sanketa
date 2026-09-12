import * as React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  type ColumnDef,
  type TableOptions,
} from "@tanstack/react-table";
import { useState, useMemo } from "react";
import { Table, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { MobileCardItem } from "@/components/shared/MobileCardItem";
import { DataTableProvider } from "./DataTableContext";
import { DataTableHeader } from "./header/DataTableHeader";
import { DataTableBody } from "./body/DataTableBody";
import { DataTableEmptyState, type DataTableEmptyProps } from "./DataTableEmptyState";
import { DataTableToolbar } from "./toolbar/DataTableToolbar";
import { DataTablePagination } from "./pagination/DataTablePagination";
import { cn } from "@/lib/utils";
import type { Table as TanStackTable, Row } from "@tanstack/react-table";

/**
 * Props for the DataTable component.
 *
 * @example
 * ```tsx
 * const columns: ColumnDef<User>[] = [
 *   { accessorKey: "name", header: "Name" },
 *   { accessorKey: "email", header: "Email" },
 * ];
 *
 * <DataTable
 *   columns={columns}
 *   data={users}
 *   enableSorting
 *   enablePagination
 * />
 * ```
 */
export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  enablePagination?: boolean;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enableColumnVisibility?: boolean;
  enableRowSelection?: boolean;
  enableGlobalFilter?: boolean;
  tableOptions?: Omit<
    TableOptions<TData>,
    "data" | "columns" | "getCoreRowModel"
  >;
  headerProps?: React.ComponentProps<typeof DataTableHeader<TData>>;
  bodyProps?: React.ComponentProps<typeof DataTableBody<TData>>;
  toolbarProps?: React.ComponentProps<typeof DataTableToolbar<TData>>;
  showToolbar?: boolean;
  paginationProps?: React.ComponentProps<typeof DataTablePagination<TData>>;
  className?: string;
  containerClassName?: string;
  tableWrapperClassName?: string;
  renderToolbar?: (table: TanStackTable<TData>) => React.ReactNode;
  renderHeader?: (table: TanStackTable<TData>) => React.ReactNode;
  renderBody?: (table: TanStackTable<TData>) => React.ReactNode;
  renderPagination?: (table: TanStackTable<TData>) => React.ReactNode;
  /**
   * Card renderer for narrow viewports. When provided, the table itself is
   * hidden below `lg` and each row renders through this instead — a column
   * layout that only survives by scrolling sideways is unusable on a phone.
   * Toolbar and pagination are shared by both presentations.
   */
  renderMobileCard?: (row: Row<TData>, table: TanStackTable<TData>) => React.ReactNode;
  /**
   * What the table says when it has no rows.
   *
   * One definition serves both presentations, and the table itself works out
   * whether the list is genuinely empty or merely filtered to nothing — see
   * `DataTableEmptyState`.
   */
  empty?: DataTableEmptyProps;
  /**
   * @deprecated Use `empty` instead. Kept so call sites that only ever passed
   * a one-line string keep working while they migrate.
   */
  mobileEmptyMessage?: string;
  layout?: "default" | "compact" | "spacious";
  showBorder?: boolean;
  borderClassName?: string;
  /**
   * Whether the rows are still on their way.
   *
   * A table with no rows yet is not an EMPTY table, and drawing the empty state
   * while a fetch is in flight says the wrong thing and says it at the wrong
   * size: the students table stood 356px waiting and 784px once ten rows
   * landed, so the whole page below it jumped 428px. While this is true the
   * table holds a page of placeholder rows instead — the shape and the height
   * of what is coming — and the empty state is not consulted.
   */
  isLoading?: boolean;
  /**
   * How many placeholder rows to draw. Defaults to the page size, which is what
   * a full first page will be.
   */
  loadingRowCount?: number;
  /**
   * Height of a placeholder row. Rows whose cells hold only text size
   * themselves correctly; pass this for tables with avatars or badges in them,
   * where a real row is taller than a line of text.
   */
  loadingRowHeight?: number | string;
}

/**
 * A fully-featured data table component built on top of TanStack Table.
 *
 * Features:
 * - Sorting, filtering, pagination
 * - Column visibility toggle
 * - Row selection
 * - Global search
 * - Customizable toolbar, header, body, and pagination
 *
 * @example
 * ```tsx
 * import { DataTable } from "@/components/table";
 * import { ColumnDef } from "@tanstack/react-table";
 *
 * type User = { id: string; name: string; email: string };
 *
 * const columns: ColumnDef<User>[] = [
 *   { accessorKey: "name", header: "Name" },
 *   { accessorKey: "email", header: "Email" },
 * ];
 *
 * function UsersTable() {
 *   const [users, setUsers] = useState<User[]>([]);
 *
 *   return (
 *     <DataTable
 *       columns={columns}
 *       data={users}
 *       enableSorting
 *       enablePagination
 *       enableFiltering
 *     />
 *   );
 * }
 * ```
 *
 * @template TData - The type of data in each row
 * @template TValue - The type of value in each cell
 */
export function DataTable<TData, TValue>({
  columns,
  data,
  enablePagination = true,
  enableSorting = true,
  enableFiltering = true,
  enableColumnVisibility = true,
  enableRowSelection = false,
  enableGlobalFilter = true,
  tableOptions = {},
  headerProps,
  bodyProps,
  toolbarProps,
  showToolbar = true,
  paginationProps,
  className,
  containerClassName,
  tableWrapperClassName,
  renderToolbar,
  renderHeader,
  renderBody,
  renderPagination,
  renderMobileCard,
  empty,
  mobileEmptyMessage,
  layout = "default",
  showBorder = true,
  borderClassName,
  isLoading = false,
  loadingRowCount,
  loadingRowHeight,
}: DataTableProps<TData, TValue>) {
  const [columnVisibility, setColumnVisibility] = useState(
    () => tableOptions.initialState?.columnVisibility || {},
  );
  const [rowSelection, setRowSelection] = useState(
    () => tableOptions.initialState?.rowSelection || {},
  );
  const [sorting, setSorting] = useState(
    () => tableOptions.initialState?.sorting || [],
  );
  const [globalFilter, setGlobalFilter] = useState<string>(
    () => (tableOptions.initialState?.globalFilter as string) || "",
  );

  const tableConfig = useMemo(() => {
    const baseConfig: TableOptions<TData> = {
      data,
      columns,
      getCoreRowModel: getCoreRowModel(),
      ...(enablePagination && {
        getPaginationRowModel: getPaginationRowModel(),
      }),
      ...(enableSorting && {
        getSortedRowModel: getSortedRowModel(),
        onSortingChange: setSorting,
        manualSorting: tableOptions.manualSorting,
      }),
      ...(enableFiltering && {
        getFilteredRowModel: getFilteredRowModel(),
        ...(enableGlobalFilter && {
          onGlobalFilterChange: setGlobalFilter,
          globalFilterFn: tableOptions.globalFilterFn,
        }),
      }),
      ...(enableColumnVisibility && {
        onColumnVisibilityChange: setColumnVisibility,
      }),
      ...(enableRowSelection && {
        onRowSelectionChange: setRowSelection,
        enableRowSelection: true,
      }),
      state: {
        ...tableOptions.state,
        sorting,
        columnVisibility,
        rowSelection,
        ...(enableGlobalFilter && { globalFilter }),
      },
      initialState: {
        pagination: {
          pageSize: tableOptions.initialState?.pagination?.pageSize || 10,
        },
        ...tableOptions.initialState,
      },
    };

    const {
      state: _userState,
      initialState: _userInitialState,
      ...restTableOptions
    } = tableOptions as TableOptions<TData>;

    return {
      ...baseConfig,
      ...restTableOptions,
      data: baseConfig.data,
      columns: baseConfig.columns,
      getCoreRowModel: baseConfig.getCoreRowModel,
      state: baseConfig.state,
      initialState: baseConfig.initialState,
    };
  }, [
    data,
    columns,
    enablePagination,
    enableSorting,
    enableFiltering,
    enableGlobalFilter,
    enableColumnVisibility,
    enableRowSelection,
    sorting,
    columnVisibility,
    rowSelection,
    globalFilter,
    tableOptions,
  ]);

  const table = useReactTable(tableConfig);

  // A page of rows, at the size a page of rows takes. Column count comes from
  // the table itself so a placeholder row always has as many cells as the
  // header above it, whatever the caller hid or showed.
  const skeletonRows = useMemo(() => {
    const count =
      loadingRowCount ?? table.getState().pagination?.pageSize ?? 10;
    const cells = table.getVisibleLeafColumns().length || 1;
    const style =
      loadingRowHeight === undefined
        ? undefined
        : {
            height:
              typeof loadingRowHeight === "number"
                ? `${loadingRowHeight}px`
                : loadingRowHeight,
          };
    return { count, cells, style };
  }, [loadingRowCount, loadingRowHeight, table]);

  const layoutClasses = useMemo(
    () => ({
      default: "space-y-4",
      compact: "space-y-2",
      spacious: "space-y-6",
    }),
    [],
  );

  return (
    <DataTableProvider table={table}>
      <div className={cn(layoutClasses[layout], containerClassName)}>
        {showToolbar &&
          (renderToolbar ? (
            renderToolbar(table)
          ) : (
            <DataTableToolbar {...toolbarProps} />
          ))}
        <div
          className={cn(
            showBorder && "rounded-md border",
            renderMobileCard && "hidden lg:block",
            tableWrapperClassName,
            borderClassName,
          )}
        >
          <Table className={className}>
            {renderHeader ? (
              renderHeader(table)
            ) : (
              <DataTableHeader<TData> {...headerProps} />
            )}
            {isLoading ? (
              <TableBody>
                {Array.from({ length: skeletonRows.count }).map((_, r) => (
                  // Height goes on the ROW, and the cells give up their vertical
                  // padding inline. A class could not win this: tables that
                  // bring their own `renderBody` pad cells themselves, and a
                  // padded cell sets a floor the row cannot go under — which is
                  // how a 37px row came out 44px tall while it loaded.
                  <TableRow
                    key={r}
                    className="hover:bg-transparent"
                    style={skeletonRows.style}
                  >
                    {Array.from({ length: skeletonRows.cells }).map((__, c) => (
                      <TableCell
                        key={c}
                        style={
                          skeletonRows.style
                            ? { paddingTop: 0, paddingBottom: 0 }
                            : undefined
                        }
                      >
                        <Skeleton className="h-4 w-full rounded" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            ) : renderBody ? (
              renderBody(table)
            ) : (
              <DataTableBody<TData>
                {...bodyProps}
                renderEmpty={bodyProps?.renderEmpty ?? (emptyTable => (
                  <tr>
                    <td colSpan={emptyTable.getVisibleLeafColumns().length}>
                      <DataTableEmptyState table={emptyTable} empty={empty} />
                    </td>
                  </tr>
                ))}
              />
            )}
          </Table>
        </div>
        {renderMobileCard && (
          <div className="flex flex-col gap-3 lg:hidden">
            {isLoading ? (
              Array.from({ length: skeletonRows.count }).map((_, i) => (
                <MobileCardItem key={i} className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-10 shrink-0 rounded-full" />
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <Skeleton className="h-4 w-28 rounded" />
                      <Skeleton className="h-3 w-36 rounded" />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-full rounded" />
                </MobileCardItem>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              mobileEmptyMessage ? (
                <p className="py-8 text-center text-body-muted text-muted-foreground">
                  {mobileEmptyMessage}
                </p>
              ) : (
                <DataTableEmptyState table={table} empty={empty} />
              )
            ) : (
              table
                .getRowModel()
                .rows.map((row) => (
                  <React.Fragment key={row.id}>
                    {renderMobileCard(row, table)}
                  </React.Fragment>
                ))
            )}
          </div>
        )}
        {enablePagination &&
          (renderPagination ? (
            renderPagination(table)
          ) : (
            <DataTablePagination {...paginationProps} />
          ))}
      </div>
    </DataTableProvider>
  );
}

export { DataTableHeader } from "./header/DataTableHeader";
export { DataTableHeaderRow } from "./header/DataTableHeaderRow";
export { DataTableHeaderCell } from "./header/DataTableHeaderCell";
export { DataTableColumnHeader } from "./header/DataTableColumnHeader";
export { DataTableBody } from "./body/DataTableBody";
export { DataTableRow } from "./body/DataTableRow";
export { DataTableCell } from "./body/DataTableCell";
export { DataTableToolbar } from "./toolbar/DataTableToolbar";
export { DataTableSearch } from "./toolbar/DataTableSearch";
export { DataTableViewOptions } from "./toolbar/DataTableViewOptions";
export { DataTablePagination } from "./pagination/DataTablePagination";
export { useDataTable } from "./DataTableContext";
