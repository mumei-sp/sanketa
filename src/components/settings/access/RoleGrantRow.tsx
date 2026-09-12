/**
 * One role somebody holds, and how it got there.
 *
 * The People screen used to stamp every role in the school onto every person
 * as a row of toggles: six chips each, five of them off, and nothing at all
 * about where the sixth came from. It read as a settings form when the
 * question being asked is a historical one — *who gave this person this, and
 * does it end?*
 *
 * So a held role is a row rather than a lit chip, and it carries its own
 * provenance. Roles not held are a short list underneath, which is the same
 * information at a tenth of the ink.
 *
 * ── Temporary roles look different, deliberately ───────────────────────
 * An expiry is the one property of a grant that changes without anybody
 * touching it, so it has to be visible before somebody goes looking. The amber
 * treatment is the app's only caution colour — there is no token for it,
 * because until now nothing in this product needed to say "this is fine, and
 * it is going to stop".
 *
 * A term left is shown in days once it is close. "Until 31 Mar 2027" is the
 * fact; "9 days left" is the one that makes somebody act, and a date nine days
 * out does not read as urgent at a glance.
 *
 * ── And the reason, where there is one ─────────────────────────────────
 * Quoted rather than paraphrased, because it is somebody's sentence and not
 * the app's. It sits on the row rather than only in the log: the log is capped
 * and eventually forgets, and "why does she have this?" is a question about
 * this row, asked while looking at it.
 */

import { Clock, Pencil, X, Check, Quote } from 'lucide-react'
import type { Role } from '@/config/permissions'
import type { RoleGrant } from '@/api/services/user-service'
import { border, text } from '@/theme/colors'
import { cn } from '@/lib/utils'

/** Amber. The one caution tone in the app, and it lives here because nothing else needed one. */
export const CAUTION = {
  bg: '#fffbf5',
  chipBg: '#fff7ed',
  line: '#fdd9a8',
  ink: '#8a5314',
} as const

/** Days from now until an ISO date, rounded down. Negative once it has passed. */
export function daysUntil(iso: string, now = new Date()): number {
  return Math.floor((new Date(iso).getTime() - now.getTime()) / 86_400_000)
}

/** `31 Mar 2027` — short, because it sits inside a chip beside a role name. */
export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * How an expiry reads, given how near it is.
 *
 * Under a fortnight it counts down, because that is when somebody has to do
 * something about it; beyond that a date is more use than a number of days
 * nobody can picture.
 */
export function expiryLabel(iso: string, now = new Date()): string {
  const days = daysUntil(iso, now)
  if (days < 0) return 'Expired'
  if (days === 0) return 'Ends today'
  if (days === 1) return '1 day left'
  if (days <= 14) return `${days} days left`
  return `Until ${shortDate(iso)}`
}

/** `granted by Nandini Rao · 2 Apr 2026`, or as much of it as is known. */
function provenance(grant: RoleGrant): string {
  const when = shortDate(grant.assignedAt)
  return grant.grantedBy ? `granted by ${grant.grantedBy} · ${when}` : `granted ${when}`
}

export function RoleGrantRow({
  role,
  grant,
  editable,
  busy,
  onChangeExpiry,
  onRemove,
}: {
  role: Role
  grant: RoleGrant
  editable: boolean
  busy: boolean
  onChangeExpiry: () => void
  onRemove: () => void
}) {
  const temporary = grant.expiresAt !== undefined
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-2.5 py-2"
      style={{
        borderColor: temporary ? CAUTION.line : border.subtle,
        backgroundColor: temporary ? CAUTION.bg : 'var(--muted)',
      }}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
          style={
            temporary
              ? { backgroundColor: CAUTION.chipBg, color: CAUTION.ink, border: `1px solid ${CAUTION.line}` }
              : { backgroundColor: 'var(--heading)', color: 'var(--card)' }
          }
        >
          {temporary && <Clock className="size-3" aria-hidden />}
          {role.name}
        </span>
        <span className="text-caption" style={{ color: text.muted }}>
          {provenance(grant)}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          disabled={!editable || busy}
          onClick={onChangeExpiry}
          title={temporary ? 'Change when it ends' : 'Give it an end date'}
          className={cn(
            'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium',
            'hover:bg-muted disabled:opacity-60 disabled:hover:bg-transparent',
          )}
          style={
            temporary
              ? { borderColor: CAUTION.line, backgroundColor: CAUTION.chipBg, color: CAUTION.ink }
              : { borderColor: border.default, color: text.muted }
          }
        >
          {grant.expiresAt ? expiryLabel(grant.expiresAt) : 'Permanent'}
          {editable && <Pencil className="size-2.5" aria-hidden />}
        </button>
        {editable && (
          <button
            type="button"
            disabled={busy}
            onClick={onRemove}
            title={`Take ${role.name} away`}
            className="tap-target rounded-md p-1 hover:bg-muted disabled:opacity-50"
            style={{ color: text.muted }}
          >
            <X className="size-3.5" aria-hidden />
          </button>
        )}
      </div>

      {grant.reason && (
        <p
          className="flex w-full items-start gap-1.5 text-caption"
          style={{ color: temporary ? CAUTION.ink : text.muted }}
        >
          <Quote className="mt-0.5 size-3 shrink-0" aria-hidden />
          <span className="italic">{grant.reason}</span>
        </p>
      )}

      {/*
        Said on the row, not only where the role was given.

        The grant dialog says it and a toast repeats it, but both are gone
        moments later — and the question this answers ("does somebody have to
        remember to take this back?") is asked weeks afterwards, by whoever
        opens the person and finds an amber row. The amber says the grant ends;
        it does not say that the ending takes care of itself, and an admin who
        assumes otherwise sets a reminder nobody needs.

        On the row rather than once per person because a person can hold two
        temporary roles, and then a single note underneath is ambiguous about
        which one it belongs to.
      */}
      {temporary && (
        <p
          className="flex w-full items-start gap-1.5 text-caption"
          style={{ color: CAUTION.ink }}
        >
          <Clock className="mt-0.5 size-3 shrink-0" aria-hidden />
          <span>It stops working on its own — nobody has to remember to take it back.</span>
        </p>
      )}
    </div>
  )
}

/**
 * The roles this person does *not* hold, offered as a short list.
 *
 * Nothing is preselected and nothing is lit: adding a role is a deliberate act
 * that asks a follow-up question, so these are prompts rather than switches.
 * A role that cannot be given — a family role to somebody with no `guardians`
 * row — is not in the list at all, because a control that is always refused is
 * worse than one that was never there.
 */
export function AddRoleRow({
  roles,
  busy,
  onAdd,
}: {
  roles: Role[]
  busy: boolean
  onAdd: (roleId: string) => void
}) {
  if (roles.length === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-caption" style={{ color: text.muted }}>
        Add a role
      </span>
      {roles.map(role => (
        <button
          key={role.id}
          type="button"
          disabled={busy}
          onClick={() => onAdd(role.id)}
          className="tap-target rounded-full border px-2.5 py-1 text-xs font-medium hover:bg-muted disabled:opacity-50"
          style={{ borderColor: border.default, color: text.muted }}
        >
          {role.name}
        </button>
      ))}
    </div>
  )
}

/** A tick and a line, for a person whose single role needs no editing. */
export function GrantSummary({ grants, roles }: { grants: RoleGrant[]; roles: Role[] }) {
  if (grants.length === 0) return null
  const name = (id: string) => roles.find(role => role.id === id)?.name ?? id
  return (
    <p className="flex items-center gap-1.5 text-caption" style={{ color: text.muted }}>
      <Check className="size-3 shrink-0" aria-hidden />
      {grants
        .map(
          grant =>
            `${name(grant.roleId)} — ${provenance(grant)}${
              grant.expiresAt ? ` · ${expiryLabel(grant.expiresAt).toLowerCase()}` : ''
            }`,
        )
        .join(' · ')}
    </p>
  )
}
