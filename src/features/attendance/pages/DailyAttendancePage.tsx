import * as React from 'react'
import { useSearchParams } from 'react-router-dom'
import { CheckCircle, AlertTriangle, UserCheck, History, Download } from 'lucide-react'
import { StatusBanner } from '@/components/shared/StatusBanner'
import { colors, darken, baseColors, withOpacity } from '@/theme/colors'
import { spacing } from '@/config/spacing'
import { useDailyAttendance } from '../hooks/use-daily-attendance'
import { useAttendanceHistory } from '../hooks/use-attendance-history'
import { useSchoolConfig } from '@/config/SchoolConfigContext'
import { getClassLabels } from '@/utils/class-section-helpers'
import { ClassPicker } from '@/components/shared/ClassPicker'
import { AttendanceMarkingTable } from '../components/AttendanceMarkingTable'
import { AttendanceMarkingCards } from '../components/AttendanceMarkingCards'
import { AttendanceDailySummaryBar } from '../components/AttendanceDailySummaryBar'
import { AttendanceHistoryTable } from '../components/AttendanceHistoryTable'
import { DailyAttendanceSkeleton } from '../components/DailyAttendanceSkeleton'
import { Tile } from '@/components/tile'
import { AttendancePageLayout } from '../components/AttendancePageLayout'
import { getAttendanceBreadcrumbs } from '../utils/breadcrumbs'
import { generateCsv, downloadCsv } from '@/lib/csv'
import type { MarkableAttendanceStatus, AttendanceEntry } from '../types'

type ViewMode = 'mark' | 'history'

/** Get today's date as YYYY-MM-DD */
function getTodayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Format date for display */
function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

/**
 * DailyAttendancePage — mark and manage daily attendance.
 *
 * Route: /attendance/daily
 * Supports query params: ?class=9A&date=2035-03-25
 */
export function DailyAttendancePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [viewMode, setViewMode] = React.useState<ViewMode>('mark')

  // Available classes from school config
  const { config } = useSchoolConfig()
  const classes = React.useMemo(() => getClassLabels(config.classSections), [config.classSections])

  /**
   * `loadedClasses` is the multi-section workspace the teacher has "picked up"
   * via ClassPicker — e.g. [9A, 9B]. They can flip between these without
   * re-opening the picker. Picker manages this via its own localStorage key.
   */
  const [loadedClasses, setLoadedClasses] = React.useState<string[]>([])

  // Selected class and date from URL params or defaults.
  // If the URL class isn't in the loaded set, fall back to the first loaded
  // one (or, if nothing is loaded yet, the first class from config).
  const urlClass = searchParams.get('class')
  const selectedClass =
    urlClass && (loadedClasses.length === 0 || loadedClasses.includes(urlClass))
      ? urlClass
      : loadedClasses[0] ?? classes[0] ?? ''
  const selectedDate = searchParams.get('date') ?? getTodayStr()

  // Derived month/year for history
  const [histYear, histMonth] = React.useMemo(() => {
    const parts = selectedDate.split('-')
    return [parseInt(parts[0]), parseInt(parts[1]) - 1]
  }, [selectedDate])

  // Data hooks
  const {
    roster,
    existingSubmission,
    isLoading,
    error,
    saveAttendance,
    isSaving,
  } = useDailyAttendance(selectedClass, selectedDate)

  const {
    rows: historyRows,
    isLoading: historyLoading,
    refetch: refetchHistory,
  } = useAttendanceHistory(selectedClass, histYear, histMonth)

  // Local state for marking entries
  const [entries, setEntries] = React.useState<
    Record<string, { status: MarkableAttendanceStatus | undefined; note: string }>
  >({})

  // When roster or existing submission changes, initialize entries
  React.useEffect(() => {
    const initial: typeof entries = {}
    roster.forEach(student => {
      const existing = existingSubmission?.entries.find(e => e.studentId === student.id)
      initial[student.id] = {
        status: existing?.status,
        note: existing?.note ?? '',
      }
    })
    setEntries(initial)
  }, [roster, existingSubmission])

  // Handlers
  const handleClassChange = React.useCallback((cls: string) => {
    setSearchParams(prev => {
      prev.set('class', cls)
      return prev
    })
  }, [setSearchParams])

  const handleDateChange = React.useCallback((date: string) => {
    setSearchParams(prev => {
      prev.set('date', date)
      return prev
    })
  }, [setSearchParams])

  const handleStatusChange = React.useCallback((studentId: string, status: MarkableAttendanceStatus) => {
    setEntries(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], status, note: prev[studentId]?.note ?? '' },
    }))
  }, [])

  const handleNoteChange = React.useCallback((studentId: string, note: string) => {
    setEntries(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], note },
    }))
  }, [])

  const handleMarkAllPresent = React.useCallback(() => {
    setEntries(prev => {
      const next = { ...prev }
      Object.keys(next).forEach(id => {
        if (!next[id].status) {
          next[id] = { ...next[id], status: 'present' }
        }
      })
      return next
    })
  }, [])

  const handleSave = React.useCallback(async () => {
    const attendanceEntries: AttendanceEntry[] = Object.entries(entries)
      .filter(([, e]) => e.status !== undefined)
      .map(([studentId, e]) => ({
        studentId,
        status: e.status!,
        note: e.note || undefined,
      }))

    try {
      await saveAttendance(attendanceEntries, 'Admin')
      // Refresh history after save
      refetchHistory()
    } catch (err) {
      console.error('Failed to save attendance:', err)
    }
  }, [entries, saveAttendance, refetchHistory])

  const handleHistoryEdit = React.useCallback((date: string) => {
    setViewMode('mark')
    handleDateChange(date)
  }, [handleDateChange])

  // Derived state
  const allMarked = roster.length > 0 && roster.every(s => entries[s.id]?.status !== undefined)
  const entriesForSummary: Record<string, MarkableAttendanceStatus | undefined> = {}
  Object.entries(entries).forEach(([id, e]) => { entriesForSummary[id] = e.status })

  const handleExport = React.useCallback(() => {
    if (viewMode === 'mark') {
      const exportData = roster.map(student => ({
        rollNumber: student.rollNumber,
        name: student.name,
        status: entries[student.id]?.status ?? 'Not Marked',
        note: entries[student.id]?.note ?? '',
      }))
      const csv = generateCsv(exportData, [
        { key: 'rollNumber', header: 'Roll Number' },
        { key: 'name', header: 'Student Name' },
        { key: 'status', header: 'Status' },
        { key: 'note', header: 'Note' },
      ])
      downloadCsv(csv, `attendance-${selectedClass}-${selectedDate}.csv`)
    } else {
      const csv = generateCsv(historyRows as any, [
        { key: 'date', header: 'Date' },
        { key: 'present', header: 'Present' },
        { key: 'late', header: 'Late' },
        { key: 'absent', header: 'Absent' },
        { key: 'total', header: 'Total' },
        { key: 'submittedBy', header: 'Submitted By' },
        { key: 'isSubmitted', header: 'Submitted' },
      ])
      downloadCsv(csv, `attendance-history-${selectedClass}-${histYear}-${String(histMonth + 1).padStart(2, '0')}.csv`)
    }
  }, [viewMode, roster, entries, selectedClass, selectedDate, historyRows, histYear, histMonth])

  const breadcrumbs = React.useMemo(
    () => getAttendanceBreadcrumbs('details', 'Daily Attendance'),
    [],
  )

  return (
    <AttendancePageLayout
      title="Daily Attendance"
      breadcrumbs={breadcrumbs}
      isLoading={false}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['4'] }}>
        {/* ═══ TOOLBAR ═══ */}
        <div
          className="rounded-lg border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-wrap"
          style={{
            backgroundColor: colors.background.card,
            borderColor: colors.border.default,
            padding: spacing['3'],
          }}
        >
          <div className="flex items-center gap-3 flex-wrap">
            {/* ── Class workspace ─────────────────────────────────────
             *  1. Segmented chips show the classes the teacher has loaded
             *     (e.g. 9A, 9B). Clicking a chip switches the visible roster.
             *  2. The ClassPicker (gear icon) opens the tree cascader for
             *     adding / removing loaded classes. The picker owns its own
             *     localStorage so a teacher's workspace survives reloads.
             */}
            <div
              className="flex items-center gap-1 rounded-md border"
              style={{
                borderColor: colors.border.default,
                backgroundColor: colors.background.card,
                padding: 3,
              }}
            >
              {loadedClasses.length === 0 ? (
                <span
                  className="text-xs px-2"
                  style={{ color: colors.text.muted, paddingBlock: 4 }}
                >
                  Pick one or more classes
                </span>
              ) : (
                loadedClasses.map(cls => {
                  const active = cls === selectedClass
                  return (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => handleClassChange(cls)}
                      className="text-xs font-medium rounded transition-colors"
                      style={{
                        padding: `4px 10px`,
                        backgroundColor: active
                          ? withOpacity(baseColors.blue, 0.55)
                          : 'transparent',
                        color: colors.text.heading,
                      }}
                    >
                      {cls}
                    </button>
                  )
                })
              )}
              <ClassPicker
                storageKey="daily-attendance-workspace"
                mode="section"
                max={6}
                defaultSelected={classes.slice(0, 1)}
                onChange={setLoadedClasses}
              />
            </div>

            {/* Date picker */}
            <input
              type="date"
              value={selectedDate}
              onChange={e => handleDateChange(e.target.value)}
              className="text-sm rounded-md border px-3 py-1.5 outline-none"
              style={{
                borderColor: colors.border.default,
                color: colors.text.heading,
                backgroundColor: colors.background.card,
              }}
            />

            {/* Mark All Present button */}
            {viewMode === 'mark' && (
              <button
                type="button"
                onClick={handleMarkAllPresent}
                className="flex items-center gap-1.5 text-xs font-medium rounded-md px-3 py-1.5 transition-colors hover:opacity-80"
                style={{
                  backgroundColor: withOpacity(baseColors.pink, 0.4),
                  color: colors.text.heading,
                  border: `1px solid ${darken(baseColors.pink, 15)}`,
                }}
              >
                <UserCheck className="w-3.5 h-3.5" />
                Mark All Present
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
          {/* Export */}
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-1.5 text-xs font-medium rounded-md px-3 py-1.5 transition-colors hover:opacity-80 border"
            style={{
              borderColor: colors.border.default,
              color: colors.text.heading,
              backgroundColor: colors.background.card,
            }}
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>

          {/* View toggle */}
          <div
            className="flex items-center rounded-md border overflow-hidden"
            style={{ borderColor: colors.border.default }}
          >
            <button
              type="button"
              onClick={() => setViewMode('mark')}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 transition-colors"
              style={{
                backgroundColor: viewMode === 'mark' ? colors.text.heading : colors.background.card,
                color: viewMode === 'mark' ? colors.background.card : colors.text.muted,
              }}
            >
              <UserCheck className="w-3.5 h-3.5" />
              Mark
            </button>
            <button
              type="button"
              onClick={() => setViewMode('history')}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 transition-colors"
              style={{
                backgroundColor: viewMode === 'history' ? colors.text.heading : colors.background.card,
                color: viewMode === 'history' ? colors.background.card : colors.text.muted,
              }}
            >
              <History className="w-3.5 h-3.5" />
              History
            </button>
          </div>
          </div>
        </div>

        {/* ═══ STATUS BANNER ═══ */}
        {viewMode === 'mark' && selectedClass && existingSubmission ? (
          <StatusBanner icon={<CheckCircle className="w-4 h-4" />}>
            Submitted by <strong>{existingSubmission.submittedBy}</strong>
            {existingSubmission.submittedAt && (
              <> at {new Date(existingSubmission.submittedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</>
            )}
            {existingSubmission.lastEditedBy && (
              <> · Last edited by <strong>{existingSubmission.lastEditedBy}</strong></>
            )}
          </StatusBanner>
        ) : viewMode === 'mark' && selectedClass ? (
          <StatusBanner icon={<AlertTriangle className="w-4 h-4" />}>
            Attendance not yet submitted for <strong>{formatDisplayDate(selectedDate)}</strong>
          </StatusBanner>
        ) : null}

        {/* ═══ CONTENT ═══ */}
        {viewMode === 'mark' ? (
          <>
            {isLoading ? (
              <DailyAttendanceSkeleton />
            ) : error ? (
              <div className="flex items-center justify-center py-16">
                <span className="text-sm text-status-danger">{error}</span>
              </div>
            ) : (
              <>
                <Tile
                  id="attendance-marking-tile"
                  layoutMode="block"
                  background="card"
                  borderRadius="lg"
                  shadowed={false}
                  padding="p-6"
                  overflow="auto"
                >
                  {/* Desktop: table (hidden on mobile) */}
                  <div className="hidden lg:block">
                    <AttendanceMarkingTable
                      roster={roster}
                      entries={entries}
                      onStatusChange={handleStatusChange}
                      onNoteChange={handleNoteChange}
                      disabled={isSaving}
                    />
                  </div>

                  {/* Mobile/Tablet: cards (hidden on desktop) */}
                  <div className="block lg:hidden">
                    <AttendanceMarkingCards
                      roster={roster}
                      entries={entries}
                      onStatusChange={handleStatusChange}
                      onNoteChange={handleNoteChange}
                      disabled={isSaving}
                    />
                  </div>
                </Tile>

                {/* Summary bar — outside Tile so sticky works against viewport */}
                {roster.length > 0 && (
                  <AttendanceDailySummaryBar
                    entries={entriesForSummary}
                    totalStudents={roster.length}
                    isSaving={isSaving}
                    onSave={handleSave}
                    allMarked={allMarked}
                  />
                )}
              </>
            )}
          </>
        ) : (
          /* ═══ HISTORY VIEW ═══ */
          <Tile
            id="attendance-history-tile"
            layoutMode="block"
            background="card"
            borderRadius="lg"
            shadowed={false}
            padding="p-6"
            overflow="auto"
          >
            <AttendanceHistoryTable
              rows={historyRows}
              isLoading={historyLoading}
              onEdit={handleHistoryEdit}
              onMark={handleHistoryEdit}
            />
          </Tile>
        )}
      </div>
    </AttendancePageLayout>
  )
}

export default DailyAttendancePage
