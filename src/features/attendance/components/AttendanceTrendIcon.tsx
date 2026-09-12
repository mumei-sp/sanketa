import { TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AttendanceTrendIconProps {
  className?: string
  size?: number
  /**
   * The colour to draw in. Defaults to white, which is what this always was.
   *
   * It is a prop now because the badge it sits in had to stop being white:
   * white on `status.success.base` measured 2.17:1, and an icon hardcoded to
   * white would have been left behind on its own label. The caller owns the
   * pairing, so the glyph and the text beside it cannot drift apart.
   */
  color?: string
}

/** Trend icon for the attendance percentage badge. */
export function AttendanceTrendIcon({
  className,
  size = 12,
  color = 'white',
}: AttendanceTrendIconProps) {
  return <TrendingUp className={cn(className)} size={size} style={{ color }} aria-hidden="true" />
}
