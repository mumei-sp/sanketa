import * as React from "react";
import { TableHeader } from "@/components/ui/table";
import { useDataTable } from "../DataTableContext";
import { DataTableHeaderRow } from "./DataTableHeaderRow";
import { cn } from "@/lib/utils";
import type {
  Table as TanStackTable,
  HeaderGroup,
} from "@tanstack/react-table";

/**
 * Props for DataTableHeader component.
 * Renders table header with support for custom renderers.
 */
export interface DataTableHeaderProps<TData> {
  renderHeader?: (table: TanStackTable<TData>) => React.ReactNode;
  renderHeaderGroups?: (
    headerGroups: HeaderGroup<TData>[],
    table: TanStackTable<TData>,
  ) => React.ReactNode;
  renderHeaderRow?: (
    headerGroup: HeaderGroup<TData>,
    table: TanStackTable<TData>,
  ) => React.ReactNode;
  className?: string;
  headerRowClassName?: string | ((headerGroup: HeaderGroup<TData>) => string);
  headerRowProps?: Omit<
    React.ComponentProps<typeof DataTableHeaderRow<TData>>,
    "headerGroup"
  >;
  as?: React.ElementType;
  wrapperProps?: React.HTMLAttributes<HTMLElement>;
  showHeader?: boolean;
}

/**
 * Header component for DataTable.
 * Renders column headers with sorting support.
 */
export function DataTableHeader<TData>({
  renderHeader,
  renderHeaderGroups,
  renderHeaderRow,
  className,
  headerRowClassName,
  headerRowProps,
  as: WrapperComponent = TableHeader,
  wrapperProps,
  showHeader = true,
}: DataTableHeaderProps<TData>) {
  const table = useDataTable<TData>();

  if (!showHeader) return null;

  if (renderHeader) {
    return <>{renderHeader(table)}</>;
  }

  const headerGroups = table.getHeaderGroups();

  if (renderHeaderGroups) {
    return (
      <WrapperComponent
        className={cn(className, wrapperProps?.className)}
        {...wrapperProps}
      >
        {renderHeaderGroups(headerGroups, table)}
      </WrapperComponent>
    );
  }

  return (
    <WrapperComponent
      className={cn(className, wrapperProps?.className)}
      {...wrapperProps}
    >
      {headerGroups.map((headerGroup) => {
        if (renderHeaderRow) {
          return (
            <React.Fragment key={headerGroup.id}>
              {renderHeaderRow(headerGroup, table)}
            </React.Fragment>
          );
        }

        return (
          <DataTableHeaderRow
            key={headerGroup.id}
            headerGroup={headerGroup}
            className={
              typeof headerRowClassName === "function"
                ? headerRowClassName(headerGroup)
                : headerRowClassName
            }
            {...headerRowProps}
          />
        );
      })}
    </WrapperComponent>
  );
}
