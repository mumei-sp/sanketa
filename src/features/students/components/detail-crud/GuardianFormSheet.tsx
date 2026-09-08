/**
 * GuardianFormSheet — link a parent to this student, or edit the link.
 *
 * Two jobs in one panel because they are one decision from the user's side:
 * "who is this child's mother" is either picking someone the school already
 * knows or adding a person it does not.
 *
 * Picking an existing parent is offered first, and deliberately: a parent with
 * two children at the school must be one row, or their account sees one child.
 * Typing a name that already exists is the mistake this ordering prevents.
 */

import * as React from 'react'
import { FormSheet } from '@/components/form/FormSheet'
import { FormSection } from '@/components/form/FormSection'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { text } from '@/theme/colors'
import type { Parent, ParentOfStudent } from '@/api/services/parent-service'

/** What the sheet hands back. `parentProfileId` null means "create this one". */
export interface GuardianDraft {
  parentProfileId: string | null
  fullName: string
  email: string | null
  phone: string
  relationship: string
  isPrimary: boolean
}

interface GuardianFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Set when editing an existing link. */
  guardian: ParentOfStudent | null
  /** Everyone the school already knows, minus those already on this student. */
  candidates: Parent[]
  onSave: (draft: GuardianDraft) => void
  isSaving: boolean
}

const RELATIONSHIPS = ['Mother', 'Father', 'Guardian', 'Grandparent', 'Sibling', 'Other']
const NEW_PERSON = '__new__'

/** Loose enough not to reject an address that works. */
function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export function GuardianFormSheet({
  open,
  onOpenChange,
  guardian,
  candidates,
  onSave,
  isSaving,
}: GuardianFormSheetProps) {
  const [pick, setPick] = React.useState<string>(NEW_PERSON)
  const [fullName, setFullName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [relationship, setRelationship] = React.useState('Mother')
  const [isPrimary, setIsPrimary] = React.useState(false)

  React.useEffect(() => {
    if (!open) return
    setPick(guardian ? guardian.profileId : NEW_PERSON)
    setFullName(guardian?.fullName ?? '')
    setEmail(guardian?.email ?? '')
    setPhone(guardian?.phone ?? '')
    setRelationship(guardian?.relationship ?? 'Mother')
    setIsPrimary(guardian?.isPrimary ?? false)
  }, [open, guardian])

  /** Picking someone known fills the identity fields from their row. */
  const choose = (value: string) => {
    setPick(value)
    if (value === NEW_PERSON) {
      setFullName('')
      setEmail('')
      setPhone('')
      return
    }
    const existing = candidates.find(candidate => candidate.profileId === value)
    if (existing) {
      setFullName(existing.fullName)
      setEmail(existing.email ?? '')
      setPhone(existing.phone ?? '')
    }
  }

  const emailOk = email.trim() === '' || looksLikeEmail(email)
  const canSave = fullName.trim().length > 0 && relationship.trim().length > 0 && emailOk

  const submit = () => {
    if (!canSave) return
    onSave({
      parentProfileId: guardian ? guardian.profileId : pick === NEW_PERSON ? null : pick,
      fullName: fullName.trim(),
      email: email.trim() || null,
      phone: phone.trim(),
      relationship,
      isPrimary,
    })
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={guardian ? 'Edit guardian' : 'Add a guardian'}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!canSave || isSaving}>
            {isSaving ? 'Saving…' : guardian ? 'Save changes' : 'Add guardian'}
          </Button>
        </>
      }
    >
      <FormSection title="Who" width={12}>
        {!guardian && (
          <div className="space-y-2">
            <Label htmlFor="gd-pick">Already on file?</Label>
            <Select value={pick} onValueChange={choose}>
              <SelectTrigger id="gd-pick" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NEW_PERSON}>Someone new</SelectItem>
                {candidates.map(candidate => (
                  <SelectItem key={candidate.profileId} value={candidate.profileId}>
                    {candidate.fullName}
                    {candidate.phone ? ` · ${candidate.phone}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-caption" style={{ color: text.muted }}>
              Pick a name the school already knows and their other children stay linked to the
              same person — and to the same account.
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="gd-name">
            Full name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="gd-name"
            value={fullName}
            disabled={pick !== NEW_PERSON && !guardian}
            onChange={event => setFullName(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="gd-phone">Phone</Label>
          <Input id="gd-phone" value={phone} onChange={event => setPhone(event.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="gd-email">Email</Label>
          <Input
            id="gd-email"
            type="email"
            value={email}
            onChange={event => setEmail(event.target.value)}
            aria-invalid={!emailOk}
          />
          <p className="text-caption" style={{ color: text.muted }}>
            {emailOk
              ? 'Needed before they can be given an account. Safe to leave empty for now.'
              : 'That does not look like an email address.'}
          </p>
        </div>
      </FormSection>

      <FormSection title="This child" width={12}>
        <div className="space-y-2">
          <Label htmlFor="gd-rel">
            Relationship <span className="text-destructive">*</span>
          </Label>
          <Select value={relationship} onValueChange={setRelationship}>
            <SelectTrigger id="gd-rel" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RELATIONSHIPS.map(option => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <Label htmlFor="gd-primary" className="cursor-pointer">
              First contact
            </Label>
            <p className="text-caption" style={{ color: text.muted }}>
              Only one per child, so setting this moves it off whoever holds it.
            </p>
          </div>
          <Switch id="gd-primary" checked={isPrimary} onCheckedChange={setIsPrimary} />
        </div>
      </FormSection>
    </FormSheet>
  )
}
