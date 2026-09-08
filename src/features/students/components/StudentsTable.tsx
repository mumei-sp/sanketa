import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { usePermissions } from '@/features/auth/PermissionContext'
import type { Table as TanStackTable, Row } from '@tanstack/react-table'
import { Plus, X, GraduationCap } from 'lucide-react'
import {
  DataTable,
  DataTableCell,
  MobileRecordCard,
  ListToolbar,
  ListToolbarSearch,
  TOOLBAR_CONTROL_HEIGHT,
  TOOLBAR_FILTER_CONTROL,
  TOOLBAR_PRIMARY_ACTION,
} from '@/components/table'
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
import { ClassPicker } from '@/components/shared/ClassPicker'
import { TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { PerformanceBadge } from './PerformanceBadge'
import { StatusBadge } from './StatusBadge'
import { AttendanceIndicator } from './AttendanceIndicator'
import { getInitials } from '@/utils/format'
import { DataTablePaginationCustom } from '@/components/table/DataTablePaginationCustom'
import { colors, withOpacity } from '@/theme/colors'
import { cn } from '@/lib/utils'

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
  // Unscoped: "may you enrol anywhere". Which class a new student lands in is
  // not known until the form is filled, so AddStudent makes the scoped check.
  const { can } = usePermissions()
  const canEnrol = can('students.create')
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
        <ListToolbar
          title="Students"
          search={
            <ListToolbarSearch
              placeholder="Search for a student"
              value={searchValue}
              onValueChange={handleSearchChange}
            />
          }
          filters={[
            {
              id: 'class',
              label: 'Class',
              isActive: selectedSections.length > 0,
              control: (
                /* Class filter pill: label on the left + ClassPicker trigger (gear). */
                <div
                  className={cn(
                    'flex min-w-0 items-center gap-1.5 rounded-md px-2.5',
                    TOOLBAR_CONTROL_HEIGHT,
                  )}
                  style={{
                    backgroundColor: withOpacity('var(--accent)', 0.35),
                    color: 'var(--heading)',
                  }}
                >
                  <span className="truncate text-xs font-medium">{filterLabel}</span>
                  <div className="flex shrink-0 items-center gap-1">
                    {selectedSections.length > 0 && (
                      <button
                        type="button"
                        onClick={clearSections}
                        className="tap-area flex size-[18px] items-center justify-center rounded transition-colors hover:bg-black/5"
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
                </div>
              ),
            },
            {
              id: 'status',
              label: 'Status',
              isActive: statusFilter !== 'all',
              control: (
                <Select value={statusFilter} onValueChange={handleStatusChange}>
                  <SelectTrigger
                    className={cn(
                      TOOLBAR_CONTROL_HEIGHT,
                      'w-[120px] bg-accent text-foreground border-0 hover:bg-accent/80',
                      TOOLBAR_FILTER_CONTROL,
                    )}
                  >
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="On Leave">On Leave</SelectItem>
                  </SelectContent>
                </Select>
              ),
            },
          ]}
          primaryAction={
            canEnrol ? (
              <Button
                onClick={() => navigate('/students/add')}
                className={cn(TOOLBAR_PRIMARY_ACTION, 'bg-primary hover:bg-primary/90 text-foreground')}
              >
                <Plus className="size-4" />
                Add Student
              </Button>
            ) : undefined
          }
        />
      )
    },
    [navigate, canEnrol, statusFilter, selectedSections, applySectionFilter, clearSections],
  )

  // Custom pagination using shared component
  const renderPagination = React.useCallback((table: TanStackTable<Student>) => {
    return <DataTablePaginationCustom table={table} />
  }, [])

  // Below `lg` the seven columns can't fit, so each student becomes a card.
  const renderMobileCard = React.useCallback(
    (row: Row<Student>) => {
      const student = row.original
      return (
        <MobileRecordCard
          media={
            <Avatar className="size-10">
              <AvatarImage src={student.avatarUrl} alt={student.name} />
              <AvatarFallback className="bg-muted text-muted-foreground">
                {getInitials(student.name ?? '')}
              </AvatarFallback>
            </Avatar>
          }
          title={student.name}
          subtitle={student.studentId}
          trailing={<StatusBadge status={student.status} />}
          fields={[
            { label: 'Class', value: student.class },
            { label: 'GPA', value: student.gpa.toFixed(1) },
            { label: 'Performance', value: <PerformanceBadge performance={student.performance} /> },
            { label: 'Attendance', value: <AttendanceIndicator value={student.percentage} /> },
          ]}
          onClick={() => navigate(`/students/details/${student.id}`)}
        />
      )
    },
    [navigate],
  )

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
      renderMobileCard={renderMobileCard}
      empty={{
        icon: <GraduationCap />,
        title: 'No students yet',
        description: 'Enrolled students will be listed here.',
      }}

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

