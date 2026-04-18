/**
 * StatusBanner — Shared submission status banner.
 *
 * Used by GradeEntryPage and DailyAttendancePage to show
 * submitted / draft / not-entered status with consistent styling.
 */

import { colors, baseColors, darken } from '@/theme/colors'
import { spacing } from '@/config/spacing'

interface StatusBannerProps {
  icon: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function StatusBanner({ icon, children, className }: StatusBannerProps) {
  return (
    <div
      className={`rounded-lg border flex items-center gap-2 text-sm ${className ?? ''}`}
      style={{
        padding: `${spacing['2.5']} ${spacing['3']}`,
        borderColor: 'color-mix(in srgb, var(--accent) 90%, black)',
        backgroundColor: 'var(--accent)',
        color: 'var(--heading)',
      }}
    >
      {icon}
      <span>{children}</span>
    </div>
  )
}
