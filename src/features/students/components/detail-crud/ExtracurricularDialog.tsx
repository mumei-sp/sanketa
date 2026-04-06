/**
 * ExtracurricularDialog — Add / Edit dialog for extracurricular activities.
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
import type { StudentActivity } from '../../types'

const ICON_OPTIONS = [
  { value: 'Waves', label: 'Swimming' },
  { value: 'Accessibility', label: 'Dance / Movement' },
  { value: 'Bot', label: 'Robotics / Tech' },
  { value: 'Trophy', label: 'Sports / Athletics' },
  { value: 'Music', label: 'Music' },
  { value: 'Palette', label: 'Art' },
]

interface ExtracurricularDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  record: StudentActivity | null
  onSave: (data: Omit<StudentActivity, 'id'>) => void
  isSaving: boolean
}

export function ExtracurricularDialog({
  open,
  onOpenChange,
  record,
  onSave,
  isSaving,
}: ExtracurricularDialogProps) {
  const [club, setClub] = React.useState('')
  const [role, setRole] = React.useState('')
  const [icon, setIcon] = React.useState('Waves')
  const [achievements, setAchievements] = React.useState('')
  const [duration, setDuration] = React.useState('')
  const [advisor, setAdvisor] = React.useState('')

  React.useEffect(() => {
    if (open) {
      setClub(record?.club ?? '')
      setRole(record?.role ?? '')
      setIcon(record?.icon ?? 'Waves')
      setAchievements(record?.achievements ?? '')
      setDuration(record?.duration ?? '')
      setAdvisor(record?.advisor ?? '')
    }
  }, [open, record])

  const canSave = club.trim().length > 0 && role.trim().length > 0 && duration.trim().length > 0

  const handleSubmit = React.useCallback(() => {
    if (!canSave) return
    onSave({
      club: club.trim(),
      role: role.trim(),
      icon,
      achievements: achievements.trim(),
      duration: duration.trim(),
      advisor: advisor.trim(),
    })
  }, [canSave, club, role, icon, achievements, duration, advisor, onSave])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle>{record ? 'Edit Activity' : 'Add Activity'}</DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4">
          <FormSection title="Activity Details" width={12}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ec-club">Club / Activity <span className="text-destructive">*</span></Label>
                <Input
                  id="ec-club"
                  placeholder="e.g. Swimming"
                  value={club}
                  onChange={e => setClub(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ec-role">Role <span className="text-destructive">*</span></Label>
                <Input
                  id="ec-role"
                  placeholder="e.g. Team Captain"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={icon} onValueChange={setIcon}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ec-duration">Duration <span className="text-destructive">*</span></Label>
                <Input
                  id="ec-duration"
                  placeholder="e.g. 2029 – Present"
                  value={duration}
                  onChange={e => setDuration(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ec-achievements">Achievements</Label>
              <Input
                id="ec-achievements"
                placeholder="e.g. Won 2 Silver Medals"
                value={achievements}
                onChange={e => setAchievements(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ec-advisor">Advisor</Label>
              <Input
                id="ec-advisor"
                placeholder="e.g. Coach Andrea V."
                value={advisor}
                onChange={e => setAdvisor(e.target.value)}
              />
            </div>
          </FormSection>
        </div>

        <DialogFooter className="px-6 pb-6 pt-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSave || isSaving}>
            {isSaving ? 'Saving...' : record ? 'Save Changes' : 'Add Activity'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
