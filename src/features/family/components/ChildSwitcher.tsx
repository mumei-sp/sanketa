/**
 * Whose records am I looking at.
 *
 * Absent entirely for one child, because a picker with a single option is a
 * control that cannot be used — it just asks the reader to check whether it
 * matters. A student, who is always looking at themselves, never sees it.
 */

import { useFamilyScope } from '../FamilyScopeContext'
import { border, text } from '@/theme/colors'
import { cn } from '@/lib/utils'
import { getInitials } from '@/utils/format'
import { getDisplayName } from '@/features/students/utils/formatting'
import { classSectionOf } from '@/utils/class-section-helpers'

export function ChildSwitcher() {
  const { children, selected, selectChild } = useFamilyScope()
  if (children.length < 2) return null

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Choose a child">
      {children.map(child => {
        const id = String(child.id)
        const name = getDisplayName(child)
        const on = selected && String(selected.id) === id
        return (
          <button
            key={id}
            type="button"
            aria-pressed={Boolean(on)}
            onClick={() => selectChild(id)}
            className={cn(
              'flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-left transition-colors',
              on ? 'shadow-sm' : 'hover:bg-muted/50',
            )}
            style={{
              borderColor: on ? 'var(--heading)' : border.default,
              backgroundColor: on ? 'var(--card)' : 'transparent',
              boxShadow: on ? '0 0 0 1px var(--heading)' : undefined,
            }}
          >
            <span
              aria-hidden
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
              style={{ backgroundColor: 'var(--heading)', color: 'var(--card)' }}
            >
              {getInitials(name)}
            </span>
            <span className="min-w-0">
              <span
                className="block truncate text-body font-medium"
                style={{ color: 'var(--heading)' }}
              >
                {name}
              </span>
              <span className="block text-caption" style={{ color: text.muted }}>
                {classSectionOf(child) ?? 'No class'}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
