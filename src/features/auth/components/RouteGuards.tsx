import { Navigate, Outlet } from 'react-router-dom'
import { authUtils } from '@/api/utils/auth'

/**
 * AuthGuard - Protects routes that require authentication.
 * Redirects to /login if user is not authenticated.
 */
export function AuthGuard() {
  if (!authUtils.isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}

/**
 * GuestGuard - Protects routes that should only be accessible to unauthenticated users.
 * Redirects to / (dashboard) if user is already authenticated.
 */
export function GuestGuard() {
  if (authUtils.isAuthenticated()) {
    return <Navigate to="/" replace />
  }
  return <Outlet />
}
