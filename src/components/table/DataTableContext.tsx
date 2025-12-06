import React, { createContext, useContext } from "react";
import type { Table as TanStackTable } from "@tanstack/react-table";

export interface DataTableContextValue<TData> {
  table: TanStackTable<TData>;
}

const DataTableContext = createContext<DataTableContextValue<unknown> | undefined>(
  undefined,
);

/**
 * Provides the TanStack Table instance to child components.
 * Used internally by DataTable to share table state.
 */
export function DataTableProvider<TData>({
  table,
  children,
}: {
  table: TanStackTable<TData>;
  children: React.ReactNode;
}) {
  const value = React.useMemo(
    () => ({ table }),
    [table],
  );

  return (
    <DataTableContext.Provider value={value as DataTableContextValue<unknown>}>
      {children}
    </DataTableContext.Provider>
  );
}

/**
 * Hook to access the TanStack Table instance from DataTable context.
 * 
 * @throws {Error} If used outside of DataTableProvider
 * 
 * @example
 * ```tsx
 * function CustomToolbar() {
 *   const table = useDataTable<User>();
 *   const selectedRows = table.getFilteredSelectedRowModel().rows;
 *   
 *   return <div>Selected: {selectedRows.length}</div>;
 * }
 * ```
 */
export function useDataTable<TData>(): TanStackTable<TData> {
  const context = useContext(DataTableContext);
  if (!context) {
    throw new Error("useDataTable must be used within DataTableProvider");
  }
  return context.table as TanStackTable<TData>;
}
