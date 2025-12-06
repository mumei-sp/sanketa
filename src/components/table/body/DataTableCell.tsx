import * as React from "react";
import { TableCell } from "@/components/ui/table";
import { useDataTable } from "../DataTableContext";
import { cn } from "@/lib/utils";
import type { Cell, Table as TanStackTable } from "@tanstack/react-table";

export interface DataTableCellProps<TData, TValue> {
  cell: Cell<TData, TValue>;
  renderCell?: (
    cell: Cell<TData, TValue>,
    table: TanStackTable<TData>,
  ) => React.ReactNode;
  className?: string | ((cell: Cell<TData, TValue>) => string);
  as?: React.ElementType;
  wrapperProps?: React.HTMLAttributes<HTMLElement>;
  renderValue?: (
    value: any,
    cell: Cell<TData, TValue>,
    table: TanStackTable<TData>,
  ) => React.ReactNode;
}

export function DataTableCell<TData, TValue>({
  cell,
  renderCell,
  className,
  as: WrapperComponent = TableCell,
  wrapperProps,
  renderValue,
}: DataTableCellProps<TData, TValue>) {
  const table = useDataTable<TData>();

  if (renderCell) {
    return <>{renderCell(cell, table)}</>;
  }

  const cellClassName =
    typeof className === "function" ? className(cell) : className;

  // Check if column has a custom cell renderer
  const columnCell = cell.column.columnDef.cell;
  if (typeof columnCell === "function") {
    const cellContext = {
      getValue: cell.getValue,
      row: cell.row,
      column: cell.column,
      table: table,
      cell: cell,
    };
    const renderedCell = columnCell(cellContext as any);

    return (
      <WrapperComponent
        className={cn(cellClassName, wrapperProps?.className)}
        {...wrapperProps}
      >
        {renderedCell}
      </WrapperComponent>
    );
  }

  const cellValue = cell.renderValue();
  const displayValue = renderValue
    ? renderValue(cellValue, cell, table)
    : (cellValue as React.ReactNode);

  return (
    <WrapperComponent
      className={cn(cellClassName, wrapperProps?.className)}
      {...wrapperProps}
    >
      {displayValue}
    </WrapperComponent>
  );
}
