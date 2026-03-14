import * as React from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
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
import type {
  BehaviorDisciplineRecord,
  BehaviorRecordType,
  BehaviorStatus,
} from '../types/behavior-discipline'
import { Plus, Pencil } from 'lucide-react'

const TYPE_OPTIONS: BehaviorRecordType[] = ['Positive Note', 'Minor Issue', 'Major Issue']

const STATUS_OPTIONS: BehaviorStatus[] = [
  'Record Recognition',
  'Recognition Recorded',
  'Issue Warning',
  'Parent Notified',
  'Pending Review',
]

interface BehaviorDisciplineEditSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  records: BehaviorDisciplineRecord[]
  onSave: (records: BehaviorDisciplineRecord[]) => void
}

export function BehaviorDisciplineEditSheet({
  open,
  onOpenChange,
  records,
  onSave,
}: BehaviorDisciplineEditSheetProps) {
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [isAdding, setIsAdding] = React.useState(false)
  const [localRecords, setLocalRecords] = React.useState<BehaviorDisciplineRecord[]>(records)
  const studentId = records[0]?.studentId ?? ''

  React.useEffect(() => {
    if (open) {
      setLocalRecords(records)
      setEditingId(null)
      setIsAdding(false)
    }
  }, [open, records])

  const handleEdit = (id: string) => {
    setEditingId(id)
    setIsAdding(false)
  }

  const getNewRecordTemplate = (): BehaviorDisciplineRecord => ({
    id: `new-${Date.now()}`,
    studentId,
    date: new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    type: 'Positive Note',
    details: '',
    reportedBy: '',
    status: 'Pending Review',
  })

  const handleAddNew = () => {
    setIsAdding(true)
    setEditingId(null)
  }

  const handleSaveEdit = (updated: BehaviorDisciplineRecord) => {
    if (isAdding) {
      setLocalRecords((prev) => [...prev, { ...updated, id: `new-${Date.now()}` }])
      setIsAdding(false)
    } else {
      setLocalRecords((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r)),
      )
      setEditingId(null)
    }
  }

  const handleDelete = (id: string) => {
    if (localRecords.length <= 3) return // Keep minimum 3 records
    setLocalRecords((prev) => prev.filter((r) => r.id !== id))
    if (editingId === id) setEditingId(null)
  }

  const handleDone = () => {
    onSave(localRecords)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Edit Behavior & Discipline Log</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-4 py-4 overflow-auto">
          <Button
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={handleAddNew}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New
          </Button>

          {isAdding && (
            <RecordForm
              record={getNewRecordTemplate()}
              onSave={handleSaveEdit}
              onCancel={() => setIsAdding(false)}
            />
          )}

          <div className="space-y-2">
            {localRecords.map((record) =>
              editingId === record.id ? (
                <RecordForm
                  key={record.id}
                  record={record}
                  onSave={handleSaveEdit}
                  onCancel={() => setEditingId(null)}
                  onDelete={
                    localRecords.length > 3
                      ? () => handleDelete(record.id)
                      : undefined
                  }
                />
              ) : (
                <div
                  key={record.id}
                  className="flex items-center justify-between gap-2 p-3 rounded-lg border bg-card"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{record.type}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {record.details}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => handleEdit(record.id)}
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                </div>
              ),
            )}
          </div>
        </div>
        <SheetFooter>
          <Button onClick={handleDone}>Done</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

interface RecordFormProps {
  record: BehaviorDisciplineRecord
  onSave: (record: BehaviorDisciplineRecord) => void
  onCancel: () => void
  onDelete?: () => void
}

function RecordForm({
  record,
  onSave,
  onCancel,
  onDelete,
}: RecordFormProps) {
  const [date, setDate] = React.useState(record.date)
  const [type, setType] = React.useState<BehaviorRecordType>(record.type)
  const [details, setDetails] = React.useState(record.details)
  const [reportedBy, setReportedBy] = React.useState(record.reportedBy)
  const [status, setStatus] = React.useState<BehaviorStatus>(record.status)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...record,
      date,
      type,
      details,
      reportedBy,
      status,
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 p-4 rounded-lg border bg-muted/30"
    >
      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          placeholder="e.g. Jan 10, 2025"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="type">Type</Label>
        <Select value={type} onValueChange={(v) => setType(v as BehaviorRecordType)}>
          <SelectTrigger id="type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="details">Details</Label>
        <Input
          id="details"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="e.g. Helped classmates during group project"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="reportedBy">Reported By</Label>
        <Input
          id="reportedBy"
          value={reportedBy}
          onChange={(e) => setReportedBy(e.target.value)}
          placeholder="e.g. Ms. Lee Record"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select value={status} onValueChange={(v) => setStatus(v as BehaviorStatus)}>
          <SelectTrigger id="status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm">
          Save
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        {onDelete && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onDelete}
            className="ml-auto"
          >
            Delete
          </Button>
        )}
      </div>
    </form>
  )
}
