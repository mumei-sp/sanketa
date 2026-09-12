/**
 * Giving a role, and saying how long for.
 *
 * `profile_roles.expires_at` has been in the schema and enforced in the store
 * since the multi-role model landed — a lapsed grant is filtered out of every
 * read — and nothing could ever set one. The acting head of department for one
 * term, which is the case the column was added for, was unreachable from the
 * app.
 *
 * So adding a role asks one more question than it used to. Not a date picker
 * bolted onto a toggle: the question is *permanent or not*, and only the
 * second answer needs a date.
 *
 * ── Why a dialog rather than an inline control ────────────────────────
 * Because the answer has consequences a chip cannot state. A temporary role
 * stops working on a date, silently, months later — that deserves a sentence
 * saying so before it is set, and a sentence needs somewhere to live.
 *
 * ── And one question that is not required ─────────────────────────────
 * A reason. Optional, because forcing one produces "asdf" and a required
 * field full of noise is worse than an empty one. It is asked anyway because
 * the log already answers *who* and *when* perfectly well, and the question
 * somebody actually arrives with a year later is *why* — which nothing in the
 * system could answer until now.
 *
 * ── The presets are the school's calendar, not round numbers ──────────
 * "End of this term" and "End of the school year" are how a school actually
 * thinks about a temporary appointment; "in 90 days" is how a computer does.
 * They read the real academic year, so the dates move with the school's own
 * configuration rather than being anchored to a guess about April.
 */

import * as React from 'react'
import { Clock, CircleCheck } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import type { Role } from '@/config/permissions'
import { border, text } from '@/theme/colors'
import { cn } from '@/lib/utils'
import { isoDate } from '@/mocks/_shared/date-helpers'
import { CAUTION, daysUntil, shortDate } from './RoleGrantRow'

/** A preset end date, named the way a school names it. */
interface Preset {
  label: string
  iso: string
}

/**
 * End of term, end of year, and a month out.
 *
 * Derived from today rather than from the academic calendar's own tables:
 * this dialog has no business loading the term list to offer a shortcut, and
 * the date it produces is editable anyway. The year boundary is 31 March,
 * which is the Indian school year and what `currentAcademicYear` already
 * assumes.
 */
function presetsFrom(now: Date): Preset[] {
  const yearEnd = new Date(now.getFullYear(), 2, 31)
  if (yearEnd <= now) yearEnd.setFullYear(now.getFullYear() + 1)

  // Terms run Apr–Sep, Oct–Dec, Jan–Mar. The next boundary after today.
  const boundaries = [
    new Date(now.getFullYear(), 8, 30),
    new Date(now.getFullYear(), 11, 31),
    new Date(now.getFullYear() + 1, 2, 31),
  ]
  const termEnd = boundaries.find(date => date > now) ?? yearEnd

  const inThirty = new Date(now.getTime() + 30 * 86_400_000)

  const out: Preset[] = [{ label: 'End of this term', iso: isoDate(termEnd) }]
  // Only when it is a different date — in the last term the two coincide, and
  // two chips producing the same day is a choice that is not one.
  if (isoDate(yearEnd) !== isoDate(termEnd)) {
    out.push({ label: 'End of the school year', iso: isoDate(yearEnd) })
  }
  out.push({ label: 'In 30 days', iso: isoDate(inThirty) })
  return out
}

/**
 * Long enough for a sentence, short enough that nobody writes a memo.
 *
 * A reason that runs to a paragraph stops being readable where it is shown —
 * one line under a grant, one line in a log — and the thing worth keeping is
 * the sentence, not the essay around it.
 */
const REASON_LIMIT = 140

/**
 * A placeholder that is an example, not an instruction.
 *
 * Different for the two cases because they are asked in different situations:
 * a temporary role almost always has a story, and a permanent one usually has
 * a reason that is really a job description.
 */
function placeholderFor(temporary: boolean): string {
  return temporary ? 'Acting head while Nandini Rao is on leave' : 'Took over admissions this year'
}

export function GrantRoleDialog({
  open,
  onOpenChange,
  role,
  personName,
  alsoHolds,
  currentExpiry,
  currentReason,
  alreadyHeld = false,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: Role | null
  personName: string
  /** Roles they already hold, named — so the dialog can say what adds to what. */
  alsoHolds: string[]
  /** Set when changing an existing grant rather than making a new one. */
  currentExpiry?: string
  /** The reason already on the grant, so editing one does not start blank. */
  currentReason?: string
  /**
   * Whether they hold this role already.
   *
   * Not `currentExpiry !== undefined`, which was the first version and read
   * wrong on the commonest case: a permanent role has no expiry, so clicking
   * its chip to add one greeted the admin with "Make Meera Iyengar Teacher"
   * about somebody who has taught there for a year.
   */
  alreadyHeld?: boolean
  onConfirm: (expiresAt: string | undefined, reason: string | undefined) => void
}) {
  const now = React.useMemo(() => new Date(), [open])
  const presets = React.useMemo(() => presetsFrom(now), [now])

  const [temporary, setTemporary] = React.useState(false)
  const [date, setDate] = React.useState('')
  const [reason, setReason] = React.useState('')

  // Reopened for a different role or person: start from what is true now
  // rather than from whatever the last grant left behind.
  React.useEffect(() => {
    if (!open) return
    setTemporary(currentExpiry !== undefined)
    setDate(currentExpiry ? isoDate(new Date(currentExpiry)) : presets[0].iso)
    setReason(currentReason ?? '')
  }, [open, currentExpiry, currentReason, presets])

  if (!role) return null

  const changing = alreadyHeld
  const days = date ? daysUntil(new Date(date).toISOString(), now) : 0
  const valid = !temporary || (date !== '' && days >= 0)
  const trimmedReason = reason.trim()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>
            {changing ? `${role.name} for ${personName}` : `Make ${personName} ${role.name}`}
          </DialogTitle>
          <DialogDescription>
            {alsoHolds.length > 0
              ? `They keep ${alsoHolds.join(' and ')} — they'll have everything ${
                  alsoHolds.length + 1 === 2 ? 'both' : 'all three'
                } allow.`
              : 'This is the only role they will hold here.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* How long — two answers, and only the second asks anything more. */}
          <div className="flex flex-col gap-2">
            <Label className="text-body font-medium">How long</Label>
            <div
              className="grid grid-cols-2 gap-1 rounded-xl p-1"
              style={{ backgroundColor: 'var(--muted)' }}
            >
              {[
                { on: false, label: 'Permanent', Icon: CircleCheck },
                { on: true, label: 'Until a date', Icon: Clock },
              ].map(option => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => setTemporary(option.on)}
                  aria-pressed={temporary === option.on}
                  className={cn(
                    'inline-flex h-8 items-center justify-center gap-1.5 rounded-lg text-body transition-colors',
                    temporary === option.on ? 'font-semibold shadow-sm' : 'font-medium',
                  )}
                  style={
                    temporary === option.on
                      ? { backgroundColor: 'var(--card)', color: 'var(--heading)' }
                      : { color: text.muted }
                  }
                >
                  <option.Icon className="size-3.5" aria-hidden />
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {temporary && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="grant-expiry" className="text-body font-medium">
                  Ends on
                </Label>
                {valid && (
                  <span className="text-caption" style={{ color: text.muted }}>
                    {days === 0 ? 'today' : `${days} days from today`}
                  </span>
                )}
              </div>
              <Input
                id="grant-expiry"
                type="date"
                value={date}
                min={isoDate(now)}
                onChange={event => setDate(event.target.value)}
                className="h-control"
              />
              <div className="flex flex-wrap gap-1.5">
                {presets.map(preset => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setDate(preset.iso)}
                    aria-pressed={date === preset.iso}
                    className="rounded-full border px-2.5 py-1 text-xs font-medium hover:bg-muted"
                    style={
                      date === preset.iso
                        ? { backgroundColor: 'var(--heading)', color: 'var(--card)', borderColor: 'var(--heading)' }
                        : { borderColor: border.default, color: text.muted }
                    }
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              {!valid && (
                <p className="text-caption" style={{ color: 'var(--delete-action-text)' }}>
                  Pick a date in the future — a role that has already ended cannot be given.
                </p>
              )}
            </div>
          )}

          {/* Why. Never required, and labelled as optional rather than merely
              lacking an asterisk — an admin adding a teacher on a Tuesday
              should not have to compose a justification, and the ones who do
              have something to say are the ones worth hearing from. */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <Label htmlFor="grant-reason" className="text-body font-medium">
                Why
              </Label>
              <span className="text-caption" style={{ color: text.muted }}>
                Optional
              </span>
            </div>
            <Input
              id="grant-reason"
              value={reason}
              maxLength={REASON_LIMIT}
              onChange={event => setReason(event.target.value)}
              placeholder={placeholderFor(temporary)}
              className="h-control"
            />
            <p className="text-caption" style={{ color: text.muted }}>
              {reason.length > REASON_LIMIT - 30
                ? `${REASON_LIMIT - reason.length} characters left`
                : 'Kept with the role and shown in the log, so a year from now this answers itself.'}
            </p>
          </div>

          {/* What will actually happen, in a sentence, before it does. */}
          <div
            className="flex items-start gap-2 rounded-xl border p-3"
            style={
              temporary
                ? { borderColor: CAUTION.line, backgroundColor: CAUTION.bg }
                : { borderColor: border.default, backgroundColor: 'var(--muted)' }
            }
          >
            {temporary ? (
              <Clock className="mt-0.5 size-3.5 shrink-0" style={{ color: CAUTION.ink }} aria-hidden />
            ) : (
              <CircleCheck className="mt-0.5 size-3.5 shrink-0" style={{ color: text.muted }} aria-hidden />
            )}
            <p className="text-caption" style={{ color: temporary ? CAUTION.ink : text.muted }}>
              {temporary && valid ? (
                <>
                  {role.name} ends on <strong>{shortDate(new Date(date).toISOString())}</strong> and
                  stops working on its own — nobody has to remember to take it back. It will show as
                  granted by you.
                </>
              ) : (
                <>
                  {role.name} lasts until somebody takes it away. It will show as granted by you.
                </>
              )}
              {trimmedReason !== '' && <> The log will say why.</>}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!valid}
            onClick={() => {
              onConfirm(
                temporary ? new Date(date).toISOString() : undefined,
                trimmedReason === '' ? undefined : trimmedReason,
              )
              onOpenChange(false)
            }}
          >
            {changing ? 'Save' : 'Give the role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
