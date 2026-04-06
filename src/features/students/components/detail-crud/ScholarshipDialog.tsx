/**
 * ScholarshipDialog — Add / Edit dialog for student scholarships.
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
import type { StudentScholarship } from '../../types'

interface ScholarshipDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  record: StudentScholarship | null
  onSave: (data: Omit<StudentScholarship, 'id'>) => void
  isSaving: boolean
}

export function ScholarshipDialog({
  open,
  onOpenChange,
  record,
  onSave,
  isSaving,
}: ScholarshipDialogProps) {
  const [title, setTitle] = React.useState('')
  const [category, setCategory] = React.useState('')
  const [icon, setIcon] = React.useState<StudentScholarship['icon']>('award')

  React.useEffect(() => {
    if (open) {
      setTitle(record?.title ?? '')
      setCategory(record?.category ?? '')
      setIcon(record?.icon ?? 'award')
    }
  }, [open, record])

  const canSave = title.trim().length > 0 && category.trim().length > 0

  const handleSubmit = React.useCallback(() => {
    if (!canSave) return
    onSave({ title: title.trim(), category: category.trim(), icon })
  }, [canSave, title, category, icon, onSave])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle>{record ? 'Edit Scholarship' : 'Add Scholarship'}</DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4">
          <FormSection title="Scholarship Details" width={12}>
            <div className="space-y-2">
              <Label htmlFor="sch-title">Title <span className="text-destructive">*</span></Label>
              <Input
                id="sch-title"
                placeholder="e.g. STEM for Girls Initiative"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sch-category">Category <span className="text-destructive">*</span></Label>
                <Input
                  id="sch-category"
                  placeholder="e.g. Finance, Enrichment"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Icon</Label>
                <Select value={icon} onValueChange={v => setIcon(v as StudentScholarship['icon'])}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="award">Award</SelectItem>
                    <SelectItem value="globe">Globe</SelectItem>
                    <SelectItem value="book-open">Book / Academic</SelectItem>
                    <SelectItem value="graduation-cap">Graduation</SelectItem>
                    <SelectItem value="trophy">Trophy / Sports</SelectItem>
                    <SelectItem value="star">Star / Merit</SelectItem>
                    <SelectItem value="heart">Heart / Community</SelectItem>
                    <SelectItem value="music">Music</SelectItem>
                    <SelectItem value="palette">Art / Creative</SelectItem>
                    <SelectItem value="code">STEM / Coding</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </FormSection>
        </div>

        <DialogFooter className="px-6 pb-6 pt-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSave || isSaving}>
            {isSaving ? 'Saving...' : record ? 'Save Changes' : 'Add Scholarship'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
