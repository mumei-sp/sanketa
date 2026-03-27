import { Pencil, Eye, Printer, GraduationCap } from 'lucide-react'
import { text, border, background, accent } from '@/theme/colors'
import { spacing } from '@/config/spacing'
import type { ClassSection } from '../types'

interface TimetableToolbarProps {
  classSections: ClassSection[]
  selectedClassId: string
  onClassChange: (classId: string) => void
  isEditMode: boolean
  onToggleEditMode: () => void
  onPrint?: () => void
  isSaving?: boolean
}

/**
 * Toolbar for the timetable page.
 * Integrated class selector with icon, edit/view toggle, and print.
 * Designed to sit inside the Tile card as a header bar.
 */
export function TimetableToolbar({
  classSections,
  selectedClassId,
  onClassChange,
  isEditMode,
  onToggleEditMode,
  onPrint,
  isSaving,
}: TimetableToolbarProps) {
  return (
    <div
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-wrap"
      style={{ padding: `${spacing['3']} ${spacing['4']}` }}
    >
      {/* Left: Class selector with icon */}
      <div className="flex items-center gap-2.5">
        <div
          className="flex items-center justify-center w-8 h-8 rounded-lg"
          style={{ backgroundColor: accent.base }}
        >
          <GraduationCap className="w-4 h-4" style={{ color: text.heading }} />
        </div>
        <select
          value={selectedClassId}
          onChange={e => onClassChange(e.target.value)}
          className="text-sm font-semibold rounded-lg border-0 px-2 py-1.5 outline-none cursor-pointer"
          style={{
            color: text.heading,
            backgroundColor: 'transparent',
          }}
        >
          {classSections.map(cls => (
            <option key={cls.id} value={cls.id}>
              Class {cls.label}
            </option>
          ))}
        </select>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Print */}
        {onPrint && (
          <button
            type="button"
            onClick={onPrint}
            className="flex items-center gap-1.5 text-xs font-medium rounded-lg px-3 py-2 transition-all cursor-pointer hover:opacity-80"
            style={{
              borderColor: border.default,
              color: text.muted,
              backgroundColor: background.card,
              border: `1px solid ${border.default}`,
            }}
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print</span>
          </button>
        )}

        {/* Edit/View toggle */}
        <button
          type="button"
          onClick={onToggleEditMode}
          disabled={isSaving}
          className="flex items-center gap-1.5 text-xs font-semibold rounded-lg px-4 py-2 transition-all cursor-pointer hover:opacity-90"
          style={{
            backgroundColor: isEditMode ? text.heading : accent.base,
            color: isEditMode ? background.card : text.heading,
          }}
        >
          {isEditMode ? (
            <>
              <Eye className="w-3.5 h-3.5" />
              {isSaving ? 'Saving...' : 'Done Editing'}
            </>
          ) : (
            <>
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </>
          )}
        </button>
      </div>
    </div>
  )
}
