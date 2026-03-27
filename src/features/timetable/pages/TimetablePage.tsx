import * as React from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { Tile } from '@/components/tile'
import { Skeleton } from '@/components/ui/skeleton'
import { spacing } from '@/config/spacing'
import { border } from '@/theme/colors'
import { useSchoolConfig } from '@/config/SchoolConfigContext'
import { useAppToast } from '@/hooks/use-app-toast'
import { fetchClassSections } from '@/api/services/timetable-service'
import { useClassTimetable } from '../hooks/use-class-timetable'
import { TimetableGrid } from '../components/TimetableGrid'
import { TimetableToolbar } from '../components/TimetableToolbar'
import { TimetableSlotEditor } from '../components/TimetableSlotEditor'
import type { ClassSection, TimetableSlot } from '../types'

const breadcrumbs = [
  { label: 'Dashboard', href: '/' },
  { label: 'Timetable' },
]

export function TimetablePage() {
  const { config } = useSchoolConfig()
  const { showSuccess, showError } = useAppToast()

  // Class sections
  const [classSections, setClassSections] = React.useState<ClassSection[]>([])
  const [selectedClassId, setSelectedClassId] = React.useState('')

  React.useEffect(() => {
    fetchClassSections().then(sections => {
      setClassSections(sections)
      if (sections.length > 0 && !selectedClassId) {
        // Default to first higher grade class (9A)
        const defaultClass = sections.find(s => s.label === '9A') ?? sections[0]
        setSelectedClassId(defaultClass.id)
      }
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Timetable data
  const { timetable, isLoading, updateSlots, isSaving } = useClassTimetable(selectedClassId)

  // Edit mode
  const [isEditMode, setIsEditMode] = React.useState(false)
  const [editingSlots, setEditingSlots] = React.useState<TimetableSlot[]>([])

  // Sync editing slots when timetable loads or edit mode toggles
  React.useEffect(() => {
    if (timetable) {
      setEditingSlots([...timetable.slots])
    }
  }, [timetable])

  // Slot editor modal
  const [editorOpen, setEditorOpen] = React.useState(false)
  const [editingDay, setEditingDay] = React.useState(0)
  const [editingPeriodId, setEditingPeriodId] = React.useState('')
  const [editingCurrentSlot, setEditingCurrentSlot] = React.useState<TimetableSlot | null>(null)

  const handleSlotClick = React.useCallback((dayOfWeek: number, periodId: string, currentSlot: TimetableSlot | null) => {
    if (!isEditMode) return
    setEditingDay(dayOfWeek)
    setEditingPeriodId(periodId)
    setEditingCurrentSlot(currentSlot)
    setEditorOpen(true)
  }, [isEditMode])

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
          onClassChange={setSelectedClassId}
          isEditMode={isEditMode}
          onToggleEditMode={handleToggleEditMode}
          onPrint={handlePrint}
          isSaving={isSaving}
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
        ) : timetable ? (
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
            <button
              type="button"
              onClick={() => setIsEditMode(true)}
              className="text-sm font-medium text-text-heading underline cursor-pointer"
            >
              Create timetable
            </button>
          </div>
        )}
      </Tile>

      {/* Slot Editor Modal */}
      <TimetableSlotEditor
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
