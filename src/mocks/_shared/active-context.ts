/**
 * Which of a person's lives at a school this session is being lived in.
 *
 * The sibling of `tenant-context`, and deliberately shaped like it. That file
 * remembers *which school* a call is against; this one remembers *as whom*.
 * Both are client choices checked against a server-issued authority — the
 * school against the context token's `tenantIds`, the side against the roles
 * the profile actually holds there — and neither is a permission in itself.
 *
 * ── Why a side is remembered per school ────────────────────────────────
 * Because it does not travel. Somebody who is staff at one school and a parent
 * at another has a different answer at each, and a single stored value would
 * follow them across a switch and be wrong at the far end. So this is a map
 * keyed by tenant, which also means switching away and back returns you to the
 * side you were last on there — the behaviour anyone would expect and the one
 * a scalar cannot give.
 *
 * ── Why it is not in the token ─────────────────────────────────────────
 * The context token carries `tenantIds` because tenant routing has to happen
 * before any business logic — the server cannot pick a schema without it. The
 * side needs no such head start: by the time it matters the schema is already
 * chosen and `profile_roles` is readable. Putting it in the token would also
 * mean re-minting one every time somebody switched between their work and
 * their child, which is a fifteen-minute credential being spent on a
 * preference.
 */

import type { ContextSide } from '@/config/permissions'
import { activeTenant } from './tenant-context'

/**
 * Where the client remembers it.
 *
 * Alongside `sanketa:active-tenant` rather than inside it: the two are set and
 * cleared at different moments, and a school switch must be able to change one
 * without rewriting the other.
 */
const STORAGE_KEY = 'sanketa:active-side'

/** `{ [tenantSchema]: side }`. Keyed by schema, as the storage keys are. */
type SideMap = Record<string, ContextSide>

const isSide = (value: unknown): value is ContextSide => value === 'staff' || value === 'family'

function readMap(): SideMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return {}
    // Filtered rather than trusted: a value written by an older build, or by
    // hand, must not become a side nothing can resolve.
    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>).filter(([, side]) => isSide(side)),
    ) as SideMap
  } catch {
    // Unparseable, or unavailable in private mode. No remembered choice is a
    // valid state — the chooser asks again.
    return {}
  }
}

function writeMap(map: SideMap): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    // Private mode or quota. The choice still holds for this document, which
    // is as long as it needs to: switching side reloads the app.
  }
}

/**
 * The side chosen at the active school, or null if none has been.
 *
 * Null is a real answer and not a default. It means "nobody has picked yet",
 * which is what sends a person with more than one context to the chooser
 * rather than into an arbitrary half of their own account. Callers that need a
 * side to resolve access with should treat null as "not ready" — see
 * `resolveActiveAccess`, which falls back to the whole profile rather than
 * guessing a half of it.
 */
export function activeSide(): ContextSide | null {
  return readMap()[activeTenant()] ?? null
}

/**
 * Remember a side for the active school.
 *
 * Does not check that the person holds any role on it — that is
 * `assertSideAvailable`'s job in the context service, for the same reason
 * `setActiveTenant` does no checking: putting the guard inside the setter puts
 * it below the thing it guards.
 */
export function setActiveSide(side: ContextSide): void {
  const map = readMap()
  map[activeTenant()] = side
  writeMap(map)
}

/**
 * Forget the side chosen at one school, or at the active one.
 *
 * Used when a remembered side no longer resolves — a role revoked since it was
 * chosen — so the chooser asks again instead of serving an empty app.
 */
export function clearActiveSide(tenantSchema?: string): void {
  const map = readMap()
  delete map[tenantSchema ?? activeTenant()]
  writeMap(map)
}

/** Forget every remembered side. Used when a session ends. */
export function resetActiveSides(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing to forget.
  }
}
