import * as React from "react";
import { Input } from "@/components/ui/input";
import { useDataTable } from "../DataTableContext";
import { cn } from "@/lib/utils";
import type { Table as TanStackTable } from "@tanstack/react-table";

/**
 * Props for DataTableSearch component.
 * Provides debounced search input for filtering table data.
 */
export interface DataTableSearchProps<TData> {
  searchKey?: string;
  placeholder?: string;
  renderSearch?: (table: TanStackTable<TData>) => React.ReactNode;
  className?: string;
  inputProps?: React.ComponentProps<typeof Input>;
  value?: string;
  onSearchChange?: (value: string) => void;
  debounceMs?: number;
}

/**
 * Search input component for filtering table data.
 * Supports both column-specific and global filtering with debouncing.
 * 
 * @example
 * ```tsx
 * <DataTableSearch
 *   searchKey="name"
 *   placeholder="Search by name..."
 *   debounceMs={500}
 * />
 * ```
 */
export function DataTableSearch<TData>({
  searchKey,
  placeholder = "Search...",
  renderSearch,
  className,
  inputProps,
  value: controlledValue,
  onSearchChange,
  debounceMs = 300,
}: DataTableSearchProps<TData>) {
  const table = useDataTable<TData>();

  const currentFilterValue = React.useMemo(() => {
    if (searchKey) {
      const column = table.getColumn(searchKey);
      return (column?.getFilterValue() as string) || "";
    }
    return (table.getState().globalFilter as string) || "";
  }, [table, searchKey]);

  const [searchValue, setSearchValue] = React.useState(
    controlledValue ?? currentFilterValue,
  );

  const [debouncedValue, setDebouncedValue] = React.useState(searchValue);
  const onSearchChangeRef = React.useRef(onSearchChange);

  React.useEffect(() => {
    onSearchChangeRef.current = onSearchChange;
  }, [onSearchChange]);

  const handleSearchChange = React.useCallback((value: string) => {
    onSearchChangeRef.current?.(value);
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(searchValue);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchValue, debounceMs]);

  React.useEffect(() => {
    if (searchKey) {
      const column = table.getColumn(searchKey);
      if (column) {
        column.setFilterValue(debouncedValue || undefined);
      }
    } else {
      table.setGlobalFilter(debouncedValue || undefined);
    }
    handleSearchChange(debouncedValue);
  }, [debouncedValue, searchKey, table, handleSearchChange]);

  React.useEffect(() => {
    if (controlledValue !== undefined) {
      setSearchValue(controlledValue);
    }
  }, [controlledValue]);

  React.useEffect(() => {
    if (controlledValue === undefined && currentFilterValue !== searchValue) {
      setSearchValue(currentFilterValue);
    }
  }, [currentFilterValue, controlledValue, searchValue]);

  if (renderSearch) {
    return <>{renderSearch(table)}</>;
  }

  return (
    <Input
      placeholder={placeholder}
      value={searchValue}
      onChange={(e) => setSearchValue(e.target.value)}
      className={cn("h-8 w-[150px] lg:w-[250px]", className)}
      aria-label={placeholder || "Search table"}
      {...inputProps}
    />
  );
}
