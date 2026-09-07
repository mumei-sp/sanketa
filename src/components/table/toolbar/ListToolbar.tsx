/**
 * ListToolbar — the header strip above every list in the app.
 *
 * Desktop keeps the dense single line the design calls for: title on the left,
 * then search, filters, secondary actions and the primary action on the right.
 *
 * Below `md` that line cannot fit, and stacking every control costs 22–37% of
 * a phone's first screen before any data appears. The toolbar reshapes into the
 * two-row arrangement mobile list screens have settled on (Gmail, Drive, Play):
 * a search row that keeps the primary action beside it, then a filter row that
 * scrolls sideways.
 *
 *   ┌ Routes ───────────────────────────────┐
 *   │ [🔍 Search routes......] [ + Add    ] │
 *   │ Status: [All ▾]  Sort: [Latest ▾] [⋯] │
 *   └───────────────────────────────────────┘
 *
 * Filters stay on screen and one tap away — no sheet, no modal, no hidden
 * state. Only genuinely secondary actions (export, import) fold into the ⋯
 * menu, because they are rare and their icons alone are ambiguous.
 *
 * Each filter renders in exactly one place at a time (inline on desktop, in
 * the chip row on phones), so there is only ever one live control per filter.
 *
 * @example
 * ```tsx
 * <ListToolbar
 *   title="Routes"
 *   search={
 *     <ListToolbarSearch placeholder="Search routes" value={q} onValueChange={setQ} />
 *   }
 *   filters={[
 *     { id: 'status', label: 'Status', inlineLabel: true, isActive: s !== 'all', control: <Select … /> },
 *   ]}
 *   secondaryActions={[
 *     { id: 'export', label: 'Export', icon: <Download />, onSelect: handleExport },
 *   ]}
 *   primaryAction={<Button onClick={add}>Add Route</Button>}
 * />
 * ```
 */

import * as React from 'react'
import { Search, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import { TOOLBAR_ROW, TOOLBAR_GROUP, TOOLBAR_CONTROL_HEIGHT, TOOLBAR_SEARCH } from './constants'

/** One filter control, plus the label shown beside it. */
export interface ListToolbarFilter {
  /** Stable key. */
  id: string
  /**
   * Shown beside the control when `inlineLabel`. Give it without punctuation —
   * the rendered form adds the colon.
   */
  label: string
  /** The control itself — a Select, a picker, anything. */
  control: React.ReactNode
  /** Reserved for callers that want to highlight an engaged filter. */
  isActive?: boolean
  /**
   * Show `label` beside the control. Worth it when the control's own text is
   * ambiguous on its own ("All" reads as nothing; "All Statuses" reads fine).
   */
  inlineLabel?: boolean
}

/** A secondary action — a desktop button, a ⋯ menu item on phones. */
export interface ListToolbarAction {
  id: string
  label: string
  icon?: React.ReactNode
  onSelect: () => void
}

export interface ListToolbarProps {
  /** Heading shown at the start of the row. */
  title?: React.ReactNode
  /** Search control. Shares the first row with the primary action on phones. */
  search?: React.ReactNode
  filters?: ListToolbarFilter[]
  secondaryActions?: ListToolbarAction[]
  /** Kept visible and labelled at every width. */
  primaryAction?: React.ReactNode
  className?: string
}

export function ListToolbar({
  title,
  search,
  filters = [],
  secondaryActions = [],
  primaryAction,
  className,
}: ListToolbarProps) {
  const isMobile = useIsMobile()

  const renderFilter = (filter: ListToolbarFilter) =>
    filter.inlineLabel ? (
      <div key={filter.id} className="flex shrink-0 items-center gap-2">
        <span className="shrink-0 text-sm text-muted-foreground whitespace-nowrap">
          {filter.label}:
        </span>
        {filter.control}
      </div>
    ) : (
      <div key={filter.id} className="shrink-0">
        {filter.control}
      </div>
    )

  if (isMobile) {
    const hasFilterRow = filters.length > 0 || secondaryActions.length > 0
    return (
      <div className={cn('flex flex-col gap-2', className)}>
        {typeof title === 'string' ? (
          <h2 className="text-page-title text-foreground">{title}</h2>
        ) : (
          title
        )}

        {/* Row 1 — search keeps the primary action beside it. */}
        {(search || primaryAction) && (
          <div className="flex items-center gap-2">
            {search}
            {primaryAction}
          </div>
        )}

        {/* Row 2 — filters stay visible; the row scrolls if they outgrow it. */}
        {hasFilterRow && (
          <div className="scrollbar-thin -mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-0.5">
            {filters.map(renderFilter)}
            {secondaryActions.length > 0 && <OverflowMenu actions={secondaryActions} />}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn(TOOLBAR_ROW, className)}>
      {typeof title === 'string' ? (
        <h2 className="text-page-title text-foreground">{title}</h2>
      ) : (
        title
      )}

      <div className={TOOLBAR_GROUP}>
        {search}
        {filters.map(renderFilter)}
        {secondaryActions.map(action => (
          <Button
            key={action.id}
            variant="outline"
            onClick={action.onSelect}
            className={cn(TOOLBAR_CONTROL_HEIGHT, 'gap-1.5')}
          >
            {action.icon}
            {action.label}
          </Button>
        ))}
        {primaryAction}
      </div>
    </div>
  )
}

/** ⋯ menu holding the secondary actions on phones. */
function OverflowMenu({ actions }: { actions: ListToolbarAction[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label="More actions"
          className={cn(TOOLBAR_CONTROL_HEIGHT, 'aspect-square shrink-0')}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map(action => (
          <DropdownMenuItem key={action.id} onSelect={action.onSelect} className="gap-2">
            {action.icon}
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** The search field every list toolbar uses — icon inside, fills the row on phones. */
export function ListToolbarSearch({
  placeholder,
  value,
  onValueChange,
  className,
}: {
  placeholder: string
  value: string
  onValueChange: (value: string) => void
  className?: string
}) {
  return (
    <div className={cn('relative w-[250px]', TOOLBAR_SEARCH, 'max-md:min-w-0 max-md:flex-1', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={e => onValueChange(e.target.value)}
        className={cn(TOOLBAR_CONTROL_HEIGHT, 'w-full bg-white pl-10')}
      />
    </div>
  )
}

/**
 * Primary action sizing — keeps its label at every width but shrinks to its
 * content on phones so it can sit beside the search field.
 */
export const TOOLBAR_PRIMARY_ACTION = cn(TOOLBAR_CONTROL_HEIGHT, 'shrink-0')

/**
 * Filter control sizing — a fixed width on desktop, content-sized on phones so
 * the chips in the scroll row stay compact.
 */
export const TOOLBAR_FILTER_CONTROL = 'max-md:w-auto'
