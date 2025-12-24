import * as React from 'react'
import { Tile } from '@/components/tile'
import { cn } from '@/lib/utils'

/**
 * Props for FormSection component
 */
export interface FormSectionProps {
  /** Section title */
  title: string
  /** Optional section description */
  description?: string
  /** Section content */
  children: React.ReactNode
  /** Grid column span (for use in TileWrapper grid) */
  width?: number
  /** Additional className */
  className?: string
}

/**
 * FormSection - A wrapper component for form sections using Tile.
 * Provides consistent card-like styling with title and description.
 */
export function FormSection({ title, description, children, width, className }: FormSectionProps) {
  const sectionId = React.useId()

  return (
    <Tile
      id={`form-section-${sectionId}`}
      layoutMode="grid"
      width={width}
      background="card"
      shadowed={true}
      borderRadius="lg"
      padding="p-6"
      className={cn('space-y-4', className)}
    >
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </Tile>
  )
}
