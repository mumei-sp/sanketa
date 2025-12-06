import * as React from "react";
import type { HeaderGroup } from "@tanstack/react-table";
import { TableRow } from "@/components/ui/table";
import { DataTableHeaderCell } from "./DataTableHeaderCell";
import { useDataTable } from "../DataTableContext";
import { cn } from "@/lib/utils";
import type { Table as TanStackTable } from "@tanstack/react-table";

export interface DataTableHeaderRowProps<TData> {
  headerGroup: HeaderGroup<TData>;
  renderRow?: (
    headerGroup: HeaderGroup<TData>,
    table: TanStackTable<TData>,
  ) => React.ReactNode;
  renderCell?: (header: any, table: TanStackTable<TData>) => React.ReactNode;
  className?: string | ((headerGroup: HeaderGroup<TData>) => string);
  headerCellProps?: Omit<
    React.ComponentProps<typeof DataTableHeaderCell<TData, any>>,
    "header"
  >;
  as?: React.ElementType;
  wrapperProps?: React.HTMLAttributes<HTMLElement>;
}

export function DataTableHeaderRow<TData>({
  headerGroup,
  renderRow,
  renderCell,
  className,
  headerCellProps,
  as: WrapperComponent = TableRow,
  wrapperProps,
}: DataTableHeaderRowProps<TData>) {
  const table = useDataTable<TData>();

  if (renderRow) {
    return <>{renderRow(headerGroup, table)}</>;
  }

  const rowClassName =
    typeof className === "function" ? className(headerGroup) : className;

  return (
    <WrapperComponent
      className={cn(rowClassName, wrapperProps?.className)}
      {...wrapperProps}
    >
      {headerGroup.headers.map((header) => {
        if (renderCell) {
          return (
            <React.Fragment key={header.id}>
              {renderCell(header, table)}
            </React.Fragment>
          );
        }

        return (
          <DataTableHeaderCell
            key={header.id}
            header={header}
            {...headerCellProps}
          />
        );
      })}
    </WrapperComponent>
  );
}
