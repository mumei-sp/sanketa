import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import type { Table as TanStackTable, Row } from '@tanstack/react-table'
import { Plus, Search, X } from 'lucide-react'
import { DataTable, DataTableCell } from '@/components/table'
import { studentColumns } from './student-columns'
import type { Student } from '@/features/students/types'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { ClassPicker } from '@/components/shared/ClassPicker'
import { TableRow } from '@/components/ui/table'
import { DataTablePaginationCustom } from '@/components/table/DataTablePaginationCustom'
import { colors, withOpacity, baseColors } from '@/theme/colors'

interface StudentsTableProps {
  data: Student[]
  isLoading?: boolean
  onImport?: () => void
  onExport?: () => void
}

/**
 * Students table component using TanStack Table
 */
export function StudentsTable({ data, isLoading: _isLoading }: Omit<StudentsTableProps, 'onImport' | 'onExport'>) {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = React.useState<string>('all')
  // Section-level filter: empty array = "All Classes", otherwise only rows
  // whose `class` label matches one of these pass the filter.
  const [selectedSections, setSelectedSections] = React.useState<string[]>([])
  const tableRef = React.useRef<TanStackTable<Student> | null>(null)

  /** Push the current class filter into the table whenever the picker changes. */
  const applySectionFilter = React.useCallback((labels: string[]) => {
    setSelectedSections(labels)
    const classColumn = tableRef.current?.getColumn('class')
    classColumn?.setFilterValue(labels.length === 0 ? undefined : labels)
  }, [])

  const clearSections = React.useCallback(() => {
    applySectionFilter([])
  }, [applySectionFilter])

  // Custom toolbar with search, class picker, status dropdown, and add button
  const renderToolbar = React.useCallback(
    (table: TanStackTable<Student>) => {
      tableRef.current = table
      const studentColumn = table.getColumn('student')
      const searchValue = (studentColumn?.getFilterValue() as string) || ''

      const handleSearchChange = (value: string) => {
        if (studentColumn) {
          studentColumn.setFilterValue(value || undefined)
        }
      }

      const handleStatusChange = (value: string) => {
        setStatusFilter(value)
        const statusColumn = table.getColumn('status')
        if (statusColumn) {
          statusColumn.setFilterValue(value === 'all' ? undefined : value)
        }
      }

      const filterLabel =
        selectedSections.length === 0
          ? 'All Classes'
          : selectedSections.length === 1
          ? selectedSections[0]
          : `${selectedSections.length} classes`

      return (
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-page-title text-foreground">Students</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative w-[250px] min-w-[150px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search for a student"
                value={searchValue}
                onChange={e => handleSearchChange(e.target.value)}
                className="h-8 w-full pl-10 bg-white border-default"
              />
            </div>

            {/* Class filter pill: label on the left + ClassPicker trigger (gear). */}
            <div
              className="flex items-center gap-1.5 rounded-md h-8 px-2.5"
              style={{
                backgroundColor: withOpacity('var(--accent)', 0.35),
                color: 'var(--heading)',
              }}
            >
              <span className="text-xs font-medium">{filterLabel}</span>
              {selectedSections.length > 0 && (
                <button
                  type="button"
                  onClick={clearSections}
                  className="flex items-center justify-center rounded hover:bg-black/5 transition-colors"
                  style={{ width: 18, height: 18 }}
                  aria-label="Clear class filter"
                >
                  <X className="w-3 h-3" style={{ color: colors.text.muted }} />
                </button>
              )}
              <ClassPicker
                storageKey="students-table"
                mode="section"
                max={10}
                defaultSelected={[]}
                onChange={applySectionFilter}
              />
            </div>

            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="h-8 w-[120px] bg-accent text-foreground border-0 hover:bg-accent/80">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="On Leave">On Leave</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => navigate('/students/add')}
              className="bg-primary hover:bg-primary/90 text-foreground"
            >
              <Plus className="size-4" />
              Add Student
            </Button>
          </div>
        </div>
      )
    },
    [navigate, statusFilter, selectedSections, applySectionFilter, clearSections],
  )

  // Custom pagination using shared component
  const renderPagination = React.useCallback((table: TanStackTable<Student>) => {
    return <DataTablePaginationCustom table={table} />
  }, [])

  // Custom row renderer with click handler for navigation
  const renderRow = React.useCallback(
    (row: Row<Student>, _table: TanStackTable<Student>) => {
      const handleRowClick = (e: React.MouseEvent<HTMLTableRowElement>) => {
        // Don't navigate if clicking directly on interactive elements
        const target = e.target as HTMLElement
        
        // Only prevent navigation for actual form controls and buttons
        if (
          target.tagName === 'BUTTON' ||
          target.tagName === 'INPUT' ||
          target.tagName === 'SELECT' ||
          target.tagName === 'A'
        ) {
          return
        }
        
        // Navigate to student details page
        const studentId = row.original.id
        navigate(`/students/details/${studentId}`)
      }

      const handleKeyDown = (e: React.KeyboardEvent<HTMLTableRowElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          e.stopPropagation()
          navigate(`/students/details/${row.original.id}`)
        }
      }

      return (
        <TableRow
          onClick={handleRowClick}
          onKeyDown={handleKeyDown}
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          role="button"
          tabIndex={0}
          style={{ pointerEvents: 'auto' }}
        >
          {row.getVisibleCells().map(cell => (
            <DataTableCell key={cell.id} cell={cell} />
          ))}
        </TableRow>
      )
    },
    [navigate],
  )

  return (
    <DataTable
      columns={studentColumns}
      data={data}
      enableSorting
      enablePagination
      enableFiltering
      enableGlobalFilter={false}
      showToolbar={true}
      renderToolbar={renderToolbar}
      renderPagination={renderPagination}
      bodyProps={{
        renderRow,
      }}
      tableOptions={{
        initialState: {
          pagination: {
            pageSize: 10,
          },
        },
      }}
    />
  )
}

