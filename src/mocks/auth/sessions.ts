/**
 * The mock server's session table.
 *
 * A refresh token has to be *checked* against something, or refreshing is a
 * formality: the old code minted `mock-refresh-token-${id}` and nothing ever
 * read it back, so any string would have worked. A server keeps a row per
 * issued session and looks the token up; this does the same, which is what
 * makes the mock able to reject a token that was revoked, replayed, or issued
 * before the database was reseeded.
 *
 * Rotation on every use. A refresh token is spent when it is redeemed and a
 * new one takes its place, so a token captured from storage stops working the
 * moment the real client refreshes. That is the default worth having in a
 * mock, because a client written against a non-rotating server quietly breaks
 * when the real one rotates.
 */

const DB_KEY = 'sanketa:mock-db:sessions'

interface StoredSession {
  refreshToken: string
  userId: string
  /** ISO 8601. Kept because a real table has it and expiry is read off it. */
  issuedAt: string
}

interface Database {
  rows: StoredSession[]
}

/**
 * How long a refresh token stays good.
 *
 * Long, because this is the credential that keeps someone signed in across
 * days. The *access* token is the short-lived one, and its lifetime is the
 * backend's business — the mock never checks it, since mock mode makes no HTTP
 * calls for an interceptor to catch a 401 from.
 */
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000

let db: Database | null = null

function load(): Database {
  if (db) return db
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Database
      if (Array.isArray(parsed.rows)) {
        db = parsed
        return db
      }
    }
  } catch {
    // Unparseable or unavailable (private mode, cleared site data) — start
    // empty, which correctly invalidates every token issued before now.
  }
  db = { rows: [] }
  persist()
  return db
}

function persist(): void {
  if (!db) return
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db))
  } catch {
    // Quota or private mode; the in-memory copy still serves this session.
  }
}

function mint(prefix: string, userId: string): string {
  return `${prefix}-${userId}-${crypto.randomUUID()}`
}

export interface IssuedTokens {
  token: string
  refreshToken: string
}

/** Open a session for a user and hand back the pair. */
export function issueSession(userId: string): IssuedTokens {
  const database = load()
  const tokens: IssuedTokens = {
    token: mint('mock-jwt-token', userId),
    refreshToken: mint('mock-refresh-token', userId),
  }
  database.rows.push({
    refreshToken: tokens.refreshToken,
    userId,
    issuedAt: new Date().toISOString(),
  })
  persist()
  return tokens
}

/**
 * Spend a refresh token and issue the next pair.
 *
 * Returns null for anything a server would refuse — unknown, already spent, or
 * past its lifetime — and the caller turns that into the 401 that sends
 * someone back to the sign-in page.
 */
export function rotateSession(
  refreshToken: string,
  now: Date = new Date(),
): (IssuedTokens & { userId: string }) | null {
  const database = load()
  const index = database.rows.findIndex(row => row.refreshToken === refreshToken)
  if (index === -1) return null

  const [session] = database.rows.splice(index, 1)
  const age = now.getTime() - new Date(session.issuedAt).getTime()
  if (Number.isNaN(age) || age > REFRESH_TOKEN_TTL_MS) {
    // Consumed either way: an expired token should not be retryable.
    persist()
    return null
  }

  const next = issueSession(session.userId)
  return { ...next, userId: session.userId }
}

/** Sign out — the session stops being redeemable, not just forgotten locally. */
export function revokeSession(refreshToken: string): void {
  const database = load()
  const index = database.rows.findIndex(row => row.refreshToken === refreshToken)
  if (index === -1) return
  database.rows.splice(index, 1)
  persist()
}

/** Wipe — the equivalent of a server restart invalidating every session. */
export function resetSessions(): void {
  db = { rows: [] }
  persist()
}
