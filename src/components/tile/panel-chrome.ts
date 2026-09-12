/**
 * Chrome shared by the chart panels on tiled pages.
 *
 * The dropdown that picks a panel's range or grade sits ON the title's line,
 * not under it — see the `data-compact` rule in `components/ui/card.tsx`, which
 * ellipses the title rather than letting it wrap. A second header row cost 29px,
 * and a panel's height is set by the row it sits in, so every pixel the header
 * gives back is a pixel the chart draws in.
 *
 * Compact because these panels are often only three or four columns wide. Stated once here rather
 * than per panel, so the four of them cannot drift into four different-looking
 * dropdowns.
 *
 * Width is deliberately NOT part of this. It belongs to the panel, because it
 * is a fact about that panel's longest label, and it has to be explicit: sized
 * to its content the trigger would change width as the reader moved between
 * "Weekly" and "Monthly", shifting the title's ellipsis with it.
 */
export const PANEL_SELECT_TRIGGER = 'h-8 px-2 text-xs bg-accent'
