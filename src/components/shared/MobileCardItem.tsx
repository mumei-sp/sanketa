/**
 * MobileCardItem — Shared card wrapper for mobile/card layouts.
 *
 * Provides the default rounded-lg bordered card with consistent
 * padding, border color, and background. Accepts overrides for
 * status-dependent styling (e.g. attendance marking cards).
 */

import { colors } from '@/theme/colors'
import { spacing } from '@/config/spacing'
import { cn } from '@/lib/utils'

interface MobileCardItemProps extends React.HTMLAttributes<HTMLDivElement> {
  borderColor?: string
  bgColor?: string
}

export function MobileCardItem({
  borderColor,
  bgColor,
  className,
  style,
  children,
  ...rest
}: MobileCardItemProps) {
  return (
    <div
      className={cn('rounded-lg border', className)}
      style={{
        padding: spacing['3'],
        borderColor: borderColor ?? colors.border.default,
        backgroundColor: bgColor ?? colors.background.card,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  )
}
