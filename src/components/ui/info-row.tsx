import * as React from 'react'
import { fontSizes } from '@/config/typography'
import { spacing } from '@/config/spacing'
import { text } from '@/theme/colors'

export interface InfoRowProps {
  /** Icon element (Lucide icon or text symbol) */
  icon: React.ReactNode
  /** Label text (left side) */
  label: string
  /** Value text (right side) */
  value: string
}

/**
 * InfoRow - A generic label-value row with an icon.
 * Used in personal info sections, profile cards, and detail panels.
 */
export function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        minHeight: '2.25rem',
        gap: spacing['3'],
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing['3'], flexShrink: 0 }}>
        <span
          className="text-muted-foreground"
          style={{
            width: spacing['4'],
            height: spacing['4'],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: fontSizes.sm,
          }}
        >
          {icon}
        </span>
        <span className="text-muted-foreground" style={{ fontSize: fontSizes.xs }}>
          {label}
        </span>
      </div>
      <p
        className="font-medium"
        style={{
          fontSize: fontSizes.sm,
          color: text.body,
          textAlign: 'right',
          maxWidth: '60%',
          lineHeight: '1.4',
          margin: 0,
          wordBreak: 'break-word',
        }}
      >
        {value}
      </p>
    </div>
  )
}
