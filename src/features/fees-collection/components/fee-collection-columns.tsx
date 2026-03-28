import type { ColumnDef, Row, Table } from '@tanstack/react-table'
import { CreditCard, Receipt, Clock } from 'lucide-react'
import { DataTableColumnHeader } from '@/components/table/header/DataTableColumnHeader'
import type { FeeCollectionRecord, FeeStatus } from '@/features/fees-collection/types'
import { baseColors, status, darken, background, accent, text } from '@/theme/colors'

export interface FeeTableActions {
  onPay: (record: FeeCollectionRecord) => void
  onViewReceipt: (record: FeeCollectionRecord) => void
  onViewHistory: (record: FeeCollectionRecord) => void
}

const STATUS_STYLES: Record<FeeStatus, { color: string; bg: string; border?: string }> = {
  Paid: { color: background.card, bg: status.success.base },
  Pending: { color: baseColors.heading, bg: baseColors.pink, border: darken(baseColors.pink, 20) },
  'Partially Paid': { color: baseColors.heading, bg: baseColors.blue, border: darken(baseColors.blue, 15) },
  Overdue: { color: background.card, bg: status.danger.base },
}

/** Check if this row is the first of a student group in the visible (paginated) rows */
function isFirstOfStudentGroup(
  row: Row<FeeCollectionRecord>,
  table: Table<FeeCollectionRecord>,
): boolean {
  const allRows = table.getRowModel().rows
  const visualIndex = allRows.findIndex((r) => r.id === row.id)
  if (visualIndex <= 0) return true
  return allRows[visualIndex - 1].original.studentId !== row.original.studentId
}

/**
 * Build a group-aware sortingFn.
 * - Same student → return 0 (preserve category order)
 * - Different student → compare using each student's FIRST record value
 */
function makeGroupSortFn(
  firstRecords: Map<string, FeeCollectionRecord>,
  columnId: keyof FeeCollectionRecord,
) {
  return (rowA: Row<FeeCollectionRecord>, rowB: Row<FeeCollectionRecord>) => {
    const idA = rowA.original.studentId
    const idB = rowB.original.studentId

    // Same student: keep original category order
    if (idA === idB) return 0

    // Different students: compare by first record's value for this column
    const recA = firstRecords.get(idA)!
    const recB = firstRecords.get(idB)!
    const aVal = recA[columnId]
    const bVal = recB[columnId]

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return aVal - bVal
    }
    if (columnId === 'dueDate') {
      return new Date(String(aVal)).getTime() - new Date(String(bVal)).getTime()
    }
    return String(aVal).localeCompare(String(bVal))
  }
}

/**
 * Creates fee collection columns with group-aware sorting.
 * Each column's sortingFn keeps same-student rows together.
 */
export function createFeeCollectionColumns(
  firstRecords: Map<string, FeeCollectionRecord>,
  actions?: FeeTableActions,
): ColumnDef<FeeCollectionRecord>[] {
  const cols: ColumnDef<FeeCollectionRecord>[] = [
    {
      accessorKey: 'studentName',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Student" />,
      cell: ({ row, table }) => {
        if (!isFirstOfStudentGroup(row, table as Table<FeeCollectionRecord>)) {
          return <span />
        }

        const record = row.original
        return (
          <div className="flex items-center gap-2">
            <span
              className="text-[11px] font-semibold px-1.5 py-0.5 rounded"
              style={{ backgroundColor: baseColors.blue, color: baseColors.heading }}
            >
              {record.studentId}
            </span>
            <span className="text-xs font-medium text-foreground">
              {record.studentName}
            </span>
          </div>
        )
      },
      sortingFn: makeGroupSortFn(firstRecords, 'studentName'),
      enableSorting: true,
      filterFn: (row, _id, value) => {
        if (!value) return true
        const search = (value as string).toLowerCase()
        return (
          row.original.studentName.toLowerCase().includes(search) ||
          row.original.studentId.toLowerCase().includes(search)
        )
      },
    },
    {
      accessorKey: 'class',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Class" />,
      cell: ({ row, table }) => {
        if (!isFirstOfStudentGroup(row, table as Table<FeeCollectionRecord>)) {
          return <span />
        }

        return <span className="text-xs text-muted-foreground">{row.original.class}</span>
      },
      sortingFn: makeGroupSortFn(firstRecords, 'class'),
      enableSorting: true,
      filterFn: (row, _id, value) => {
        if (value === 'all' || !value) return true
        return row.original.class === value
      },
    },
    {
      accessorKey: 'feeCategory',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Fee Category" />,
      cell: ({ row }) => (
        <span className="text-xs text-foreground">{row.original.feeCategory}</span>
      ),
      sortingFn: makeGroupSortFn(firstRecords, 'feeCategory'),
      enableSorting: true,
    },
    {
      accessorKey: 'totalAmount',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Total Amount" />,
      cell: ({ row }) => (
        <span className="text-xs font-semibold" style={{ color: baseColors.heading }}>
          ₹{row.original.totalAmount.toLocaleString('en-IN')}
        </span>
      ),
      sortingFn: makeGroupSortFn(firstRecords, 'totalAmount'),
      enableSorting: true,
    },
    {
      accessorKey: 'dueDate',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Due Date" />,
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{row.original.dueDate}</span>
      ),
      sortingFn: makeGroupSortFn(firstRecords, 'dueDate'),
      enableSorting: true,
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const feeStatus = row.original.status
        const style = STATUS_STYLES[feeStatus]
        return (
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium"
            style={{
              color: style.color,
              backgroundColor: style.bg,
              ...(style.border ? { border: `1px solid ${style.border}` } : {}),
            }}
          >
            {feeStatus}
          </span>
        )
      },
      sortingFn: makeGroupSortFn(firstRecords, 'status'),
      enableSorting: true,
      filterFn: (row, _id, value) => {
        if (value === 'all' || !value) return true
        return row.original.status === value
      },
    },
  ]

  // Actions column (when callbacks provided)
  if (actions) {
    cols.push({
      id: 'actions',
      header: '',
      cell: ({ row, table }) => {
        const record = row.original
        const isFirst = isFirstOfStudentGroup(row, table as Table<FeeCollectionRecord>)

        return (
          <div className="flex items-center gap-1.5">
            {record.status !== 'Paid' ? (
              <button
                type="button"
                onClick={e => { e.stopPropagation(); actions.onPay(record) }}
                className="flex items-center gap-1 text-[11px] font-semibold rounded-full px-2.5 py-1 cursor-pointer transition-opacity"
                style={{ backgroundColor: text.heading, color: background.card }}
              >
                <CreditCard className="w-3 h-3" />
                Pay
              </button>
            ) : record.transactionId ? (
              <button
                type="button"
                onClick={e => { e.stopPropagation(); actions.onViewReceipt(record) }}
                className="flex items-center gap-1 text-[11px] font-medium rounded-full px-2.5 py-1 cursor-pointer"
                style={{ backgroundColor: accent.base, color: text.heading }}
              >
                <Receipt className="w-3 h-3" />
                Receipt
              </button>
            ) : null}
            {isFirst && (
              <button
                type="button"
                onClick={e => { e.stopPropagation(); actions.onViewHistory(record) }}
                className="flex items-center gap-1 text-[11px] font-medium rounded-full px-2.5 py-1 cursor-pointer"
                style={{ backgroundColor: accent.base, color: text.heading }}
              >
                <Clock className="w-3 h-3" />
                History
              </button>
            )}
          </div>
        )
      },
      size: 180,
      enableSorting: false,
    })
  }

  return cols
}
