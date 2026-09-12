/**
 * Where this person can go, and which of those they are currently in.
 *
 * One fan-out, held for the session. Mounted above both the chooser and the
 * app, because the same answer drives four things that must never disagree:
 * whether to ask at all, what the chooser offers, what the top bar says, and
 * whether the account menu offers a way back. They each used to be capable of
 * deciding for themselves, which is how `SchoolSwitcher` and
 * `NoRoleHereNotice` came to answer "how many schools?" separately.
 *
 * ── Why switching is a page load ───────────────────────────────────────
 * The same reason switching school is — see `session-navigation`. Most of the
 * mock's tenant-resolved fixtures are module constants read once at import,
 * and a `const` cannot be rebuilt. Changing side changes less than changing
 * school, but it changes what every service returns and what every memoised
 * ability permits, and the honest way to invalidate all of that is a new
 * document. It also lands on the dashboard rather than trying to keep your
 * place: a parent has no business on the page a teacher was looking at.
 */

import * as React from 'react'
import { Outlet } from 'react-router-dom'
import { fetchContexts } from '@/api/services/context-service'
import { flattenContexts, isContextAvailable } from '@/mocks/global'
import type { TenantContexts, UserContext } from '@/mocks/global'
import { activeSide, setActiveSide, clearActiveSide } from '@/mocks/_shared/active-context'
import { activeTenant } from '@/mocks/_shared/tenant-context'
import { switchTenant } from '@/mocks/auth/tenant-context-token'
import { enterSession } from '@/features/auth/session-navigation'
import { useCurrentUser } from '@/hooks/use-current-user'

interface ContextsValue {
  /** Every school reachable, and the sides each offers. */
  tenants: TenantContexts[]
  /** The same, flattened — one entry per way in. */
  all: UserContext[]
  /**
   * The one being acted in, or null while loading or if there are none.
   *
   * Resolved from the stored side rather than stored whole, so it cannot
   * disagree with what `resolveActiveAccess` is narrowing by.
   */
  active: UserContext | null
  /**
   * True when there is a genuine choice to make and nobody has made it.
   *
   * One way in is not a choice — the overwhelming majority of people have
   * exactly one, and asking them would be asking a question with one answer.
   * The same rule `SchoolSwitcher` already applies to schools, applied to
   * contexts.
   */
  needsChoice: boolean
  /** False until the fan-out has answered. Ask nothing of the rest until then. */
  isReady: boolean
  /** Enter a context. Reloads: see the note above. */
  choose: (context: UserContext) => void
}

const Contexts = React.createContext<ContextsValue | null>(null)

/**
 * Remembers that this tab has already tried to rescue itself.
 *
 * The rescue below is a page load, so an in-memory flag would not survive it —
 * and without one, a recovery that failed to stick would reload forever.
 * Cleared the moment a context resolves, so a *later* stranding (a role revoked
 * while somebody is working) gets its own attempt rather than inheriting this
 * one's verdict.
 */
const RECOVERY_KEY = 'sanketa:context-recovery-attempted'

function markRecovery(attempted: boolean): void {
  try {
    if (attempted) sessionStorage.setItem(RECOVERY_KEY, '1')
    else sessionStorage.removeItem(RECOVERY_KEY)
  } catch {
    // Private mode. The rescue then runs at most once per document anyway,
    // because the reload it performs lands somewhere that resolves or does
    // not, and the `active === null` branch below stops asking either way.
  }
}

function recoveryAttempted(): boolean {
  try {
    return sessionStorage.getItem(RECOVERY_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * Put somebody back where they can actually work.
 *
 * Holding two memberships and a role at only one of them leaves exactly one
 * context, so the chooser does not ask — `needsChoice` wants more than one —
 * and nothing stops the app opening at the *other* school. What arrives is a
 * Forbidden page, an empty sidebar, and a notice advising them to switch school
 * beside a switcher that is not rendered, because that hides below two contexts
 * too. No way forward and no way out but signing out.
 *
 * One way in is not a choice, and that holds for recovery as much as for the
 * chooser: if there is precisely one place this person can be, put them in it
 * rather than asking. This is the same correction `applyTenantContext` makes
 * one layer up, where a stored tenant the token cannot honour is replaced
 * instead of stranding the session on it.
 *
 * Nothing is done when there is nowhere to go — no roles anywhere is a real
 * state, and `NoRoleHereNotice` is then telling the truth.
 */
function recoverIfStranded(answer: TenantContexts[]): void {
  const all = flattenContexts(answer)
  const side = activeSide()
  const resolves = all.some(
    context => context.tenantSchema === activeTenant() && context.side === side,
  )

  if (resolves) {
    markRecovery(false)
    return
  }
  // More than one and nobody has chosen is the chooser's job, not a stranding.
  if (all.length !== 1 || recoveryAttempted()) return

  markRecovery(true)
  const only = all[0]
  if (only.tenantSchema !== activeTenant()) {
    switchTenant(only.tenantCode)
  }
  setActiveSide(only.side)
  enterSession()
}

export function ContextsProvider() {
  const currentUser = useCurrentUser()
  const [tenants, setTenants] = React.useState<TenantContexts[]>([])
  const [isReady, setIsReady] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false
    if (!currentUser) {
      setTenants([])
      setIsReady(true)
      return
    }

    void fetchContexts()
      .then(answer => {
        if (cancelled) return
        setTenants(answer)

        // A side remembered from before a role was revoked is a stale
        // preference, not a claim — dropped here so the chooser asks again,
        // exactly as `applyTenantContext` drops a stale school.
        const side = activeSide()
        if (side !== null && !isContextAvailable(answer, activeTenant(), side)) {
          clearActiveSide()
        }

        recoverIfStranded(answer)
      })
      .catch((error: unknown) => {
        if (cancelled) return
        console.error('Failed to resolve profile contexts', error)
        // Empty, not "assume one". Nothing is offered and nothing is entered,
        // which is visibly broken rather than quietly wrong about who someone
        // is.
        setTenants([])
      })
      .finally(() => {
        if (!cancelled) setIsReady(true)
      })

    return () => {
      cancelled = true
    }
  }, [currentUser])

  const value = React.useMemo<ContextsValue>(() => {
    const all = flattenContexts(tenants)
    const schema = activeTenant()
    const side = activeSide()

    const active =
      all.find(context => context.tenantSchema === schema && context.side === side) ?? null

    return {
      tenants,
      all,
      active,
      needsChoice: isReady && all.length > 1 && active === null,
      isReady,
      choose: (context: UserContext) => {
        // The school first, because the side is stored against it — and
        // through `switchTenant`, so a school outside the token's claim is
        // refused here exactly as it would be on the server.
        if (context.tenantSchema !== activeTenant()) {
          switchTenant(context.tenantCode)
        }
        setActiveSide(context.side)
        enterSession()
      },
    }
  }, [tenants, isReady])

  return (
    <Contexts.Provider value={value}>
      <Outlet />
    </Contexts.Provider>
  )
}

export function useContexts(): ContextsValue {
  const value = React.useContext(Contexts)
  if (!value) {
    throw new Error('useContexts must be used inside a ContextsProvider')
  }
  return value
}
