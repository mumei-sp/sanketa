import * as React from "react";
import type { Column } from "@tanstack/react-table";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface DataTableColumnHeaderProps<TData, TValue> {
  column: Column<TData, TValue>;
  renderHeader?: (column: Column<TData, TValue>) => React.ReactNode;
  title?: string;
  className?: string;
  buttonVariant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  buttonSize?: "default" | "sm" | "lg" | "icon";
  showSortIcons?: boolean;
  renderSortIcon?: (sortDirection: "asc" | "desc" | null) => React.ReactNode;
  renderSortMenu?: (column: Column<TData, TValue>) => React.ReactNode;
  disableSortingUI?: boolean;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  renderHeader,
  title,
  className,
  buttonVariant = "ghost",
  buttonSize = "sm",
  showSortIcons = true,
  renderSortIcon,
  renderSortMenu,
  disableSortingUI = false,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (renderHeader) {
    return <>{renderHeader(column)}</>;
  }

  const displayTitle =
    title ||
    (typeof column.columnDef.header === "string"
      ? column.columnDef.header
      : column.id);

  if (!column.getCanSort() || disableSortingUI) {
    return <div className={cn(className)}>{displayTitle}</div>;
  }

  const sortDirection = column.getIsSorted();

  const SortIcon = () => {
    if (renderSortIcon) {
      return <>{renderSortIcon(sortDirection as "asc" | "desc" | null)}</>;
    }

    if (!showSortIcons) return null;

    if (sortDirection === "desc") {
      return <ArrowDown className="ml-2 h-4 w-4" />;
    }
    if (sortDirection === "asc") {
      return <ArrowUp className="ml-2 h-4 w-4" />;
    }
    return <ArrowUpDown className="ml-2 h-4 w-4" />;
  };

  if (renderSortMenu) {
    return (
      <div className={cn("flex items-center space-x-2", className)}>
        {renderSortMenu(column)}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <Button
        variant={buttonVariant}
        size={buttonSize}
        className="-ml-3 h-8 data-[state=open]:bg-accent"
        onClick={() => {
          const currentSort = column.getIsSorted();
          if (currentSort === false || currentSort === "desc") {
            column.toggleSorting(false); // asc
          } else {
            column.toggleSorting(true); // desc
          }
        }}
        aria-label={`Sort by ${displayTitle}`}
        aria-sort={
          sortDirection === "asc"
            ? "ascending"
            : sortDirection === "desc"
              ? "descending"
              : "none"
        }
      >
        <span>{displayTitle}</span>
        <SortIcon />
      </Button>
    </div>
  );
}
