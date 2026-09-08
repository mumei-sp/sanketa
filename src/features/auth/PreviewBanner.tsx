/**
 * The bar that says you are not looking at your own app.
 *
 * Rendered by the layout, outside every permission gate, and deliberately so:
 * previewing a role that cannot open settings hides the screen the preview was
 * started from, and an exit that lived in there would be a trapdoor. The way
 * out has to be reachable from a view that can reach nothing.
 *
 * Floating rather than a top strip. A full-width bar means either pushing the
 * whole layout down — which changes what is being previewed — or overlapping a
 * sticky header that is already at the top on mobile.
 */

import { Eye, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePermissions } from './PermissionContext'

export function PreviewBanner() {
  const { preview, stopPreview, realRole } = usePermissions()
  if (!preview) return null

  const { role, personName, scope, withheld } = preview
  const axis = role.scopeBy

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]"
      // The bar itself takes pointer events; the strip around it must not, or
      // it would eat clicks along the bottom of every page.
      style={{ pointerEvents: 'none' }}
    >
      <div
        className="flex max-w-full items-center gap-2.5 rounded-full border px-3 py-1.5 shadow-lg"
        style={{
          pointerEvents: 'auto',
          backgroundColor: 'var(--heading)',
          borderColor: 'var(--heading)',
          color: 'var(--card)',
        }}
      >
        <Eye className="size-4 shrink-0" aria-hidden />

        <span className="min-w-0 text-caption">
          <span className="font-semibold">
            Viewing as {personName ?? role.name}
          </span>
          <span className="hidden opacity-80 sm:inline">
            {personName ? ` · ${role.name}` : ''}
            {axis === 'classes' &&
              (scope.classSections.length === 0
                ? ' · no classes assigned'
                : ` · ${scope.classSections.length} ${scope.classSections.length === 1 ? 'class' : 'classes'}`)}
            {axis === 'students' &&
              (scope.studentIds.length === 0
                ? ' · no records linked'
                : ` · ${scope.studentIds.length} ${scope.studentIds.length === 1 ? 'record' : 'records'}`)}
            {/* Saving still happens as the real user — the preview changes
                what is drawn, not who is signed in. Worth one clause. */}
            {' · you still act as '}
            {realRole?.name ?? 'yourself'}
          </span>
        </span>

        {withheld.length > 0 && (
          <span
            className="hidden shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium sm:inline"
            style={{ backgroundColor: 'rgba(255,255,255,0.18)' }}
            title={`This role also holds ${withheld.length} permission${
              withheld.length === 1 ? '' : 's'
            } you do not, which this view leaves out.`}
          >
            limited to what you can do
          </span>
        )}

        <Button
          size="sm"
          variant="ghost"
          onClick={stopPreview}
          className="h-7 shrink-0 gap-1 rounded-full px-2 hover:bg-white/20"
          style={{ color: 'var(--card)' }}
        >
          <X className="size-3.5" />
          Exit
        </Button>
      </div>
    </div>
  )
}
