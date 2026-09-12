/**
 * Which of your lives you are currently in, and the way back out.
 *
 * The successor to `SchoolSwitcher`, and strictly wider than it: a context is
 * a school *and* a side, so this names both. The school alone stopped being
 * the answer the moment one login could be a teacher and a parent at the same
 * school — the old chip would have read "Kendriya Vidyalaya" on both of
 * Meera's sides and explained nothing about why one of them shows 441 students
 * and the other shows one.
 *
 * It also covers strictly more people. `SchoolSwitcher` appeared for two
 * schools; this appears for two *contexts*, which includes her — one school,
 * two ways in — for whom the old chip rendered nothing at all.
 *
 * ── Renders nothing for almost everybody ──────────────────────────────
 * Same rule as before, one level up: one way in is not a choice, and a person
 * who has only ever been one thing should not be shown a control that says
 * otherwise. Read from `useContexts` rather than counted here, so the chip,
 * the account menu and the chooser cannot disagree about how many there are.
 *
 * ── Why choosing reloads ──────────────────────────────────────────────
 * See `ContextsProvider`. Every service answer and every memoised ability was
 * built against the side being left, and the honest way to invalidate all of
 * it is a new document.
 */

import { Check, ChevronsUpDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { getInitials } from '@/utils/format'
import { cn } from '@/lib/utils'
import type { UserContext } from '@/mocks/global'
import { useContexts } from './ContextsProvider'
import { contextTitle, contextSubtitle, contextMonogramSource } from './context-labels'

/**
 * The little mark: round for a person, square-ish for an institution.
 *
 * The same grammar the chooser's tiles use, at chip size — so the thing you
 * pressed to get in is recognisable in the corner once you are.
 */
function Mark({ context, size }: { context: UserContext; size: 'sm' | 'md' }) {
  const family = context.side === 'family'
  return (
    <span
      aria-hidden
      className={cn(
        'flex shrink-0 items-center justify-center font-bold',
        size === 'sm' ? 'size-6 text-[10px]' : 'size-7 text-caption',
      )}
      style={{
        borderRadius: family ? '9999px' : 'var(--radius-sm)',
        backgroundColor: family ? 'var(--primary)' : 'var(--accent)',
        color: 'var(--heading)',
      }}
    >
      {getInitials(contextMonogramSource(context))}
    </span>
  )
}

export function ContextSwitcher({ variant = 'pill' }: { variant?: 'pill' | 'bar' }) {
  const { all, active, isReady, choose } = useContexts()

  // Nothing to switch between, nothing to say. Also covers the moment before
  // the fan-out answers, when the honest chip is no chip rather than a
  // placeholder that resolves into a different word.
  if (!isReady || all.length < 2 || !active) return null

  const shape =
    variant === 'pill'
      ? 'h-10 rounded-full bg-card border border-border shadow-sm px-3'
      : 'h-10 rounded-lg hover:bg-muted px-2'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(shape, 'gap-2 font-medium')}
          aria-label={`You are ${contextTitle(active)} at ${active.tenantName}. Switch profile`}
        >
          <Mark context={active} size="md" />
          {/* The label is the first thing to go when the window narrows: the
              mark still says which, and the chevrons still say it opens. */}
          <span className="hidden min-w-0 flex-col items-start leading-tight lg:flex">
            <span
              className="truncate text-caption font-semibold"
              style={{ color: 'var(--heading)' }}
            >
              {contextTitle(active)}
            </span>
            <span className="max-w-[150px] truncate text-[11px] text-muted-foreground">
              {active.tenantName}
            </span>
          </span>
          <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        // Explicit, not `w-72`: this project remaps Tailwind's numeric
        // spacing to a compact scale, so `w-72` is 152px rather than the
        // 288px it reads as — and two lines of name and school do not fit.
        className="w-[17rem]"
      >
        <DropdownMenuLabel className="text-caption font-normal text-muted-foreground">
          You have {all.length} profiles
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {all.map(context => (
          <DropdownMenuItem
            key={context.id}
            onSelect={() => choose(context)}
            className="gap-2.5"
            aria-label={`Switch to ${contextTitle(context)} at ${context.tenantName}`}
          >
            <Check
              className={cn(
                'size-4 shrink-0',
                context.id === active.id ? 'opacity-100' : 'opacity-0',
              )}
              aria-hidden
            />
            <Mark context={context} size="sm" />
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="truncate font-semibold">{contextTitle(context)}</span>
              <span className="truncate text-caption font-normal text-muted-foreground">
                {contextSubtitle(context)}
              </span>
            </span>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-caption font-normal text-muted-foreground">
          Switching reloads the app — what you can see and change is different on each.
        </DropdownMenuLabel>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
