import * as React from 'react'
import { Tile } from '@/components/tile'
import { fontSizes } from '@/config/typography'
import { spacing } from '@/config/spacing'
import { text, border } from '@/theme/colors'

/**
 * SectionCard - A generic, reusable card wrapper for detail page sections.
 *
 * Provides consistent card styling with an optional header (title + action slot),
 * an optional divider, and a content area. Designed to be used as a building block
 * across any detail/overview page.
 *
 * @example
 * ```tsx
 * <SectionCard
 *   title="Personal Info"
 *   action={<Button variant="ghost" size="icon"><MoreHorizontal /></Button>}
 * >
 *   <p>Content here</p>
 * </SectionCard>
 * ```
 */
export interface SectionCardProps {
  /** Section title displayed in the header */
  title?: string
  /** Optional action element (icon button, dropdown, etc.) rendered on the right of the header */
  action?: React.ReactNode
  /** Whether to show a divider line below the header */
  showDivider?: boolean
  /** Card content */
  children: React.ReactNode
  /** Additional className for the outer container */
  className?: string
  /** Additional inline styles for the outer container */
  style?: React.CSSProperties
}

export function SectionCard({
  title,
  action,
  showDivider = false,
  children,
  className,
  style,
}: SectionCardProps) {
  const sectionId = React.useId()

  return (
    <Tile
      id={`section-card-${sectionId}`}
      layoutMode="block"
      background="card"
      borderRadius="xl"
      shadowed
      padding={16}
      className={className}
      style={style}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['3'] }}>
        {title && (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h3
                style={{
                  fontSize: fontSizes.lg,
                  fontWeight: 600,
                  color: text.heading,
                  margin: 0,
                }}
              >
                {title}
              </h3>
              {action && <div style={{ display: 'flex', alignItems: 'center' }}>{action}</div>}
            </div>
            {showDivider && (
              <div style={{ height: '1px', backgroundColor: border.default }} />
            )}
          </>
        )}
        <div>{children}</div>
      </div>
    </Tile>
  )
}
