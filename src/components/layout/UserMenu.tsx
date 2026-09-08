/**
 * The avatar in the top-right, and the menu behind it.
 *
 * The avatar has always been there and has never done anything — which on a
 * desktop left no way to sign out at all, since the only Logout lives in the
 * sidebar footer and, until recently, the identity block was desktop-only.
 * An avatar in a top bar is the conventional home for account actions, so it
 * now holds them.
 *
 * The name and role stay visible beside it from `lg` up rather than moving
 * into the menu: knowing who you are signed in as is worth a permanent glance
 * on a wide screen, and hiding it behind a click would be a regression.
 */

import { LogOut, Settings } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { authUtils } from '@/api/utils/auth'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useSchoolConfig } from '@/config/SchoolConfigContext'
import { usePermissions } from '@/features/auth/PermissionContext'
import { getInitials } from '@/utils/format'

export function UserMenu() {
  const currentUser = useCurrentUser()
  const navigate = useNavigate()
  const { setSettingsOpen } = useSchoolConfig()
  const { canAny } = usePermissions()

  if (!currentUser) return null

  const handleSignOut = () => {
    authUtils.removeToken()
    navigate('/login', { replace: true })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2.5 rounded-full text-left focus-visible:outline-2 focus-visible:outline-ring"
          aria-label={`Account menu for ${currentUser.fullName}`}
        >
          <span
            aria-hidden
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-opacity hover:opacity-90"
            style={{
              backgroundColor: 'var(--heading)',
              color: 'var(--card)',
              boxShadow: '0 0 0 2px var(--card), 0 0 0 4px var(--primary)',
            }}
          >
            {getInitials(currentUser.fullName)}
          </span>
          <span className="hidden lg:block">
            <span
              className="block text-sm font-semibold leading-tight whitespace-nowrap"
              style={{ color: 'var(--heading)' }}
            >
              {currentUser.fullName}
            </span>
            <span className="block text-xs leading-tight text-muted-foreground">
              {currentUser.role}
            </span>
          </span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        {/* Repeated here because the name beside the avatar is hidden below
            `lg`, and a menu that opens with no idea whose account it is would
            be a poor thing to sign out from. */}
        <DropdownMenuLabel className="lg:hidden">
          <span className="block truncate font-semibold">{currentUser.fullName}</span>
          <span className="block truncate text-xs font-normal text-muted-foreground">
            {currentUser.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="lg:hidden" />

        {canAny(['settings.manage', 'roles.manage']) && (
          <>
            <DropdownMenuItem onSelect={() => setSettingsOpen(true)}>
              <Settings />
              School settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem variant="destructive" onSelect={handleSignOut}>
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
