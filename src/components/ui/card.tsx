import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * Opaque, and 18px at the corner.
 *
 * It was `glass-card` — 72% card colour over a 16px backdrop blur — which put
 * the aurora wash *through* the content instead of behind it. The canvas is
 * meant to show around cards, not inside them; every card in the design is a
 * solid surface. `glass-card` still belongs to the two things that genuinely
 * float over arbitrary page content: the mobile top bar and the search palette.
 *
 * `rounded-xl` resolves to `--radius + 4px` = 18px, which is the card radius
 * the design specifies. `rounded-2xl` was 22px — the token is named for bento
 * tiles and its comment assumed a 16px root, but this app's root is 14px, so
 * every card had been running four pixels rounder than drawn.
 */
function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card"
      className={cn(
        'bg-card text-card-foreground flex flex-col gap-6 rounded-xl border border-card-border py-6 shadow-card',
        className,
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        '@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 [.border-b]:pb-6',
        // A header with controls in it puts them BESIDE the title only when
        // there is room, and underneath it when there is not.
        //
        // The title column was `minmax(0,1fr)` against an `auto` action, so the
        // controls held their width and the title took whatever was left —
        // which on a 281px card carrying two 110px selects was *ten pixels*,
        // and "Workload Distribution" rendered as a broken stack of one letter
        // per line. Every two-word heading beside a select wrapped for the same
        // reason. Stacking below 24rem of container costs one row and is the
        // only arrangement that always fits.
        'has-data-[slot=card-action]:grid-cols-1 has-data-[slot=card-action]:@[24rem]/card-header:grid-cols-[minmax(0,1fr)_auto]',
        // `!` because this has to BEAT the `grid-cols-1` above, and both set
        // the same property on the same element. Tailwind emits them in its own
        // order, and it emits that one second — which is why `data-compact` did
        // nothing at all before this: every header carrying a `CardAction`
        // matched the stacking rule too, and the stacking rule landed last.
        'has-data-[compact]:grid-cols-[minmax(0,1fr)_auto]!',
        // ── Compact headers trim the title, they do not break it ──────────
        //
        // `data-compact` is the opt out of the stacking above: keep the
        // controls on the title's line whatever the width. That used to be
        // unsafe at small widths for the reason given above — the title takes
        // what the controls leave, and what they leave can be ten pixels.
        //
        // It is safe now because the title ELLIPSES instead of wrapping.
        // "Students by Gender" becoming "Students by G…" is a title you can
        // still place and a header one row tall; the same title wrapping is a
        // stack of single letters, and that is the only thing stacking was
        // ever protecting against. The full text stays in the DOM, so it is
        // what a screen reader announces — it is drawn short, not cut. A
        // sighted reader gets no tooltip, though, so `data-compact` is for
        // headings that survive being shortened: reach for it where the width
        // is genuinely tight, not everywhere.
        //
        // Scoped to the title cell (the first child) so the controls beside it
        // keep their natural width — a truncated control is a broken one.
        'has-data-[compact]:[&>:first-child]:min-w-0 has-data-[compact]:[&>:first-child]:truncate',
        className,
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-title"
      className={cn('leading-none font-semibold', className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  )
}

/**
 * Controls that belong to a card's header.
 *
 * Sits beside the title when the header has room and underneath it when it has
 * not — see `CardHeader`. An action that is only an icon button always has
 * room, so those opt out with `data-compact`, which pins it beside the title at
 * every width rather than spending a whole row on a 24px target.
 */
function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        // Column 1 row 2 when the header has stacked, column 2 row 1 when it
        // has not — matching the grid `CardHeader` switches to at 24rem.
        'col-start-1 row-start-2 self-start justify-self-start',
        '@[24rem]/card-header:col-start-2 @[24rem]/card-header:row-span-2 @[24rem]/card-header:row-start-1 @[24rem]/card-header:justify-self-end',
        'data-[compact]:col-start-2! data-[compact]:row-span-2! data-[compact]:row-start-1! data-[compact]:justify-self-end!',
        className,
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-content" className={cn('px-6', className)} {...props} />
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-footer"
      className={cn('flex items-center px-6 [.border-t]:pt-6', className)}
      {...props}
    />
  )
}

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent }
