import * as React from "react";
import type { Row, Cell } from "@tanstack/react-table";
import { TableRow } from "@/components/ui/table";
import { DataTableCell } from "./DataTableCell";
import { useDataTable } from "../DataTableContext";
import { cn } from "@/lib/utils";
import type { Table as TanStackTable } from "@tanstack/react-table";

export interface DataTableRowProps<TData> {
  row: Row<TData>;
  renderRow?: (row: Row<TData>, table: TanStackTable<TData>) => React.ReactNode;
  renderCell?: <TValue>(
    cell: Cell<TData, TValue>,
    table: TanStackTable<TData>,
  ) => React.ReactNode;
  className?: string | ((row: Row<TData>) => string);
  cellProps?: Omit<
    React.ComponentProps<typeof DataTableCell<TData, any>>,
    "cell"
  >;
  as?: React.ElementType;
  wrapperProps?: React.HTMLAttributes<HTMLElement>;
  showSelectionState?: boolean;
  renderSelectionIndicator?: (
    row: Row<TData>,
    isSelected: boolean,
  ) => React.ReactNode;
}

export function DataTableRow<TData>({
  row,
  renderRow,
  renderCell,
  className,
  cellProps,
  as: WrapperComponent = TableRow,
  wrapperProps,
  showSelectionState = true,
  renderSelectionIndicator,
}: DataTableRowProps<TData>) {
  const table = useDataTable<TData>();

  if (renderRow) {
    return <>{renderRow(row, table)}</>;
  }

  const rowClassName =
    typeof className === "function" ? className(row) : className;

  const isSelected = row.getIsSelected();

  return (
    <WrapperComponent
      data-state={showSelectionState && isSelected ? "selected" : undefined}
      className={cn(rowClassName, wrapperProps?.className)}
      {...wrapperProps}
    >
      {renderSelectionIndicator && (
        <>{renderSelectionIndicator(row, isSelected)}</>
      )}
      {row.getVisibleCells().map((cell) => {
        if (renderCell) {
          return (
            <React.Fragment key={cell.id}>
              {renderCell(cell, table)}
            </React.Fragment>
          );
        }

        return <DataTableCell key={cell.id} cell={cell} {...cellProps} />;
      })}
    </WrapperComponent>
  );
}
