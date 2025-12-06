import * as React from 'react'
import { Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDataTable } from '../DataTableContext'
import { cn } from '@/lib/utils'
import type { Table as TanStackTable } from '@tanstack/react-table'

function SimpleDropdown({
  trigger,
  children,
  className,
}: {
  trigger: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  return (
    <div ref={ref} className={cn('relative', className)}>
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <div className="absolute right-0 z-50 mt-2 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
          {children}
        </div>
      )}
    </div>
  )
}

export interface DataTableViewOptionsProps<TData> {
  renderViewOptions?: (table: TanStackTable<TData>) => React.ReactNode
  className?: string
  showButton?: boolean
  buttonProps?: React.ComponentProps<typeof Button>
  label?: string
  formatColumnLabel?: (columnId: string) => string
}

/**
 * Column visibility toggle component.
 * Allows users to show/hide table columns via a dropdown menu.
 */
export function DataTableViewOptions<TData>({
  renderViewOptions,
  className,
  showButton = true,
  buttonProps,
  label = 'Toggle columns',
  formatColumnLabel = id => id,
}: DataTableViewOptionsProps<TData>) {
  const table = useDataTable<TData>()

  if (renderViewOptions) {
    return <>{renderViewOptions(table)}</>
  }

  const columns = table
    .getAllColumns()
    .filter(column => typeof column.accessorFn !== 'undefined' && column.getCanHide())

  if (columns.length === 0) return null

  return (
    <SimpleDropdown
      className={className}
      trigger={
        showButton ? (
          <Button
            variant="outline"
            size="sm"
            className="ml-auto hidden h-8 lg:flex"
            {...buttonProps}
          >
            <Settings2 className="mr-2 h-4 w-4" />
            View
          </Button>
        ) : (
          <Settings2 className="h-4 w-4" />
        )
      }
    >
      <div className="px-2 py-1.5 text-sm font-semibold">{label}</div>
      <div className="h-px bg-muted" />
      {columns.map(column => (
        <div
          key={column.id}
          className="relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
          onClick={() => column.toggleVisibility(!column.getIsVisible())}
        >
          <input
            type="checkbox"
            checked={column.getIsVisible()}
            onChange={() => {}}
            className="absolute left-2 h-3.5 w-3.5"
          />
          <span className="capitalize">{formatColumnLabel(column.id)}</span>
        </div>
      ))}
    </SimpleDropdown>
  )
}
