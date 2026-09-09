/**
 * The Tenant Context Token, and the filter that checks it.
 *
 * Fabric issues a PASETO after Keycloak authenticates, carrying the user id
 * and every tenant they may reach, with a 900-second life and its hash
 * recorded in `fabric_sessions` so it can be revoked. Every request then
 * carries it in `X-Tenant-Context-Token` alongside `X-Active-Tenant-Id`, and
 * `TenantContextTokenFilter` validates the first, checks the second against
 * the claim, and 403s a tenant the caller does not hold.
 *
 * This is that contract, in a browser.
 *
 * ── What is real and what is theatre ───────────────────────────────────
 * Real: the claim set, the 900-second TTL, the header names, the fallback to
 * the first tenant when no active one is named, the 403 on a tenant outside
 * the claim, and the hash in the session table.
 *
 * Theatre: the cryptography. A `v4.local` PASETO is encrypted with a key the
 * client never sees, and a mock running *in* the client cannot keep a secret
 * from it — the payload here is base64, readable by anyone who looks. That is
 * fine and worth being blunt about: what this reproduces is the shape and the
 * refusals, so the client is written against the real contract. It is not a
 * security boundary and must never be mistaken for one.
 */

import { globalKey } from '@/mocks/_shared/tenant-context'
import { activeTenant, setActiveTenant } from '@/mocks/_shared/tenant-context'

/** `token-ttl-seconds: 900` in fabric's `application.yml`. */
const TTL_SECONDS = 900

/** Fabric's `token-header-name`. Where the client keeps what it sends. */
const CLIENT_KEY = 'sanketa:tenant-context-token'

/** Hashes of issued tokens — the mock's `fabric_sessions.session_token_hash`. */
const ISSUED_TABLE = 'tct-hashes'

export interface TenantContextClaims {
  /** `uid` — the global user id. */
  uid: string
  /**
   * `tenantIds` — every school this token authorises.
   *
   * The authority. A request naming a school outside this list is refused,
   * which is the whole reason the list is minted by the server at sign-in and
   * not assembled by the client.
   */
  tenantIds: string[]
  /** Epoch seconds. */
  iat: number
  exp: number
}

/** Not a hash. A short, stable digest, which is all a mock needs to match on. */
function digest(value: string): string {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (Math.imul(31, hash) + value.charCodeAt(i)) | 0
  }
  return `h${(hash >>> 0).toString(36)}`
}

function readHashes(): string[] {
  try {
    const raw = localStorage.getItem(globalKey(ISSUED_TABLE))
    const parsed = raw ? (JSON.parse(raw) as string[]) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeHashes(hashes: string[]): void {
  try {
    localStorage.setItem(globalKey(ISSUED_TABLE), JSON.stringify(hashes.slice(-20)))
  } catch {
    // Private mode; revocation degrades to "not tracked", which the mock can
    // survive and a server could not.
  }
}

/**
 * Mint a token. Fabric's `TenantContextTokenService.generateToken`.
 *
 * Shaped `v4.local.<payload>` so it is opaque to every caller that should
 * treat it as opaque, and so the one place that parses it is this file.
 */
export function issueContextToken(uid: string, tenantIds: string[]): string {
  const now = Math.floor(Date.now() / 1000)
  const claims: TenantContextClaims = {
    uid,
    tenantIds: [...tenantIds],
    iat: now,
    exp: now + TTL_SECONDS,
  }
  const token = `v4.local.${btoa(JSON.stringify(claims))}`
  writeHashes([...readHashes(), digest(token)])
  return token
}

export type TenantContextCode =
  | 'TOKEN_INVALID'
  | 'TOKEN_EXPIRED'
  | 'TOKEN_REVOKED'
  | 'TENANT_FORBIDDEN'

export class TenantContextError extends Error {
  // Assigned rather than declared as constructor parameter properties, which
  // `erasableSyntaxOnly` forbids — the project compiles types away entirely
  // rather than emitting the runtime assignment TypeScript would generate.
  readonly code: TenantContextCode
  readonly status: 401 | 403

  constructor(code: TenantContextCode, status: 401 | 403, message: string) {
    super(message)
    this.name = 'TenantContextError'
    this.code = code
    this.status = status
  }
}

/** Parse and check a token. Everything the filter does before it looks at the header. */
export function verifyContextToken(token: string | null): TenantContextClaims {
  if (!token || !token.startsWith('v4.local.')) {
    throw new TenantContextError('TOKEN_INVALID', 401, 'No tenant context token.')
  }
  let claims: TenantContextClaims
  try {
    claims = JSON.parse(atob(token.slice('v4.local.'.length))) as TenantContextClaims
  } catch {
    throw new TenantContextError('TOKEN_INVALID', 401, 'Malformed tenant context token.')
  }
  if (!claims.uid || !Array.isArray(claims.tenantIds)) {
    throw new TenantContextError('TOKEN_INVALID', 401, 'Tenant context token is missing claims.')
  }
  // Checked before the hash, because an expired token that was never issued
  // here is still expired, and the more specific answer is the more useful one.
  if (Math.floor(Date.now() / 1000) >= claims.exp) {
    throw new TenantContextError('TOKEN_EXPIRED', 401, 'Tenant context token has expired.')
  }
  if (!readHashes().includes(digest(token))) {
    throw new TenantContextError('TOKEN_REVOKED', 401, 'Tenant context token is not recognised.')
  }
  return claims
}

/**
 * Which school this call acts on — `TenantContext.getEffectiveTenantId()`.
 *
 * The header is a *choice* and the claim is the *authority*, so the choice is
 * only ever honoured after being checked against the claim. A caller naming a
 * school it does not hold gets 403 rather than that school's data, which is
 * the refusal this whole file exists for.
 *
 * No choice falls back to the first tenant in the claim, as the real filter
 * does, so somebody with one school never has to name it.
 */
export function effectiveTenant(claims: TenantContextClaims, requested: string | null): string {
  if (!requested) return claims.tenantIds[0]
  if (!claims.tenantIds.includes(requested)) {
    throw new TenantContextError(
      'TENANT_FORBIDDEN',
      403,
      `Access denied to tenant: ${requested}`,
    )
  }
  return requested
}

// ── Client side: what the browser stores and sends ────────────────────

export function storeContextToken(token: string): void {
  try {
    localStorage.setItem(CLIENT_KEY, token)
  } catch {
    // Private mode; the session still works for as long as the tab lives.
  }
}

export function readContextToken(): string | null {
  try {
    return localStorage.getItem(CLIENT_KEY)
  } catch {
    return null
  }
}

export function clearContextToken(): void {
  try {
    localStorage.removeItem(CLIENT_KEY)
    localStorage.removeItem(globalKey(ISSUED_TABLE))
  } catch {
    // Nothing to clear.
  }
}

/**
 * Change school, refusing one this token does not authorise.
 *
 * The guarded counterpart to `setActiveTenant`, which does no checking on
 * purpose — putting the check inside the setter would put the guard below the
 * thing it guards, and the store layer has no business knowing about tokens.
 * Everything that switches on a person's behalf comes through here.
 */
export function switchTenant(tenantCode: string): void {
  const claims = verifyContextToken(readContextToken())
  setActiveTenant(effectiveTenant(claims, tenantCode))
}

/**
 * The filter, for one mock call. Returns the school the call acts on.
 *
 * ── Why a stale preference is corrected and not refused ────────────────
 * Two things look alike and are not. Someone *asking* for a school they do not
 * hold is refused — that is `switchTenant`, and it throws. But the active
 * school also survives in `localStorage` across sessions, and a value left
 * there by whoever signed in last is not a claim of entitlement, it is a stale
 * preference. Refusing it means every call in the app throws and the person
 * cannot reach even their own school to fix it.
 *
 * So the preference is dropped and the first authorised school used instead,
 * which is exactly what a client would do on receiving the server's 403: clear
 * the bad header and retry. The refusal has not gone anywhere; it has moved to
 * the place where somebody actually asked for something.
 */
export function applyTenantContext(): string {
  const claims = verifyContextToken(readContextToken())
  const requested = activeTenant()
  try {
    const effective = effectiveTenant(claims, requested)
    if (effective !== requested) setActiveTenant(effective)
    return effective
  } catch (error) {
    if (error instanceof TenantContextError && error.code === 'TENANT_FORBIDDEN') {
      const fallback = claims.tenantIds[0]
      setActiveTenant(fallback)
      return fallback
    }
    throw error
  }
}
