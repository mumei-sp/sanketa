import { fontSizes } from '@/config/typography'
import { spacing } from '@/config/spacing'
import { text } from '@/theme/colors'

export interface AttendanceBadgeItem {
  label: string
  value: number
  /** Background fill color */
  color: string
  /** Text color — defaults to text.heading (dark) */
  textColor?: string
}

interface AttendanceSummaryBadgesProps {
  items: AttendanceBadgeItem[]
}

/**
 * AttendanceSummaryBadges - Large rounded-rectangle badge cards.
 * Each card has a colored background with the label on top and a large count below.
 * Matches the Figma calendar summary design.
 */
export function AttendanceSummaryBadges({ items }: AttendanceSummaryBadgesProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${items.length}, 1fr)`,
        gap: spacing['3'],
      }}
    >
      {items.map(item => {
        const color = item.textColor ?? text.heading
        return (
          <div
            key={item.label}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: item.color,
              borderRadius: spacing['2'],
              padding: `${spacing['2']} ${spacing['2']}`,
              gap: spacing['0.5'],
            }}
          >
            <span
              style={{
                fontSize: fontSizes.xs,
                fontWeight: 500,
                color,
              }}
            >
              {item.label}
            </span>
            <span
              style={{
                fontSize: fontSizes.xl,
                fontWeight: 800,
                color,
                lineHeight: 1.1,
              }}
            >
              {item.value}
            </span>
          </div>
        )
      })}
    </div>
  )
}
