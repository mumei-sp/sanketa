import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export interface StudentFormActionsProps {
  /** Cancel button click handler */
  onCancel: () => void
  /** Save button click handler */
  onSave: () => void
  /** Save button label (default: "Save Changes") */
  saveLabel?: string
  /** Cancel button label (default: "Cancel") */
  cancelLabel?: string
  /** Additional className */
  className?: string
}

/**
 * StudentFormActions - Reusable form action buttons component
 * 
 * Eliminates duplication of form action button structure across AddStudent and EditStudent pages
 * 
 * @example
 * ```tsx
 * <StudentFormActions
 *   onCancel={() => navigate(-1)}
 *   onSave={handleSaveClick}
 *   saveLabel="Save & Add Student"
 * />
 * ```
 */
export function StudentFormActions({
  onCancel,
  onSave,
  saveLabel = 'Save Changes',
  cancelLabel = 'Cancel',
  className,
}: StudentFormActionsProps) {
  return (
    <>
      <Separator />
      <div className={`flex items-center justify-end gap-3 ${className || ''}`}>
        <Button type="button" variant="outline" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button type="button" onClick={onSave}>
          {saveLabel}
        </Button>
      </div>
    </>
  )
}

