import * as React from 'react'

import { cn } from '@/lib/utils'

function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card"
      className={cn(
        'glass-card text-card-foreground flex flex-col gap-6 rounded-2xl border border-card-border py-6 shadow-card',
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
        'has-data-[compact]:grid-cols-[minmax(0,1fr)_auto]',
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
        'data-[compact]:col-start-2 data-[compact]:row-span-2 data-[compact]:row-start-1 data-[compact]:justify-self-end',
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
