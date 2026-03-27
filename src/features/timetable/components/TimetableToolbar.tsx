import { Pencil, Eye, Printer } from 'lucide-react'
import { text, border, background, accent } from '@/theme/colors'
import { spacing } from '@/config/spacing'
import type { ClassSection } from '../types'

interface TimetableToolbarProps {
  /** Available class sections */
  classSections: ClassSection[]
  /** Currently selected class section ID */
  selectedClassId: string
  /** Called when class selection changes */
  onClassChange: (classId: string) => void
  /** Whether edit mode is active */
  isEditMode: boolean
  /** Toggle edit mode */
  onToggleEditMode: () => void
  /** Called when print is requested */
  onPrint?: () => void
  /** Whether save is in progress */
  isSaving?: boolean
}

/**
 * Toolbar above the timetable grid.
 * Class selector, edit/view toggle, and print button.
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
      className="rounded-lg border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-wrap"
      style={{
        backgroundColor: background.card,
        borderColor: border.default,
        padding: spacing['3'],
      }}
    >
      {/* Left: Class selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <label
          className="text-xs font-medium"
          style={{ color: text.muted }}
        >
          Class
        </label>
        <select
          value={selectedClassId}
          onChange={e => onClassChange(e.target.value)}
          className="text-sm rounded-md border px-3 py-1.5 outline-none"
          style={{
            borderColor: border.default,
            color: text.heading,
            backgroundColor: background.card,
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
        {/* Edit/View toggle */}
        <button
          type="button"
          onClick={onToggleEditMode}
          disabled={isSaving}
          className="flex items-center gap-1.5 text-xs font-medium rounded-md px-3 py-1.5 transition-colors cursor-pointer"
          style={{
            backgroundColor: isEditMode ? text.heading : accent.base,
            color: isEditMode ? background.card : text.heading,
            border: `1px solid ${isEditMode ? text.heading : border.default}`,
          }}
        >
          {isEditMode ? (
            <>
              <Eye className="w-3.5 h-3.5" />
              View Mode
            </>
          ) : (
            <>
              <Pencil className="w-3.5 h-3.5" />
              Edit Timetable
            </>
          )}
        </button>

        {/* Print */}
        {onPrint && (
          <button
            type="button"
            onClick={onPrint}
            className="flex items-center gap-1.5 text-xs font-medium rounded-md px-3 py-1.5 transition-colors cursor-pointer border"
            style={{
              borderColor: border.default,
              color: text.heading,
              backgroundColor: background.card,
            }}
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
        )}
      </div>
    </div>
  )
}
