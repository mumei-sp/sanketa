import { fontSizes } from '@/config/typography'
import { spacing } from '@/config/spacing'

export interface StatusPillConfig {
  bg: string
  color: string
}

interface StatusPillProps {
  label: string
  config: StatusPillConfig
}

/**
 * StatusPill - Reusable colored pill badge for status indicators.
 * Used in tables and lists to show categorized statuses
 * (behavior types, event statuses, priority levels, etc.)
 */
export function StatusPill({ label, config }: StatusPillProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontSize: fontSizes.xs,
        fontWeight: 500,
        color: config.color,
        backgroundColor: config.bg,
        padding: `${spacing['0.5']} ${spacing['2']}`,
        borderRadius: spacing['1'],
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  )
}
