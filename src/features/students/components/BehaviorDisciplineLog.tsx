import * as React from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardAction, CardContent } from '@/components/ui/card'
import { Edit, ArrowDown, ArrowUp } from 'lucide-react'
import type { BehaviorDisciplineRecord, BehaviorRecordType, BehaviorStatus } from '../types/behavior-discipline'
import { getBehaviorRecordsForStudent } from '@/data/mocks/behavior-discipline'
import { BehaviorDisciplineEditSheet } from './BehaviorDisciplineEditSheet'
import { baseColors } from '@/theme/colors'

const TYPE_COLORS: Record<BehaviorRecordType, string> = {
  'Positive Note': baseColors.blue,
  'Minor Issue': '#F59E0B',
  'Major Issue': '#EF4444',
}

const STATUS_VARIANTS: Record<BehaviorStatus, 'default' | 'secondary' | 'outline'> = {
  'Record Recognition': 'default',
  'Recognition Recorded': 'secondary',
  'Issue Warning': 'outline',
  'Parent Notified': 'secondary',
  'Pending Review': 'outline',
}

interface BehaviorDisciplineLogProps {
  studentId: string
  isLoading?: boolean
}

/**
 * Behavior & Discipline Log component for student details
 * Displays a table of behavior records (positive notes, minor/major issues) with date, type, details, reporter, and status
 */
export function BehaviorDisciplineLog({
  studentId,
  isLoading = false,
}: BehaviorDisciplineLogProps) {
  const initialRecords = React.useMemo(
    () => getBehaviorRecordsForStudent(studentId ?? ''),
    [studentId],
  )
  const [records, setRecords] = React.useState<BehaviorDisciplineRecord[]>(initialRecords)
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [dateSort, setDateSort] = React.useState<'recent' | 'oldest'>('recent')

  React.useEffect(() => {
    setRecords(getBehaviorRecordsForStudent(studentId ?? ''))
  }, [studentId])

  const handleSave = React.useCallback((updated: BehaviorDisciplineRecord[]) => {
    setRecords(updated)
  }, [])

  const baseRecords = records.length > 0 ? records : initialRecords

  const displayRecords = React.useMemo(() => {
    const sorted = [...baseRecords]
    sorted.sort((a, b) => {
      const parseDate = (d: string) => {
        if (d === '—') return new Date(0)
        const parsed = new Date(d)
        return isNaN(parsed.getTime()) ? new Date(0) : parsed
      }
      const dateA = parseDate(a.date).getTime()
      const dateB = parseDate(b.date).getTime()
      return dateSort === 'recent' ? dateB - dateA : dateA - dateB
    })
    return sorted
  }, [baseRecords, dateSort])

  const toggleDateSort = React.useCallback(() => {
    setDateSort((prev) => (prev === 'recent' ? 'oldest' : 'recent'))
  }, [])

  if (isLoading) {
    return (
      <Card className="pt-6 pb-6">
        <CardHeader>
          <h3 className="text-section-title">Behavior & Discipline Log</h3>
        </CardHeader>
        <CardContent className="px-6 pt-0">
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="pt-6 pb-6">
      <CardHeader>
        <h3 className="text-section-title">Behavior & Discipline Log</h3>
        <CardAction>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSheetOpen(true)}
            className="h-8"
          >
            <Edit className="h-4 w-4 mr-1.5" />
            Edit
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="px-6 pt-0 pb-4">
        {displayRecords.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            No behavior or discipline records yet.
          </p>
        ) : (
          <div className="overflow-x-auto -mx-6 px-6 min-w-0">
            <div className="space-y-2 min-h-[120px] min-w-[480px]">
              {/* Table header row */}
              <div className="grid grid-cols-4 gap-2 text-xs font-medium text-muted-foreground pb-2 border-b border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto py-1 px-0 justify-start gap-1 font-medium text-muted-foreground hover:text-foreground"
                onClick={toggleDateSort}
              >
                Date
                {dateSort === 'recent' ? (
                  <ArrowDown className="h-3.5 w-3.5" />
                ) : (
                  <ArrowUp className="h-3.5 w-3.5" />
                )}
              </Button>
              <span>Type & Details</span>
              <span>Reported By</span>
              <span>Status/Action</span>
            </div>
            {/* Data rows */}
            {displayRecords.map((record) => (
              <div
                key={record.id}
                className="grid grid-cols-4 gap-2 items-start py-2 border-b border-border last:border-0 text-sm"
              >
                <span className="text-muted-foreground">{record.date}</span>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span
                    className="font-medium"
                    style={{ color: TYPE_COLORS[record.type] || baseColors.heading }}
                  >
                    {record.type}
                  </span>
                  <span className="text-muted-foreground text-xs">{record.details}</span>
                </div>
                <span className="text-muted-foreground text-xs">{record.reportedBy}</span>
                <Button
                  variant={STATUS_VARIANTS[record.status] ?? 'outline'}
                  size="sm"
                  className="h-7 text-xs font-normal w-fit"
                >
                  {record.status}
                </Button>
              </div>
            ))}
            </div>
          </div>
        )}
      </CardContent>
      <BehaviorDisciplineEditSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        records={records}
        onSave={handleSave}
      />
    </Card>
  )
}
