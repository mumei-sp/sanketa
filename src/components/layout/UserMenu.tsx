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

import { useNavigate } from 'react-router-dom'
import { LogOut, Repeat, Settings } from 'lucide-react'
import { leaveSession } from '@/features/auth/session-navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { logout } from '@/api/services/auth-service'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useRoleLabel } from '@/hooks/use-role-label'
import { useContexts } from '@/features/tenancy/ContextsProvider'
import { CHOOSE_PROFILE_PATH } from '@/features/tenancy/RequireContext'
import { useSchoolConfig } from '@/config/SchoolConfigContext'
import { usePermissions } from '@/features/auth/PermissionContext'
import { getInitials } from '@/utils/format'

export function UserMenu() {
  const roleLabel = useRoleLabel()
  const currentUser = useCurrentUser()
  const { setSettingsOpen } = useSchoolConfig()
  const { canAny } = usePermissions()
  const { all } = useContexts()
  const navigate = useNavigate()

  if (!currentUser) return null

  const handleSignOut = () => {
    // Revoke, not just forget: clearing storage alone leaves a refresh token
    // that still buys a new session, which matters on a shared machine.
    //
    // `leaveSession` is a page load rather than a route change — see the file
    // it lives in. Hung off `finally` so a failed revoke cannot strand someone
    // on a page they meant to leave; the local token is already gone, since
    // `logout` clears it before its first `await`.
    void logout().finally(leaveSession)
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
            <span className="block text-xs leading-tight text-muted-foreground">{roleLabel}</span>
          </span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        // Explicit, not `w-56`: this project remaps Tailwind's numeric spacing
        // to a compact scale, so `--spacing-56` is 7.5rem and `w-56` renders a
        // 120px menu rather than the 224px it reads as. That was survivable
        // while every item was one short word, and wrapped "Switch profile"
        // onto two lines the moment one was not.
        className="w-[14rem]"
      >
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

        {/* Only for the people it is a question for — the same rule the
            chooser itself applies, read from the same place so the two cannot
            disagree. Someone with one way in is offered nothing to switch to. */}
        {all.length > 1 && (
          <>
            <DropdownMenuItem
              onSelect={() => navigate(CHOOSE_PROFILE_PATH)}
              // Stated rather than computed: the label sits in nested flex
              // spans, and the accessibility tree exposes the item unnamed —
              // where the single-text-node items beside it resolve fine.
              aria-label={`Switch profile — ${all.length} available`}
            >
              <Repeat />
              <span className="flex flex-col">
                <span>Switch profile</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {all.length} available
                </span>
              </span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {canAny(['system.settings', 'roles.manage', 'users.read']) && (
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
