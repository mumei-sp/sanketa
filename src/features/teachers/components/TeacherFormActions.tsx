import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export interface TeacherFormActionsProps {
  onCancel: () => void
  onSave: () => void
  saveLabel?: string
  cancelLabel?: string
  className?: string
}

export function TeacherFormActions({
  onCancel,
  onSave,
  saveLabel = 'Save Changes',
  cancelLabel = 'Cancel',
  className,
}: TeacherFormActionsProps) {
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
