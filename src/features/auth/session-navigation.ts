/**
 * Starting and ending a session is a page load, not a route change.
 *
 * ── The rule this enforces ─────────────────────────────────────────────
 * Most of the mock's tenant-resolved fixtures are module constants, read once
 * at import: the faculty list, the timetables, the fee ledger, the mark
 * sheets, the registers, the bus lists, and `dashboardStats` — whose
 * `TOTAL_ENROLLMENT` is a `const` computed from `studentCount()`. That is a
 * deliberate trade, and it holds on one condition, stated where the faculty is
 * resolved: *switching school reloads the page*. A `const` cannot be rebuilt,
 * so the only way it can ever be right is for the document to be new.
 *
 * `SchoolSwitcher` has always honoured it. Signing out and back in did not,
 * and a session change is a school change — which is how signing out of an
 * account at one school and into an account at another produced a dashboard
 * reading 317 enrolled students above 22 active teachers for somebody who
 * held neither: the previous school's constants, in a document nobody had
 * replaced. Two schools on one screen, which is the one thing the tenant
 * boundary exists to prevent.
 *
 * ── Why both ends ──────────────────────────────────────────────────────
 * Ending a session is the obvious half. Beginning one matters for the same
 * reason and is easier to talk yourself out of: today the dashboard's modules
 * arrive in a lazily-loaded route chunk, so they happen to evaluate after
 * `setActiveTenant`. That is a fact about the current chunk boundaries, not a
 * guarantee — one eager import from the app shell and the constants resolve
 * before anybody has signed in. Making sign-in a load too costs one navigation
 * and stops the correctness depending on the bundler.
 *
 * ── Why a module rather than two call sites ────────────────────────────
 * There are three call sites and there will be more — the header menu, the
 * sidebar, the sign-in form, and eventually a session-expiry handler. A rule
 * that each of them has to remember is one that a later one will not.
 */

/** The signed-out destination. A full load: the old session's modules go with it. */
export function leaveSession(): void {
  window.location.assign('/login')
}

/** The signed-in destination. A full load, so every fixture resolves against the new school. */
export function enterSession(): void {
  window.location.assign('/')
}
