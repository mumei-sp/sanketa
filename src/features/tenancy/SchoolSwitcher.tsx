/**
 * Which school you are looking at, for the people who have more than one.
 *
 * Almost nobody does. A member of staff works at one school and should never
 * be asked to say so, which is why this renders nothing at all unless the
 * session's token authorises two or more — and why the backend falls back to
 * the first tenant when a request names none.
 *
 * ── Why switching reloads ─────────────────────────────────────────────
 * Because every row in the app changes. Students, staff, roles, marks, fees,
 * the notice board — all of it is per-school, and the page you are standing on
 * may not exist at the other school at all: a student's detail page is a 404
 * there, and a class called 8A is a different eight children.
 *
 * The stores drop their caches on a switch, but that is only half of it —
 * fetched page state, memoised contexts and the current route would all need
 * invalidating, and the honest way to invalidate everything is to start again.
 * It is also what the backend does: the next request carries a different
 * `X-Active-Tenant-Id` and is answered from a different schema. So this lands
 * on the dashboard rather than trying to keep your place somewhere that may
 * not be there.
 */

import * as React from 'react'
import { Check, ChevronsUpDown, School } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { useCurrentUser } from '@/hooks/use-current-user'
import { listTenants } from '@/mocks/global'
import { switchTenant } from '@/mocks/auth/tenant-context-token'
import { activeTenant } from '@/mocks/_shared/tenant-context'

export function SchoolSwitcher({ variant = 'pill' }: { variant?: 'pill' | 'bar' }) {
  const currentUser = useCurrentUser()

  /**
   * Names for the codes the token authorises, in the token's order.
   *
   * Driven by the token rather than by the tenants table, so a school this
   * person does not hold cannot appear in the menu — the 403 exists as a
   * backstop, not as the thing standing between them and another school's
   * data.
   */
  const schools = React.useMemo(() => {
    // Read inside rather than above, so the fallback does not allocate a new
    // empty array on every render and re-run this for nothing.
    const codes = currentUser?.tenantCodes ?? []
    const known = listTenants()
    return codes.flatMap(code => {
      const tenant = known.find(candidate => candidate.code === code)
      return tenant ? [tenant] : []
    })
  }, [currentUser?.tenantCodes])

  const [busy, setBusy] = React.useState(false)

  // One school is not a choice, and no session is not a menu.
  if (schools.length < 2) return null

  const current = schools.find(school => school.schema === activeTenant()) ?? schools[0]

  const go = (code: string, schema: string) => {
    if (schema === activeTenant() || busy) return
    setBusy(true)
    try {
      switchTenant(code)
      // Assign rather than router-navigate: the point is to re-mount
      // everything, and a client-side navigation keeps every store and context
      // that was built against the last school.
      window.location.assign('/')
    } catch (error) {
      // The token said no. Nothing has changed, so say so and stay put.
      console.error('Refused to switch school', error)
      setBusy(false)
    }
  }

  const shape =
    variant === 'pill'
      ? 'h-10 rounded-full bg-card border border-border shadow-sm px-3'
      : 'h-10 rounded-lg hover:bg-muted px-2'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={`${shape} gap-2 font-medium`}
          disabled={busy}
          aria-label={`School: ${current.name}. Change school`}
        >
          <School className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="hidden max-w-[160px] truncate lg:inline">{current.name}</span>
          <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-caption text-muted-foreground">
          You work at {schools.length} schools
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {schools.map(school => (
          <DropdownMenuItem
            key={school.code}
            onSelect={() => go(school.code, school.schema)}
            className="gap-2"
          >
            <Check
              className={`size-4 shrink-0 ${school.code === current.code ? 'opacity-100' : 'opacity-0'}`}
              aria-hidden
            />
            <span className="truncate">{school.name}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-caption font-normal text-muted-foreground">
          Changing school reloads the app — its students, staff and records are
          separate.
        </DropdownMenuLabel>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
