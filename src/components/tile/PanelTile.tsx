import type * as React from 'react'
import { cn } from '@/lib/utils'
import { Tile, type LayoutMode } from './Tile'
import type { ResponsiveValue } from './tile-class-maps'

interface PanelTileProps {
  /** Unique identifier, forwarded to the underlying Tile. */
  id: string
  /** Extra classes for the tile itself. */
  className?: string
  /** Grid column span, when the panel places itself rather than being placed. */
  width?: ResponsiveValue<number>
  /** Defaults to `block` — a panel is a box holding a Card, not a grid. */
  layoutMode?: LayoutMode
  children: React.ReactNode
}

/**
 * The height contract every panel on a tiled page shares.
 *
 * A panel is a grid item, and a grid item is stretched to its row. What was
 * never stated is that the CARD inside has to be stretched too — a `Card` sized
 * to its own content, sitting in a tile sized to the row, shows the difference
 * as a gap under the card. Students by Gender ended 40px short of the two
 * panels beside it for exactly that reason (tile 335px, card 281px), while
 * Student Attendance and the to-do list lined up only because they happened to
 * carry `h-full`.
 *
 * It was being written per panel AND per branch, so a panel could line up while
 * it was loading and not once it had data. Six of the eight got it wrong in at
 * least one branch. Said once here it cannot drift: the tile fills its row, and
 * the card fills the tile.
 *
 * The paired rule — that a panel's DATA must not be able to size it — is
 * `.tile-list` in `index.css`. Between them a tile's height depends on the row
 * it is in and nothing else.
 */
export function PanelTile({
  id,
  className,
  width,
  layoutMode = 'block',
  children,
}: PanelTileProps) {
  return (
    <Tile
      id={id}
      width={width}
      layoutMode={layoutMode}
      background="transparent"
      padding={0}
      shadowed={false}
      className={cn('h-full [&>[data-slot=card]]:h-full', className)}
    >
      {children}
    </Tile>
  )
}
