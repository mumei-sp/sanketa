/**
 * Route-level permission gate.
 *
 * Filtering the sidebar hides a page; this is what stops someone reaching it
 * by typing the URL, following a stale bookmark, or clicking a deep link
 * someone else pasted them. Both are needed — neither alone is enough.
 *
 * It renders the Forbidden page in place rather than redirecting, so the
 * address bar still shows what was asked for and a refresh does not silently
 * land somewhere else.
 */

import { Suspense, lazy } from 'react'
import type * as React from 'react'
import { Outlet } from 'react-router-dom'
import { usePermissions } from '../PermissionContext'
import type { Permission } from '@/config/permissions'

const Forbidden = lazy(() => import('@/pages/Forbidden'))

/**
 * Used two ways: as a layout route (no children, renders an `<Outlet />`) and
 * as a plain wrapper. Index routes cannot have children, so the dashboard
 * needs the second form.
 */
export function RequirePermission({
  permission,
  children,
}: {
  permission: Permission
  children?: React.ReactNode
}) {
  const { can, isReady } = usePermissions()

  // Hold the frame until the roles table lands. Rendering the denial first
  // would flash "no access" at people who have it.
  if (!isReady) return null

  if (!can(permission)) {
    return (
      <Suspense fallback={null}>
        <Forbidden />
      </Suspense>
    )
  }

  return children ? <>{children}</> : <Outlet />
}
