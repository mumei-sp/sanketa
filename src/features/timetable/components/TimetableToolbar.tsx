import * as React from 'react'
import { Pencil, Eye, Printer, GraduationCap, Copy } from 'lucide-react'
import { text, border, background } from '@/theme/colors'
import { spacing } from '@/config/spacing'
import type { ClassSection } from '../types'

interface CopySource {
  classSectionId: string
  label: string
}

interface TimetableToolbarProps {
  classSections: ClassSection[]
  selectedClassId: string
  onClassChange: (classId: string) => void
  isEditMode: boolean
  onToggleEditMode: () => void
  onPrint?: () => void
  isSaving?: boolean
  /** Classes that have timetables available to copy from (excluding current class) */
  copyableSources?: CopySource[]
  /** Called when user selects a class to copy timetable from */
  onCopyFrom?: (classSectionId: string) => void
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
  copyableSources = [],
  onCopyFrom,
}: TimetableToolbarProps) {
  const [showCopyDropdown, setShowCopyDropdown] = React.useState(false)
  const copyRef = React.useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  React.useEffect(() => {
    if (!showCopyDropdown) return
    function handleClick(e: MouseEvent) {
      if (copyRef.current && !copyRef.current.contains(e.target as Node)) {
        setShowCopyDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showCopyDropdown])
  return (
    <div
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-wrap"
      style={{ padding: `${spacing['3']} ${spacing['4']}` }}
    >
      {/* Left: Class selector with icon */}
      <div className="flex items-center gap-2.5">
        <div
          className="flex items-center justify-center rounded-full overflow-hidden flex-shrink-0"
          style={{
            backgroundColor: 'var(--accent)',
            width: '36px',
            height: '36px',
            minWidth: '36px',
            minHeight: '36px',
          }}
        >
          <GraduationCap className="w-4 h-4" style={{ color: 'var(--heading)' }} />
        </div>
        <select
          value={selectedClassId}
          onChange={e => onClassChange(e.target.value)}
          className="text-sm font-semibold rounded-lg border-0 px-2 py-1.5 outline-none cursor-pointer"
          style={{
            color: 'var(--heading)',
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

        {/* Copy from another class — only in edit mode */}
        {isEditMode && copyableSources.length > 0 && onCopyFrom && (
          <div ref={copyRef} className="relative">
            <button
              type="button"
              onClick={() => setShowCopyDropdown(prev => !prev)}
              className="flex items-center gap-1.5 text-xs font-medium rounded-lg px-3 py-2 transition-all cursor-pointer hover:opacity-80"
              style={{
                borderColor: border.default,
                color: text.muted,
                backgroundColor: background.card,
                border: `1px solid ${border.default}`,
              }}
            >
              <Copy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Copy from...</span>
            </button>
            {showCopyDropdown && (
              <div
                className="absolute right-0 top-full mt-1 z-50 min-w-[160px] rounded-lg shadow-lg py-1"
                style={{
                  backgroundColor: background.card,
                  border: `1px solid ${border.default}`,
                }}
              >
                {copyableSources.map(src => (
                  <button
                    key={src.classSectionId}
                    type="button"
                    className="w-full text-left text-xs px-3 py-2 cursor-pointer hover:opacity-80 transition-all"
                    style={{ color: text.body }}
                    onMouseEnter={e => {
                      ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--accent)'
                    }}
                    onMouseLeave={e => {
                      ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
                    }}
                    onClick={() => {
                      onCopyFrom(src.classSectionId)
                      setShowCopyDropdown(false)
                    }}
                  >
                    Class {src.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Edit/View toggle */}
        <button
          type="button"
          onClick={onToggleEditMode}
          disabled={isSaving}
          className="flex items-center gap-1.5 text-xs font-semibold rounded-lg px-4 py-2 transition-all cursor-pointer hover:opacity-90"
          style={{
            backgroundColor: isEditMode ? 'var(--heading)' : 'var(--accent)',
            color: isEditMode ? background.card : 'var(--heading)',
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
