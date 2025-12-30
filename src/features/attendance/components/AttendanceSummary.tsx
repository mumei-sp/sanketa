import * as React from 'react'
import { TileWrapper, Tile } from '@/components/tile'
import { AttendanceSummaryCard } from './AttendanceSummaryCard'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar } from 'lucide-react'
import type { AttendanceRecord } from '../types'
import { getAllAttendanceStatistics } from '../utils/attendance-stats'
import { useIsMobile } from '@/hooks/use-mobile'
import { formatDateForDisplay } from '@/utils/date'

interface AttendanceSummaryProps {
  data: AttendanceRecord[]
}

type DayOption = 'today' | 'yesterday' | '2-days-ago' | '3-days-ago' | 'custom'

/**
 * Get date string for day option
 */
function getDateString(option: DayOption, customDate?: string): string {
  if (option === 'custom' && customDate) {
    return customDate
  }

  const date = new Date()
  switch (option) {
    case 'yesterday':
      date.setDate(date.getDate() - 1)
      break
    case '2-days-ago':
      date.setDate(date.getDate() - 2)
      break
    case '3-days-ago':
      date.setDate(date.getDate() - 3)
      break
    case 'today':
    default:
      // Use current date
      break
  }
  date.setHours(0, 0, 0, 0)
  return date.toISOString().split('T')[0]
}

/**
 * Get display text for custom date button
 */
function getCustomDateDisplayText(customDate: string | null): string {
  if (customDate) {
    return formatDateForDisplay(customDate)
  }
  return 'Select Date'
}

/**
 * Attendance Summary Container Component
 * Displays three summary cards (Students, Teachers, Staff) with day selector
 */
export function AttendanceSummary({ data }: AttendanceSummaryProps) {
  const isMobile = useIsMobile()
  const [selectedDay, setSelectedDay] = React.useState<DayOption>('today')
  const [customDate, setCustomDate] = React.useState<string>('')
  const [isCustomOpen, setIsCustomOpen] = React.useState(false)

  // Get the selected date string
  const selectedDate = React.useMemo(() => getDateString(selectedDay, customDate), [selectedDay, customDate])

  // Calculate statistics for all types based on selected date
  const statistics = React.useMemo(() => {
    return getAllAttendanceStatistics(data, selectedDate)
  }, [data, selectedDate])

  /**
   * Handle day option change
   */
  const handleDayChange = React.useCallback((value: string) => {
    const option = value as DayOption
    setSelectedDay(option)
    
    if (option === 'custom') {
      // If switching to custom and no custom date is set, use today's date as default
      if (!customDate) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        setCustomDate(today.toISOString().split('T')[0])
      }
      // Open the custom date picker
      setIsCustomOpen(true)
    }
  }, [customDate])

  /**
   * Handle custom date apply
   */
  const handleCustomDateApply = React.useCallback(() => {
    if (!customDate) {
      return
    }

    // Validate date
    const date = new Date(customDate)
    if (isNaN(date.getTime())) {
      return
    }

    setIsCustomOpen(false)
  }, [customDate])

  return (
    <div className="space-y-4">
      {/* Header with title and day selector */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-section-title text-foreground">Attendance Summary</h2>
        <div className="flex items-center gap-2">
          {/* Day selector dropdown */}
          <Select value={selectedDay} onValueChange={handleDayChange}>
            <SelectTrigger className="h-8 w-[140px] bg-accent text-foreground border-0 hover:bg-accent/80">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="2-days-ago">2 Days Ago</SelectItem>
              <SelectItem value="3-days-ago">3 Days Ago</SelectItem>
              <SelectItem value="custom">Custom Date</SelectItem>
            </SelectContent>
          </Select>

          {/* Custom date picker - only show when custom is selected */}
          {selectedDay === 'custom' && (
            <DropdownMenu open={isCustomOpen} onOpenChange={setIsCustomOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-md bg-accent text-foreground border-0 hover:bg-accent/80"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {getCustomDateDisplayText(customDate)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[280px] p-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="custom-date" className="text-body">
                      Select Date
                    </Label>
                    <Input
                      id="custom-date"
                      type="date"
                      value={customDate}
                      onChange={e => setCustomDate(e.target.value)}
                      className="h-8"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsCustomOpen(false)}
                      className="h-8"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleCustomDateApply}
                      disabled={!customDate}
                      className="h-8"
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Cards Grid - Fixed height of 204px to match chart height */}
      <div style={{ height: '204px' }}>
        <TileWrapper mode="grid" columns={12} gap={12} className="h-full">
          {/* Students Card */}
          <Tile
            id="attendance-summary-students"
            layoutMode="grid"
            width={isMobile ? 12 : 4}
            background="transparent"
            padding={0}
            heightPx="100%"
          >
            <AttendanceSummaryCard type="student" statistics={statistics.students} />
          </Tile>

          {/* Teachers Card */}
          <Tile
            id="attendance-summary-teachers"
            layoutMode="grid"
            width={isMobile ? 12 : 4}
            background="transparent"
            padding={0}
            heightPx="100%"
          >
            <AttendanceSummaryCard type="teacher" statistics={statistics.teachers} />
          </Tile>

          {/* Staff Card */}
          <Tile
            id="attendance-summary-staff"
            layoutMode="grid"
            width={isMobile ? 12 : 4}
            background="transparent"
            padding={0}
            heightPx="100%"
          >
            <AttendanceSummaryCard type="staff" statistics={statistics.staff} />
          </Tile>
        </TileWrapper>
      </div>
    </div>
  )
}

