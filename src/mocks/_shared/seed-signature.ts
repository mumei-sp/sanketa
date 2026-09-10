/**
 * A fingerprint of what a store seeded from.
 *
 * ── The problem it solves ──────────────────────────────────────────────
 * A mock store writes its rows to `localStorage` and reads them back on the
 * next load, which is the point — it stands in for a table that survives a
 * refresh. The cost is that editing a seed then does nothing: the store finds
 * a file, trusts it, and serves last week's rows. That costs an hour before
 * anybody thinks to look in devtools, and it has cost one.
 *
 * So a store stores this alongside its rows and compares on load. A mismatch
 * means the seed was edited since the file was written, and the edit is the
 * newer intent — the same bargain as re-running a backend's seed script, and
 * with the same consequence: rows created by hand since then go with it.
 *
 * ── Take it over the seed, not the rows ───────────────────────────────
 * Fingerprint the live table and every insert looks like an edited seed, so
 * creating one row wipes the table it was added to. The argument is always the
 * fixture the store seeds *from*.
 *
 * A hash rather than a hand-bumped version number, because the version number
 * is the thing you forget to bump on exactly the change you needed it for.
 */

/** Cheap, stable, not cryptographic — it only has to notice a change. */
export function seedSignature(value: unknown): string {
  const text = JSON.stringify(value) ?? ''
  let hash = 0
  for (let i = 0; i < text.length; i += 1) {
    hash = (Math.imul(31, hash) + text.charCodeAt(i)) | 0
  }
  return `${text.length}:${hash}`
}
