import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { text, border, background } from '@/theme/colors'
import { spacing } from '@/config/spacing'
import { subjects } from '@/data/mocks/timetable'
import { teachersData } from '@/data/mocks/teachers'
import type { TimetableSlot } from '../types'
import { DAY_LABELS } from '../types'

interface TimetableSlotEditorProps {
  /** Whether the dialog is open */
  open: boolean
  /** Close handler */
  onOpenChange: (open: boolean) => void
  /** Day of week being edited */
  dayOfWeek: number
  /** Period ID being edited */
  periodId: string
  /** Period label for display */
  periodLabel: string
  /** Current slot data (null if empty slot) */
  currentSlot: TimetableSlot | null
  /** Called when save is clicked with the new slot data */
  onSave: (slot: TimetableSlot) => void
  /** Called when slot should be cleared */
  onClear?: () => void
}

/**
 * Modal for editing a single timetable slot.
 * Subject dropdown, teacher dropdown, room input.
 */
export function TimetableSlotEditor({
  open,
  onOpenChange,
  dayOfWeek,
  periodId,
  periodLabel,
  currentSlot,
  onSave,
  onClear,
}: TimetableSlotEditorProps) {
  const [subjectId, setSubjectId] = React.useState('')
  const [teacherId, setTeacherId] = React.useState('')
  const [room, setRoom] = React.useState('')

  // Sync state when slot changes
  React.useEffect(() => {
    if (open) {
      setSubjectId(currentSlot?.subjectId ?? '')
      setTeacherId(currentSlot?.teacherId ?? '')
      setRoom(currentSlot?.room ?? '')
    }
  }, [open, currentSlot])

  const selectedSubject = subjects.find(s => s.id === subjectId)
  const selectedTeacher = teachersData.find(t => t.id === teacherId)

  const handleSave = () => {
    if (!subjectId || !teacherId) return

    onSave({
      dayOfWeek,
      periodId,
      subjectId,
      subjectName: selectedSubject?.name ?? '',
      teacherId,
      teacherName: selectedTeacher
        ? `${selectedTeacher.firstName} ${selectedTeacher.lastName}`
        : '',
      room: room || undefined,
    })
    onOpenChange(false)
  }

  const inputStyle = {
    borderColor: border.default,
    color: text.heading,
    backgroundColor: background.card,
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle style={{ color: text.heading }}>
            {DAY_LABELS[dayOfWeek]} — {periodLabel}
          </DialogTitle>
        </DialogHeader>

        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['4'] }}>
          {/* Subject */}
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: text.muted }}>
              Subject
            </label>
            <select
              value={subjectId}
              onChange={e => setSubjectId(e.target.value)}
              className="w-full text-sm rounded-md border px-3 py-2 outline-none"
              style={inputStyle}
            >
              <option value="">Select subject...</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Teacher */}
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: text.muted }}>
              Teacher
            </label>
            <select
              value={teacherId}
              onChange={e => setTeacherId(e.target.value)}
              className="w-full text-sm rounded-md border px-3 py-2 outline-none"
              style={inputStyle}
            >
              <option value="">Select teacher...</option>
              {teachersData.map(t => (
                <option key={t.id} value={t.id}>
                  {t.firstName} {t.lastName}
                </option>
              ))}
            </select>
          </div>

          {/* Room */}
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: text.muted }}>
              Room / Location
            </label>
            <input
              type="text"
              value={room}
              onChange={e => setRoom(e.target.value)}
              placeholder="e.g., Room 201, Lab 3, Ground"
              className="w-full text-sm rounded-md border px-3 py-2 outline-none"
              style={inputStyle}
            />
          </div>
        </div>

        <DialogFooter className="flex-row items-center justify-between sm:justify-between">
          {currentSlot && onClear && (
            <button
              type="button"
              onClick={() => { onClear(); onOpenChange(false) }}
              className="text-xs font-medium cursor-pointer"
              style={{ color: text.muted }}
            >
              Clear slot
            </button>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!subjectId || !teacherId}
              className="text-sm"
              style={{
                backgroundColor: text.heading,
                color: background.card,
              }}
            >
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
