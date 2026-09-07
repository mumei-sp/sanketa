/**
 * BehaviorFormSheet — Add / Edit panel for student behavior log entries.
 */

import * as React from 'react'
import { FormSheet } from '@/components/form/FormSheet'
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
import type { StudentBehaviorEntry, BehaviorType } from '../../types'

function getTodayStr(): string {
  const d = new Date()
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

interface BehaviorFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  record: StudentBehaviorEntry | null
  onSave: (data: Omit<StudentBehaviorEntry, 'id'>) => void
  isSaving: boolean
}

export function BehaviorFormSheet({
  open,
  onOpenChange,
  record,
  onSave,
  isSaving,
}: BehaviorFormSheetProps) {
  const [date, setDate] = React.useState('')
  const [type, setType] = React.useState<BehaviorType>('Positive Note')
  const [details, setDetails] = React.useState('')
  const [reportedBy, setReportedBy] = React.useState('')
  const [statusAction, setStatusAction] = React.useState('')

  React.useEffect(() => {
    if (open) {
      setDate(record?.date ?? getTodayStr())
      setType(record?.type ?? 'Positive Note')
      setDetails(record?.details ?? '')
      setReportedBy(record?.reportedBy ?? '')
      setStatusAction(record?.statusAction ?? '')
    }
  }, [open, record])

  const canSave = date.trim().length > 0 && details.trim().length > 0 && reportedBy.trim().length > 0

  const handleSubmit = React.useCallback(() => {
    if (!canSave) return
    onSave({
      date: date.trim(),
      type,
      details: details.trim(),
      reportedBy: reportedBy.trim(),
      statusAction: statusAction.trim(),
    })
  }, [canSave, date, type, details, reportedBy, statusAction, onSave])

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={record ? 'Edit Behavior Entry' : 'Log Behavior Entry'}
      footer={
        <>
    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
    Cancel
    </Button>
    <Button onClick={handleSubmit} disabled={!canSave || isSaving}>
    {isSaving ? 'Saving...' : record ? 'Save Changes' : 'Log Entry'}
    </Button>
        </>
      }
    >
        <FormSection title="Entry Details" width={12}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bh-date">Date <span className="text-destructive">*</span></Label>
              <Input
                id="bh-date"
                placeholder="e.g. Mar 05, 2035"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Type <span className="text-destructive">*</span></Label>
              <Select value={type} onValueChange={v => setType(v as BehaviorType)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Positive Note">Positive Note</SelectItem>
                  <SelectItem value="Minor Issue">Minor Issue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bh-details">Details <span className="text-destructive">*</span></Label>
            <textarea
              id="bh-details"
              placeholder="What happened..."
              value={details}
              onChange={e => setDetails(e.target.value)}
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bh-reported">Reported By <span className="text-destructive">*</span></Label>
              <Input
                id="bh-reported"
                placeholder="e.g. Ms. Lee"
                value={reportedBy}
                onChange={e => setReportedBy(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bh-action">Status / Action</Label>
              <Input
                id="bh-action"
                placeholder="e.g. Parent Notified"
                value={statusAction}
                onChange={e => setStatusAction(e.target.value)}
              />
            </div>
          </div>
        </FormSection>
    </FormSheet>
  )
}
