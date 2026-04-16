import * as React from 'react'
import { Card, CardContent, CardHeader, CardAction } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Tile } from '@/components/tile'
import { CircleDollarSign, FileText, ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-react'
import { baseColors, colors, statusVivid } from '@/theme/colors'
import type { Reimbursement, ReimbursementStatus } from '../types'

interface ReimbursementsTrackingProps {
  data: Reimbursement[]
  isLoading?: boolean
}

/**
 * Status badge colors using semantic tokens from theme.
 * `.base` → filled badge background, `.soft` → muted backgrounds.
 */
const statusStyles: Record<
  ReimbursementStatus,
  { color: string; bg: string }
> = {
  Approved: { bg: statusVivid.success.bg, color: statusVivid.success.color },
  Declined: { bg: statusVivid.danger.bg,  color: statusVivid.danger.color  },
  Pending:  { bg: statusVivid.warning.bg, color: statusVivid.warning.color },
}

/**
 * Responsive grid columns:
 * - Mobile / Tablet (< lg): 4 columns — Staff Name merges into Request ID, Proof merges into Amount
 * - Desktop (lg+):          6 columns — all columns separate
 */
const GRID_COLS =
  'grid-cols-[1fr_1fr_100px_100px] lg:grid-cols-[72px_1.2fr_1fr_120px_90px_110px]'

/** Sortable column keys */
type SortKey = 'requestId' | 'staffName' | 'amount' | 'dateSubmitted'
type SortDirection = 'asc' | 'desc'

export function ReimbursementsTracking({
  data,
  isLoading = false,
}: ReimbursementsTrackingProps) {
  const [timeRange, setTimeRange] = React.useState('this-week')
  const [sortKey, setSortKey] = React.useState<SortKey | null>(null)
  const [sortDirection, setSortDirection] = React.useState<SortDirection>('asc')

  /** Toggle sort when a column header is clicked */
  const handleSort = React.useCallback((key: SortKey) => {
    if (sortKey === key) {
      // Same column — toggle direction, or clear if already desc
      if (sortDirection === 'desc') {
        setSortKey(null)
        setSortDirection('asc')
      } else {
        setSortDirection('desc')
      }
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }, [sortKey, sortDirection])

  /** Filter reimbursements based on selected time range */
  const filteredData = React.useMemo(() => {
    if (!data || data.length === 0) return []

    switch (timeRange) {
      case 'this-week':
        return data.slice(0, 3)
      case 'last-week':
        return data.slice(3)
      case 'this-month':
      default:
        return data
    }
  }, [data, timeRange])

  /** Sort the filtered data */
  const sortedData = React.useMemo(() => {
    if (!sortKey) return filteredData

    const sorted = [...filteredData].sort((a, b) => {
      let comparison = 0
      switch (sortKey) {
        case 'requestId':
          comparison = a.requestId.localeCompare(b.requestId)
          break
        case 'staffName':
          comparison = a.staffName.localeCompare(b.staffName)
          break
        case 'amount':
          comparison = a.amount - b.amount
          break
        case 'dateSubmitted': {
          const dateA = new Date(a.dateSubmitted).getTime()
          const dateB = new Date(b.dateSubmitted).getTime()
          comparison = dateA - dateB
          break
        }
      }
      return sortDirection === 'desc' ? -comparison : comparison
    })

    return sorted
  }, [filteredData, sortKey, sortDirection])

  if (isLoading) {
    return (
      <Tile
        id="reimbursements-tracking-tile"
        layoutMode="block"
        background="transparent"
        padding={0}
        shadowed={false}
        className="h-full"
      >
        <Card className="h-full w-full pt-4 pb-2 flex flex-col gap-0">
          <CardHeader className="flex-shrink-0 pb-0">
            <h3 className="text-section-title">Reimbursements Tracking</h3>
            <CardAction>
              <Skeleton className="h-9 w-[110px]" />
            </CardAction>
          </CardHeader>
          <CardContent className="px-4 pt-2 pb-4 flex-1 min-h-0">
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </Tile>
    )
  }

  return (
    <Tile
      id="reimbursements-tracking-tile"
      layoutMode="block"
      background="transparent"
      padding={0}
      shadowed={false}
      className="h-full"
    >
      <Card className="h-full w-full pt-4 pb-2 flex flex-col gap-0">
        <CardHeader className="flex-shrink-0 pb-0">
          <h3 className="text-section-title">Reimbursements Tracking</h3>
          <CardAction>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[110px] bg-accent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this-week">This Week</SelectItem>
                <SelectItem value="last-week">Last Week</SelectItem>
                <SelectItem value="this-month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </CardAction>
        </CardHeader>

        <CardContent className="px-4 pt-2 pb-4 flex-1 min-h-0 overflow-auto">
          {/* ── Table header ── */}
          <div
            className={`grid ${GRID_COLS} gap-x-4 items-center px-3 py-3 border-b`}
            style={{ borderColor: colors.border.default }}
          >
            <SortHeader
              label="Request ID"
              active={sortKey === 'requestId'}
              direction={sortKey === 'requestId' ? sortDirection : undefined}
              onClick={() => handleSort('requestId')}
            />
            {/* Staff Name — desktop only */}
            <span className="hidden lg:flex">
              <SortHeader
                label="Staff Name"
                active={sortKey === 'staffName'}
                direction={sortKey === 'staffName' ? sortDirection : undefined}
                onClick={() => handleSort('staffName')}
              />
            </span>
            <SortHeader
              label="Amount"
              active={sortKey === 'amount'}
              direction={sortKey === 'amount' ? sortDirection : undefined}
              onClick={() => handleSort('amount')}
            />
            <SortHeader
              label="Date Submitted"
              active={sortKey === 'dateSubmitted'}
              direction={sortKey === 'dateSubmitted' ? sortDirection : undefined}
              onClick={() => handleSort('dateSubmitted')}
            />
            {/* Proof — desktop only */}
            <span className="hidden lg:block text-xs font-medium text-muted-foreground">
              Proof
            </span>
            <span className="text-xs font-medium text-muted-foreground">Status</span>
          </div>

          {/* ── Rows ── */}
          <div className="divide-y" style={{ borderColor: colors.border.subtle }}>
            {sortedData.map(item => (
              <div
                key={item.requestId}
                className={`grid ${GRID_COLS} gap-x-4 items-center px-3 py-5`}
              >
                {/* ── Request ID ── */}
                <div className="min-w-0">
                  <span
                    className="text-xs font-semibold"
                    style={{ color: baseColors.heading }}
                  >
                    {item.requestId}
                  </span>
                  {/* Staff info — shown here only on tablet/mobile */}
                  <div className="lg:hidden mt-0.5">
                    <p
                      className="text-[11px] font-medium truncate"
                      style={{ color: baseColors.heading }}
                    >
                      {item.staffName}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {item.department}
                    </p>
                  </div>
                </div>

                {/* ── Staff Name + Department — desktop only ── */}
                <div className="hidden lg:block min-w-0">
                  <p
                    className="text-xs font-medium truncate"
                    style={{ color: baseColors.heading }}
                  >
                    {item.staffName}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {item.department}
                  </p>
                </div>

                {/* ── Amount + Description ── */}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <CircleDollarSign
                      className="h-3.5 w-3.5 flex-shrink-0"
                      style={{ color: colors.text.muted }}
                    />
                    <span
                      className="text-xs font-semibold whitespace-nowrap"
                      style={{ color: baseColors.heading }}
                    >
                      ₹{item.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                      {item.description}
                    </p>
                  )}
                  {/* View File — shown here only on tablet/mobile */}
                  <a
                    href={item.proofUrl}
                    className="lg:hidden inline-flex items-center gap-1 text-[11px] mt-0.5"
                    style={{ color: baseColors.heading }}
                    onClick={e => e.preventDefault()}
                  >
                    <FileText
                      className="h-3 w-3 flex-shrink-0"
                      style={{ color: colors.text.muted }}
                    />
                    View File
                  </a>
                </div>

                {/* ── Date Submitted ── */}
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {item.dateSubmitted}
                </span>

                {/* ── Proof — desktop only chip with icon ── */}
                <a
                  href={item.proofUrl}
                  className="hidden lg:inline-flex items-center gap-1.5 text-xs rounded-md px-2 py-1 whitespace-nowrap w-fit"
                  style={{
                    color: baseColors.heading,
                    backgroundColor: colors.border.subtle,
                  }}
                  onClick={e => e.preventDefault()}
                >
                  <FileText
                    className="h-3.5 w-3.5 flex-shrink-0"
                    style={{ color: colors.text.muted }}
                  />
                  View File
                </a>

                {/* ── Status ── */}
                {item.status === 'Pending' ? (
                  <span className="flex items-center gap-2 whitespace-nowrap">
                    <button
                      className="text-xs font-medium"
                      style={{ color: colors.status.success.text }}
                      onClick={e => e.preventDefault()}
                    >
                      Approve
                    </button>
                    <button
                      className="text-xs font-medium"
                      style={{ color: colors.status.danger.text }}
                      onClick={e => e.preventDefault()}
                    >
                      Decline
                    </button>
                  </span>
                ) : (
                  <span
                    className="inline-flex h-6 items-center justify-center rounded-full px-3 text-xs font-medium whitespace-nowrap w-fit"
                    style={{
                      color: statusStyles[item.status].color,
                      backgroundColor: statusStyles[item.status].bg,
                    }}
                  >
                    {item.status}
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </Tile>
  )
}

/** Column header with sort icon — matches DataTableColumnHeader pattern */
function SortHeader({
  label,
  active,
  direction,
  onClick,
}: {
  label: string
  active?: boolean
  direction?: SortDirection
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      className="text-xs font-medium text-muted-foreground flex items-center gap-1 cursor-pointer hover:text-foreground transition-colors"
      onClick={onClick}
    >
      {label}
      {active && direction === 'asc' ? (
        <ArrowUp className="h-3 w-3" />
      ) : active && direction === 'desc' ? (
        <ArrowDown className="h-3 w-3" />
      ) : (
        <ChevronsUpDown className="h-3 w-3 opacity-50" />
      )}
    </button>
  )
}
