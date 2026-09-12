/**
 * One way into the app, as a card you press.
 *
 * ── The grammar ───────────────────────────────────────────────────────
 * A circle is a person and a squircle is an institution, so a family tile
 * reads as a child and a staff tile reads as a school before either is read as
 * words. The two brand tints carry identity — which child, which school — and
 * the role pill stays neutral, because it is a label rather than a signal and
 * a coloured one competes with the avatar for the same job. The single
 * coloured pill in the set is amber, on a school that has given you no role,
 * because that one *is* a signal.
 *
 * ── Why a tile says what it grants ────────────────────────────────────
 * Because choosing narrows. A profile picker whose options differ only in
 * label is a preference; these options differ in what the app will let you do,
 * and the screen has to say so before the choice is made rather than after.
 *
 * Both lines are read, never written here. The capability line is the role's
 * own `description`, which the school owns and edits in the role editor, so it
 * stays true when a school invents "Librarian" or takes finance away from
 * Principal. The scope line is computed from the axis the role declares. Prose
 * hardcoded in this file would be the same mistake as `role === 'Accountant'`
 * at a call site — see the warning at the top of `config/permissions.ts`.
 */

import { ArrowRight, Check, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getInitials } from '@/utils/format'
// Status colours are TypeScript tokens, not CSS custom properties: the
// `cssVars` map in `theme/colors` is exported and never applied to the
// document, so a status custom property resolves to nothing and the
// declaration is dropped in silence. `StatusBadge` aligns to these values.
import { status, statusVivid } from '@/theme/colors'
import type { UserContext } from '@/mocks/global'
import {
  contextTitle,
  contextSubtitle,
  contextMonogramSource,
  contextAriaLabel,
  contextTint,
  childTints,
  scopeLine,
} from './context-labels'

/** Overlapping circles for a family with more than one child on this side. */
function Avatar({ context }: { context: UserContext }) {
  const family = context.side === 'family'

  if (family && context.children.length > 1) {
    // A sibling shares the frame, so their colours are resolved together —
    // two identical overlapping circles read as one smudge.
    const shown = context.children.slice(0, 2)
    const tints = childTints(shown.map(child => child.studentId))
    return (
      <span className="flex items-center" aria-hidden>
        {shown.map((child, index) => (
          <span
            key={child.studentId}
            className={cn(
              'flex size-16 shrink-0 items-center justify-center rounded-full text-lg font-bold tracking-wide',
              index > 0 && '-ml-5',
            )}
            style={{
              backgroundColor: tints[index].background,
              color: tints[index].foreground,
              boxShadow: '0 0 0 3px var(--card)',
            }}
          >
            {getInitials(child.name)}
          </span>
        ))}
      </span>
    )
  }

  const label = contextMonogramSource(context)
  const tint = contextTint(context)

  return (
    <span
      aria-hidden
      className="flex size-16 shrink-0 items-center justify-center text-lg font-bold tracking-wide"
      style={{
        // A person is round; an institution is not.
        borderRadius: family ? '9999px' : 'var(--radius)',
        backgroundColor: tint.background,
        color: tint.foreground,
        boxShadow: `0 0 0 2px var(--card), 0 0 0 4px ${tint.background}`,
      }}
    >
      {getInitials(label)}
    </span>
  )
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-caption font-semibold"
      style={{ backgroundColor: 'var(--secondary)', color: 'var(--text-body)' }}
    >
      {children}
    </span>
  )
}

function Grant({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="flex items-start gap-2.5 text-sm leading-snug"
      style={{ color: 'var(--text-body)' }}
    >
      <Check className="mt-0.5 size-4 shrink-0" style={{ color: status.info.base }} aria-hidden />
      <span className="text-pretty">{children}</span>
    </span>
  )
}

export function ProfileTile({
  context,
  onChoose,
}: {
  context: UserContext
  onChoose: (context: UserContext) => void
}) {
  const title = contextTitle(context)

  return (
    <button
      type="button"
      onClick={() => onChoose(context)}
      // The accessible name says what pressing it does. The visible title is a
      // person's name on a family tile, which on its own tells a screen-reader
      // user nothing about where it leads.
      aria-label={`Continue as ${contextAriaLabel(context)}`}
      className={cn(
        'group flex w-full flex-col gap-4 rounded-2xl border p-6 text-left',
        'transition-[transform,box-shadow,border-color] duration-200 ease-out',
        'hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring',
        'active:translate-y-0',
      )}
      style={{
        backgroundColor: 'var(--card)',
        borderColor: 'var(--card-border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <span className="flex items-start justify-between gap-3">
        <Avatar context={context} />
        <Pill>{context.side === 'staff' ? 'Staff' : context.primaryRoleName}</Pill>
      </span>

      <span className="flex flex-col gap-0.5">
        <span className="text-xl font-bold leading-tight" style={{ color: 'var(--heading)' }}>
          {title}
        </span>
        <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
          {contextSubtitle(context)}
        </span>
      </span>

      <span className="h-px w-full" style={{ backgroundColor: 'var(--card-border)' }} />

      <span className="flex flex-col gap-2">
        {/* One line when the school has written no description for the role —
            rather than an invented sentence that cannot go stale because
            nothing keeps it true. */}
        {context.summary && <Grant>{context.summary}</Grant>}
        <Grant>{scopeLine(context)}</Grant>
      </span>

      <span
        className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold"
        style={{ color: 'var(--heading)' }}
      >
        Continue
        <ArrowRight
          className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
          aria-hidden
        />
      </span>
    </button>
  )
}

/**
 * A school you belong to and have no role in.
 *
 * Holding a membership and holding a role are different things, and the gap
 * between them is a real state: somebody enrolled at a second school before
 * anyone has decided what they do there. The access model answers that
 * honestly — no roles means no permissions means every list comes back empty —
 * and an app that is correctly empty looks exactly like one that is broken.
 *
 * So it is said here, on the way in, rather than as a notice at the bottom of
 * a dashboard with nothing on it.
 */
export function PendingSchoolTile({ tenantName }: { tenantName: string }) {
  return (
    <div
      aria-disabled
      className="flex w-full flex-col gap-4 rounded-2xl border border-dashed p-6 text-left"
      style={{ backgroundColor: 'var(--muted)', borderColor: 'var(--input)' }}
    >
      <span className="flex items-start justify-between gap-3">
        <span
          aria-hidden
          className="flex size-16 shrink-0 items-center justify-center text-lg font-bold tracking-wide"
          style={{
            borderRadius: 'var(--radius)',
            backgroundColor: 'var(--secondary)',
            color: 'var(--text-muted)',
          }}
        >
          {getInitials(tenantName)}
        </span>
        <span
          className="inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-caption font-semibold"
          style={{ backgroundColor: statusVivid.warning.bg, color: statusVivid.warning.color }}
        >
          No role yet
        </span>
      </span>

      <span className="flex flex-col gap-0.5">
        <span className="text-xl font-bold leading-tight" style={{ color: 'var(--heading)' }}>
          {tenantName}
        </span>
      </span>

      <span className="h-px w-full" style={{ backgroundColor: 'var(--border-subtle)' }} />

      <span
        className="flex items-start gap-2.5 text-sm leading-snug"
        style={{ color: 'var(--text-muted)' }}
      >
        <Info
          className="mt-0.5 size-4 shrink-0"
          style={{ color: status.warning.base }}
          aria-hidden
        />
        <span className="text-pretty">
          You have been enrolled here, but nobody has said what you do yet — so there is nothing to
          show. An administrator at {tenantName} can give you a role.
        </span>
      </span>
    </div>
  )
}
