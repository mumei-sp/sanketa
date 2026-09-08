/**
 * What a table shows when it has no rows.
 *
 * Every list used to answer that with the string "No results." — twice over,
 * once in a `<td colSpan>` and once in a `<p>` for the card list, so the two
 * presentations could disagree and neither said anything useful.
 *
 * The distinction that matters is *why* it is empty, because the two cases
 * want opposite things from the reader:
 *
 *   nothing here yet   → tell them what this list is for, and offer the action
 *                        that fills it
 *   filters match none → tell them the data exists but their filters hide it,
 *                        and offer to clear them
 *
 * A single "No results." serves neither: someone staring at an empty table
 * cannot tell whether they broke a filter or the school has no students.
 */

import * as React from 'react'
import { SearchX } from 'lucide-react'
import type { Table as TanStackTable } from '@tanstack/react-table'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'

/** What a list says about itself when it holds nothing at all. */
export interface DataTableEmptyProps {
  icon?: React.ReactNode
  /** e.g. "No students yet" */
  title: string
  description?: string
  /** The thing that fills the list — usually the same button as the toolbar's. */
  action?: React.ReactNode
}

export function DataTableEmptyState<TData>({
  table,
  empty,
  className,
}: {
  table: TanStackTable<TData>
  empty?: DataTableEmptyProps
  className?: string
}) {
  // Rows exist, but nothing survives the current filters. Asking the table
  // rather than the caller means every list gets this for free and none of
  // them can forget to distinguish the two cases.
  const hasRowsBehindFilters = table.getCoreRowModel().rows.length > 0
  const canClear =
    table.getState().columnFilters.length > 0 || Boolean(table.getState().globalFilter)

  if (hasRowsBehindFilters) {
    return (
      <EmptyState
        icon={<SearchX />}
        title="No matches"
        description="Nothing here matches the current filters."
        action={
          canClear ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                table.resetColumnFilters()
                table.resetGlobalFilter()
              }}
            >
              Clear filters
            </Button>
          ) : undefined
        }
        className={className}
      />
    )
  }

  return (
    <EmptyState
      icon={empty?.icon ?? <SearchX />}
      title={empty?.title ?? 'Nothing here yet'}
      description={empty?.description}
      action={empty?.action}
      className={className}
    />
  )
}
