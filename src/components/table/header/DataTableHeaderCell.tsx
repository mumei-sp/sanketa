import * as React from "react";
import type { Header } from "@tanstack/react-table";
import { TableHead } from "@/components/ui/table";
import { DataTableColumnHeader } from "./DataTableColumnHeader";
import { useDataTable } from "../DataTableContext";
import { cn } from "@/lib/utils";
import type { Table as TanStackTable } from "@tanstack/react-table";

export interface DataTableHeaderCellProps<TData, TValue> {
  header: Header<TData, TValue>;
  renderCell?: (
    header: Header<TData, TValue>,
    table: TanStackTable<TData>,
  ) => React.ReactNode;
  className?: string | ((header: Header<TData, TValue>) => string);
  enableSorting?: boolean;
  columnHeaderProps?: Omit<
    React.ComponentProps<typeof DataTableColumnHeader<TData, TValue>>,
    "column"
  >;
  as?: React.ElementType;
  wrapperProps?: React.HTMLAttributes<HTMLElement>;
}

export function DataTableHeaderCell<TData, TValue>({
  header,
  renderCell,
  className,
  enableSorting = true,
  columnHeaderProps,
  as: WrapperComponent = TableHead,
  wrapperProps,
}: DataTableHeaderCellProps<TData, TValue>) {
  const table = useDataTable<TData>();

  if (renderCell) {
    return <>{renderCell(header, table)}</>;
  }

  const cellClassName =
    typeof className === "function" ? className(header) : className;

  if (header.isPlaceholder) {
    return (
      <WrapperComponent
        className={cn(cellClassName, wrapperProps?.className)}
        {...wrapperProps}
      />
    );
  }

  const shouldShowSortable = enableSorting && header.column.getCanSort();

  return (
    <WrapperComponent
      className={cn(cellClassName, wrapperProps?.className)}
      {...wrapperProps}
    >
      {shouldShowSortable ? (
        <DataTableColumnHeader column={header.column} {...columnHeaderProps} />
      ) : (
        <>
          {header.column.columnDef.header
            ? typeof header.column.columnDef.header === "function"
              ? header.column.columnDef.header({
                  column: header.column,
                  header,
                  table,
                })
              : (header.column.columnDef.header as React.ReactNode)
            : header.id}
        </>
      )}
    </WrapperComponent>
  );
}
