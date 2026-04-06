/**
 * HealthRecordDialog — Add / Edit dialog for student health records.
 *
 * When `record` is null, the dialog is in "create" mode.
 * When `record` is provided, fields are pre-filled for editing.
 */

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FormSection } from '@/components/form/FormSection'
import type { StudentHealthRecord } from '../../types'

interface HealthRecordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  record: StudentHealthRecord | null
  onSave: (data: Omit<StudentHealthRecord, 'id'>) => void
  isSaving: boolean
}

export function HealthRecordDialog({
  open,
  onOpenChange,
  record,
  onSave,
  isSaving,
}: HealthRecordDialogProps) {
  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [severity, setSeverity] = React.useState<'normal' | 'mild' | 'severe'>('normal')

  React.useEffect(() => {
    if (open) {
      setTitle(record?.title ?? '')
      setDescription(record?.description ?? '')
      setSeverity(record?.severity ?? 'normal')
    }
  }, [open, record])

  const canSave = title.trim().length > 0 && description.trim().length > 0

  const handleSubmit = React.useCallback(() => {
    if (!canSave) return
    onSave({
      title: title.trim(),
      description: description.trim(),
      severity,
    })
  }, [canSave, title, description, severity, onSave])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle>{record ? 'Edit Health Record' : 'Add Health Record'}</DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4">
          <FormSection title="Record Details" width={12}>
            <div className="space-y-2">
              <Label htmlFor="hr-title">Title <span className="text-destructive">*</span></Label>
              <Input
                id="hr-title"
                placeholder="e.g. Pollen Allergy"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hr-description">Description <span className="text-destructive">*</span></Label>
              <textarea
                id="hr-description"
                placeholder="Details about the health record..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>

            <div className="space-y-2">
              <Label>Severity</Label>
              <Select value={severity} onValueChange={v => setSeverity(v as typeof severity)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="mild">Mild</SelectItem>
                  <SelectItem value="severe">Severe</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </FormSection>
        </div>

        <DialogFooter className="px-6 pb-6 pt-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSave || isSaving}>
            {isSaving ? 'Saving...' : record ? 'Save Changes' : 'Add Record'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
