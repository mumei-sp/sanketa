import * as React from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { Tile } from '@/components/tile'
import { Skeleton } from '@/components/ui/skeleton'
import { spacing } from '@/config/spacing'
import { border } from '@/theme/colors'
import { useSchoolConfig } from '@/config/SchoolConfigContext'
import { useAppToast } from '@/hooks/use-app-toast'
import {
  fetchAllClassTimetables,
  fetchClassSections,
  fetchClassTimetable,
} from '@/api/services/timetable-service'
import { useClassTimetable } from '../hooks/use-class-timetable'
import { TimetableGrid } from '../components/TimetableGrid'
import { TimetableToolbar } from '../components/TimetableToolbar'
import { usePermissions } from '@/features/auth/PermissionContext'
import { TimetableSlotFormSheet } from '../components/TimetableSlotFormSheet'
import type { TimetableSlot } from '../types'

const breadcrumbs = [
  { label: 'Dashboard', href: '/' },
  { label: 'Timetable' },
]

export function TimetablePage() {
  const { config } = useSchoolConfig()
  const { showSuccess, showError } = useAppToast()

  /**
   * The sections this caller may look at.
   *
   * Asked of the service rather than taken from `config.classSections`, which
   * is every section the school has. Scoping the service was not enough on its
   * own: the grid honoured it and came back empty, while the picker beside it
   * still listed all nineteen classes and offered a parent her way into each.
   *
   * The labels still come from the config, because that is where a section's
   * display name lives; the service only says which ids are hers.
   */
  const [visibleIds, setVisibleIds] = React.useState<string[] | null>(null)

  React.useEffect(() => {
    let cancelled = false
    void fetchClassSections()
      .then(sections => {
        if (!cancelled) setVisibleIds(sections.map(section => section.id))
      })
      .catch(() => {
        // Nothing, not everything: a failed scope read must not open the list.
        if (!cancelled) setVisibleIds([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  const classSections = React.useMemo(
    () =>
      visibleIds === null
        ? []
        : config.classSections.filter(section => visibleIds.includes(section.id)),
    [config.classSections, visibleIds],
  )

  /**
   * Which class is on screen — derived, so it cannot name one that is not on
   * the list.
   *
   * Stored as "what the user picked" rather than "what is selected", because
   * the sections arrive asynchronously: state seeded before they land would
   * hold `''` for ever, and an effect that corrected it afterwards would be a
   * second source of truth for the same question.
   *
   * `9A` is only a preference for where staff start. A family has one section
   * and it is theirs, so falling through to the first visible one serves both
   * — where the old hardcoded `9A` showed a parent an empty grid for a class
   * her child is not in.
   */
  const [pickedClassId, setPickedClassId] = React.useState<string | null>(null)
  const selectedClassId = React.useMemo(() => {
    if (pickedClassId && classSections.some(section => section.id === pickedClassId)) {
      return pickedClassId
    }
    return (classSections.find(s => s.label === '9A') ?? classSections[0])?.id ?? ''
  }, [pickedClassId, classSections])

  // Track which classes have timetables (for "Copy from..." feature)
  const [classesWithTimetables, setClassesWithTimetables] = React.useState<
    { classSectionId: string; label: string }[]
  >([])

  React.useEffect(() => {
    fetchAllClassTimetables().then(timetables => {
      const withLabels = timetables
        .map(t => {
          const cls = classSections.find(c => c.id === t.classSectionId)
          return cls ? { classSectionId: t.classSectionId, label: cls.label } : null
        })
        .filter(Boolean) as { classSectionId: string; label: string }[]
      setClassesWithTimetables(withLabels)
    })
  }, [classSections])

  // Timetable data
  const { timetable, isLoading, updateSlots, isSaving } = useClassTimetable(selectedClassId)

  // Edit mode
  const { can } = usePermissions()
  // Not scoped: a timetable belongs to the school's schedule, not to whoever
  // teaches in it, so there is no per-class narrowing to apply here.
  const canManage = can('timetable.manage')
  const [isEditMode, setIsEditMode] = React.useState(false)
  const [editingSlots, setEditingSlots] = React.useState<TimetableSlot[]>([])

  // Sync editing slots when timetable loads or class changes
  React.useEffect(() => {
    setEditingSlots(timetable ? [...timetable.slots] : [])
  }, [timetable])

  // Slot editor modal
  const [editorOpen, setEditorOpen] = React.useState(false)
  const [editingDay, setEditingDay] = React.useState(0)
  const [editingPeriodId, setEditingPeriodId] = React.useState('')
  const [editingCurrentSlot, setEditingCurrentSlot] = React.useState<TimetableSlot | null>(null)

  const handleSlotClick = React.useCallback((dayOfWeek: number, periodId: string, currentSlot: TimetableSlot | null) => {
    // Edit mode is unreachable without the permission, but the grid is a
    // separate component and a stale `isEditMode` should not become a way in.
    if (!isEditMode || !canManage) return
    setEditingDay(dayOfWeek)
    setEditingPeriodId(periodId)
    setEditingCurrentSlot(currentSlot)
    setEditorOpen(true)
  }, [isEditMode, canManage])

  const handleSlotSave = React.useCallback((newSlot: TimetableSlot) => {
    setEditingSlots(prev => {
      // Remove existing slot for this day/period
      const filtered = prev.filter(
        s => !(s.dayOfWeek === newSlot.dayOfWeek && s.periodId === newSlot.periodId),
      )
      return [...filtered, newSlot]
    })
  }, [])

  const handleSlotClear = React.useCallback(() => {
    setEditingSlots(prev =>
      prev.filter(
        s => !(s.dayOfWeek === editingDay && s.periodId === editingPeriodId),
      ),
    )
  }, [editingDay, editingPeriodId])

  const handleToggleEditMode = React.useCallback(async () => {
    if (isEditMode) {
      // Leaving edit mode — save changes
      try {
        await updateSlots(editingSlots)
        showSuccess('Timetable saved', { description: 'Changes have been applied.' })
      } catch {
        showError('Failed to save timetable')
      }
    }
    setIsEditMode(prev => !prev)
  }, [isEditMode, editingSlots, updateSlots, showSuccess, showError])

  const handleCopyFrom = React.useCallback(async (sourceClassId: string) => {
    try {
      const sourceTimetable = await fetchClassTimetable(sourceClassId)
      if (sourceTimetable) {
        setEditingSlots([...sourceTimetable.slots])
        const sourceLabel = classSections.find(c => c.id === sourceClassId)?.label ?? ''
        showSuccess('Timetable copied', { description: `Loaded slots from Class ${sourceLabel}. Save to apply.` })
      }
    } catch {
      showError('Failed to copy timetable')
    }
  }, [classSections, showSuccess, showError])

  // Classes available to copy from (exclude current class)
  const copyableSources = React.useMemo(
    () => classesWithTimetables.filter(c => c.classSectionId !== selectedClassId),
    [classesWithTimetables, selectedClassId],
  )

  const handlePrint = React.useCallback(() => {
    window.print()
  }, [])

  // Get the period label for the editor title
  const editingPeriodLabel = config.periods.find(p => p.id === editingPeriodId)?.label ?? ''

  // Current display slots (editing slots if in edit mode, timetable slots otherwise)
  const displaySlots = isEditMode ? editingSlots : (timetable?.slots ?? [])

  const selectedLabel = classSections.find(c => c.id === selectedClassId)?.label ?? ''

  return (
    <div className="space-y-4">
      <PageHeader
        title="Timetable"
        breadcrumbs={breadcrumbs}
      />

      <Tile
        id="timetable-tile"
        layoutMode="block"
        background="card"
        borderRadius="lg"
        shadowed={false}
        padding="p-0"
        overflow="auto"
      >
        {/* Toolbar — integrated inside the Tile as header */}
        <TimetableToolbar
          classSections={classSections}
          selectedClassId={selectedClassId}
          onClassChange={setPickedClassId}
          isEditMode={isEditMode}
          canManage={canManage}
          onToggleEditMode={handleToggleEditMode}
          onPrint={handlePrint}
          isSaving={isSaving}
          copyableSources={copyableSources}
          onCopyFrom={handleCopyFrom}
        />

        {/* Divider */}
        <div style={{ height: '1px', backgroundColor: border.default }} />

        {/* Content */}
        {isLoading ? (
          <div style={{ padding: spacing['6'] }}>
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          </div>
        ) : (timetable || isEditMode) ? (
          <div style={{ padding: spacing['3'] }}>
            <TimetableGrid
              periods={config.periods}
              slots={displaySlots}
              schoolDays={config.schoolDays}
              isEditMode={isEditMode}
              onSlotClick={handleSlotClick}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-text-muted mb-2">
              No timetable configured for Class {selectedLabel}
            </p>
            {canManage && (
              <button
                type="button"
                onClick={() => setIsEditMode(true)}
                className="text-sm font-medium text-text-heading underline cursor-pointer"
              >
                Create timetable
              </button>
            )}
          </div>
        )}
      </Tile>

      {/* Slot Editor Modal */}
      <TimetableSlotFormSheet
        open={editorOpen}
        onOpenChange={setEditorOpen}
        dayOfWeek={editingDay}
        periodId={editingPeriodId}
        periodLabel={editingPeriodLabel}
        currentSlot={editingCurrentSlot}
        onSave={handleSlotSave}
        onClear={handleSlotClear}
      />
    </div>
  )
}

export default TimetablePage
