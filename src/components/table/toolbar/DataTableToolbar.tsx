import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDataTable } from "../DataTableContext";
import { DataTableSearch } from "./DataTableSearch";
import { DataTableViewOptions } from "./DataTableViewOptions";
import { cn } from "@/lib/utils";
import type { Table as TanStackTable } from "@tanstack/react-table";

/**
 * Props for DataTableToolbar component.
 * Provides search, filter reset, column visibility toggle, and custom actions.
 */
export interface DataTableToolbarProps<TData> {
  renderToolbar?: (table: TanStackTable<TData>) => React.ReactNode;
  className?: string;
  searchKey?: string;
  searchPlaceholder?: string;
  searchProps?: React.ComponentProps<typeof DataTableSearch<TData>>;
  showSearch?: boolean;
  showColumnToggle?: boolean;
  viewOptionsProps?: React.ComponentProps<typeof DataTableViewOptions<TData>>;
  showFilterReset?: boolean;
  renderFilterReset?: (table: TanStackTable<TData>) => React.ReactNode;
  filterResetProps?: React.ComponentProps<typeof Button>;
  actions?:
    | React.ReactNode
    | ((table: TanStackTable<TData>) => React.ReactNode);
  layout?: "default" | "compact" | "spacious";
}

/**
 * Toolbar component for DataTable with search, filter controls, and actions.
 * 
 * @example
 * ```tsx
 * <DataTableToolbar
 *   showSearch
 *   showColumnToggle
 *   actions={<Button>Export</Button>}
 * />
 * ```
 */
export function DataTableToolbar<TData>({
  renderToolbar,
  className,
  searchKey,
  searchPlaceholder = "Search...",
  searchProps,
  showSearch = true,
  showColumnToggle = true,
  viewOptionsProps,
  showFilterReset = true,
  renderFilterReset,
  filterResetProps,
  actions,
  layout = "default",
}: DataTableToolbarProps<TData>) {
  const table = useDataTable<TData>();

  if (renderToolbar) {
    return <>{renderToolbar(table)}</>;
  }

  const isFiltered = table.getState().columnFilters.length > 0;

  const layoutClasses = {
    default: "flex items-center justify-between",
    compact: "flex items-center justify-between gap-2",
    spacious: "flex items-center justify-between gap-4",
  };

  const actionsContent =
    typeof actions === "function" ? actions(table) : actions;

  return (
    <div className={cn(layoutClasses[layout], className)}>
      <div className="flex flex-1 items-center space-x-2">
        {showSearch && (
          <DataTableSearch
            searchKey={searchKey}
            placeholder={searchPlaceholder}
            {...searchProps}
          />
        )}
        {showFilterReset &&
          isFiltered &&
          (renderFilterReset ? (
            renderFilterReset(table)
          ) : (
            <Button
              variant="ghost"
              onClick={() => table.resetColumnFilters()}
              className="h-8 px-2 lg:px-3"
              {...filterResetProps}
            >
              Reset
              <X className="ml-2 h-4 w-4" />
            </Button>
          ))}
      </div>
      <div className="flex items-center space-x-2">
        {actionsContent}
        {showColumnToggle && <DataTableViewOptions {...viewOptionsProps} />}
      </div>
    </div>
  );
}
