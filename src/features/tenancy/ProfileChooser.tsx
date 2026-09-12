/**
 * The screen between signing in and the app.
 *
 * Sign-in used to make this choice silently — `setActiveTenant(tenants[0])` in
 * the auth mock, and the union of every role the person held. That is right
 * for the overwhelming majority, who have exactly one way in, and wrong for
 * everyone else: the member of staff whose child attends was handed both lives
 * at once, which is how a principal could reach her own child's marks and how
 * the access log could not say which of the two she was acting as.
 *
 * So the line becomes a question, asked only of the people it is a question
 * for. One way in is not a choice; three of the five seeded logins never see
 * this screen.
 *
 * ── Why the school dropdown appears when it does ──────────────────────
 * When there is more than one school *and* at least one of them offers more
 * than one way in. Below that the tiles are the whole question, and a dropdown
 * would add a click to reach something already on screen — which is worst for
 * the commonest multi-school person there is, a parent with a child at each,
 * who would otherwise open a menu to reach a tile that could have been beside
 * the first one.
 */

import * as React from 'react'
import { Check, ChevronsUpDown, LogOut } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { logout } from '@/api/services/auth-service'
import { leaveSession } from '@/features/auth/session-navigation'
import { useCurrentUser } from '@/hooks/use-current-user'
import { activeTenant } from '@/mocks/_shared/tenant-context'
import type { TenantContexts } from '@/mocks/global'
import { useContexts } from './ContextsProvider'
import { ProfileTile, PendingSchoolTile } from './ProfileTile'

/** The brand lockup, unlinked — there is nowhere to go from here but in. */
function Wordmark() {
  return (
    <span className="flex items-center gap-2.5">
      <span
        aria-hidden
        className="flex size-9 items-center justify-center rounded-lg text-lg font-extrabold"
        style={{ backgroundColor: 'var(--heading)', color: 'var(--card)' }}
      >
        S
      </span>
      <span className="text-lg font-bold" style={{ color: 'var(--heading)' }}>
        Sanketa
      </span>
    </span>
  )
}

/**
 * How many ways in a school offers, said plainly.
 *
 * Zero is the state worth naming: a school you belong to and have no role in.
 */
function countLabel(tenant: TenantContexts): string {
  const count = tenant.sides.length
  if (count === 0) return 'No role here yet'
  return count === 1 ? '1 profile here' : `${count} profiles here`
}

function SchoolPicker({
  tenants,
  selected,
  onSelect,
}: {
  tenants: TenantContexts[]
  selected: TenantContexts
  onSelect: (code: string) => void
}) {
  return (
    <div
      className="flex items-center justify-between gap-4 border-b pb-3"
      style={{ borderColor: 'var(--border)' }}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {/* The `bar` treatment SchoolSwitcher already ships: inside a content
              column a raised pill is over-dressed, and anchoring the control to
              the grid's edge stops it sliding sideways as the name changes. */}
          <Button variant="ghost" className="-ml-2.5 h-11 gap-2.5 rounded-lg px-2.5">
            <span
              aria-hidden
              className="flex size-7 items-center justify-center rounded-lg text-caption font-bold"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--heading-accent, var(--heading))' }}
            >
              {selected.tenantName.slice(0, 2).toUpperCase()}
            </span>
            <span className="text-base font-bold" style={{ color: 'var(--heading)' }}>
              {selected.tenantName}
            </span>
            <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          // Explicit, not `w-72`: this project remaps Tailwind's numeric
          // spacing to a compact scale, so `w-72` is 152px rather than the
          // 288px it reads as — and two lines of name and school do not fit.
          className="w-[17rem]"
        >
          <DropdownMenuLabel className="text-caption font-normal text-muted-foreground">
            You have access to {tenants.length} schools
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {tenants.map(tenant => (
            <DropdownMenuItem
              key={tenant.tenantCode}
              onSelect={() => onSelect(tenant.tenantCode)}
              className="gap-2.5"
            >
              <Check
                className={`size-4 shrink-0 ${
                  tenant.tenantCode === selected.tenantCode ? 'opacity-100' : 'opacity-0'
                }`}
                aria-hidden
              />
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-semibold">{tenant.tenantName}</span>
                <span className="truncate text-caption text-muted-foreground">
                  {countLabel(tenant)}
                </span>
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
        {countLabel(selected)}
      </span>
    </div>
  )
}

export default function ProfileChooser() {
  const currentUser = useCurrentUser()
  const { tenants, isReady, choose } = useContexts()

  /**
   * Which school's tiles are on screen.
   *
   * Starts on the active one, so arriving here from inside the app shows where
   * you already were rather than resetting to the first school in the list.
   */
  const [selectedCode, setSelectedCode] = React.useState<string | null>(null)

  const selected = React.useMemo(() => {
    if (tenants.length === 0) return null
    if (selectedCode) {
      const named = tenants.find(tenant => tenant.tenantCode === selectedCode)
      if (named) return named
    }
    const schema = activeTenant()
    return tenants.find(tenant => tenant.tenantSchema === schema) ?? tenants[0]
  }, [tenants, selectedCode])

  // More than one school, and at least one of them a real choice in itself.
  const showPicker = tenants.length > 1 && tenants.some(tenant => tenant.sides.length > 1)
  const visible = showPicker && selected ? [selected] : tenants

  const handleSignOut = () => {
    // Same contract as the account menu: revoke rather than forget, and leave
    // by a page load so no module built against this session survives.
    void logout().finally(leaveSession)
  }

  return (
    <div
      className="flex min-h-svh flex-col"
      style={{
        backgroundColor: 'var(--background)',
        backgroundImage: 'var(--app-aurora)',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <header className="flex items-center justify-between gap-4 px-6 py-5 sm:px-10">
        <Wordmark />
        <div className="flex items-center gap-3">
          {currentUser && (
            <span className="hidden text-sm sm:inline" style={{ color: 'var(--text-muted)' }}>
              Signed in as{' '}
              <span className="font-semibold" style={{ color: 'var(--heading)' }}>
                {currentUser.fullName}
              </span>
            </span>
          )}
          <Button variant="ghost" className="h-11 gap-2 rounded-lg px-3" onClick={handleSignOut}>
            <LogOut className="size-4" aria-hidden />
            Sign out
          </Button>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 pb-16 sm:px-10">
        <div className="flex w-full max-w-3xl flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-2.5 text-center">
            <h1
              className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl"
              style={{ color: 'var(--heading)' }}
            >
              Continue as
            </h1>
            <p className="max-w-xl text-pretty text-base" style={{ color: 'var(--text-body)' }}>
              {showPicker
                ? 'Pick a school, then how you want to open it.'
                : 'What you see, and what you can change, depends on which you pick.'}
            </p>
          </div>

          {!isReady ? (
            <div className="grid w-full gap-5 sm:grid-cols-2" aria-busy>
              <Skeleton className="h-72 rounded-2xl" />
              <Skeleton className="h-72 rounded-2xl" />
            </div>
          ) : (
            <div className="flex w-full flex-col gap-5">
              {showPicker && selected && (
                <SchoolPicker tenants={tenants} selected={selected} onSelect={setSelectedCode} />
              )}

              <div className="grid w-full gap-5 sm:grid-cols-2">
                {visible.flatMap(tenant =>
                  tenant.sides.length === 0
                    ? [
                        <PendingSchoolTile
                          key={`${tenant.tenantCode}:pending`}
                          tenantName={tenant.tenantName}
                        />,
                      ]
                    : tenant.sides.map(context => (
                        <ProfileTile key={context.id} context={context} onChoose={choose} />
                      )),
                )}
              </div>
            </div>
          )}

          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Sanketa remembers this. You can switch from your profile menu at any time.
          </p>
        </div>
      </main>
    </div>
  )
}
