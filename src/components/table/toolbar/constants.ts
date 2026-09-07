/**
 * Shared layout tokens for list-page toolbars.
 *
 * Every list in the app (students, teachers, fees, expenses, notices, the
 * transport tabs) puts a title, a search field, some filters and one or two
 * actions in a row above the data. Desktop wants that as a single dense line;
 * a phone cannot fit it, and left to `flex-wrap` alone it breaks into a ragged
 * stack of mismatched widths and heights.
 *
 * These tokens describe the arrangement once so every toolbar collapses the
 * same way. All the phone behaviour rides on `max-md:`, so the desktop class
 * lists stay exactly what they were.
 *
 * @example
 * ```tsx
 * <div className={TOOLBAR_ROW}>
 *   <h2 className="text-page-title">Routes</h2>
 *   <div className={TOOLBAR_GROUP}>
 *     <div className={cn('relative w-[250px]', TOOLBAR_SEARCH)}>…</div>
 *     <SelectTrigger className={cn(TOOLBAR_CONTROL_HEIGHT, 'w-[120px]', TOOLBAR_HALF)} />
 *     <Button className={cn(TOOLBAR_CONTROL_HEIGHT, TOOLBAR_HALF)}>Export</Button>
 *     <Button className={cn(TOOLBAR_CONTROL_HEIGHT, TOOLBAR_HALF)}>Add Route</Button>
 *   </div>
 * </div>
 * ```
 */

/** Title + control group. One line on desktop, stacked on phones. */
export const TOOLBAR_ROW =
  'flex items-center justify-between gap-4 flex-wrap max-md:flex-col max-md:items-stretch max-md:gap-3'

/** The control group itself. Stays a wrapping row at every width. */
export const TOOLBAR_GROUP = 'flex flex-wrap items-center gap-2 max-md:w-full'

/**
 * Height shared by every toolbar control — 36px on phones for comfortable
 * tapping, 32px from `md` up for the dashboard's density.
 *
 * Backed by the `.h-control` utility in index.css rather than `h-9 sm:h-8`:
 * the compact scale redefines `.h-8`/`.h-9` unprefixed, which would outrank the
 * responsive variant and pin every control at 36px.
 */
export const TOOLBAR_CONTROL_HEIGHT = 'h-control'

/** Search field — takes the whole first line on a phone. */
export const TOOLBAR_SEARCH = 'max-md:w-full max-md:max-w-none'

/**
 * A control that takes exactly half a line on a phone, so two of them pair up.
 * The basis is 50% minus half of TOOLBAR_GROUP's `gap-2` (0.5rem), which makes
 * the pair land on one line at equal widths regardless of label length.
 */
export const TOOLBAR_HALF =
  'max-md:w-auto max-md:min-w-0 max-md:flex-1 max-md:basis-[calc(50%-0.25rem)]'

/** A control that takes a whole line on a phone. */
export const TOOLBAR_FULL = 'max-md:w-full'
