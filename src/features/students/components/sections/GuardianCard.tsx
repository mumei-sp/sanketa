import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Props for GuardianCard component
 */
export interface GuardianCardProps {
  /** Card title */
  title: React.ReactNode
  /** Card content */
  children: React.ReactNode
  /** Additional className */
  className?: string
}

/**
 * GuardianCard - A reusable card component for guardian information sections.
 * Provides consistent styling with gray background.
 */
export function GuardianCard({ title, children, className }: GuardianCardProps) {
  return (
    <div className={cn('space-y-4 rounded-lg p-4', 'bg-page', className)}>
      <h4 className="text-sm font-semibold text-gray-700">{title}</h4>
      {children}
    </div>
  )
}
