/**
 * What to call a context, wherever it is shown.
 *
 * Three places name the same thing — the tile you press to enter one, the chip
 * in the top bar saying which you are in, and the menu behind that chip — and
 * they have to agree. A person who chose "Nikhil Iyengar" and then reads
 * "Parent" in the top bar has been told about two different things.
 *
 * So the naming lives here rather than in whichever component needed it first.
 * None of it is written prose: a staff context is named by its role, a family
 * one by the child, and the scope line is computed from the axis the role
 * declares — see the note in `ProfileTile` about why this must never be
 * hardcoded copy.
 */

import type { UserContext } from '@/mocks/global'

/**
 * The name across the top: who you would be, in the terms that matter here.
 *
 * A staff context is a job, so it is named by the role. A family one is about
 * a particular child, and naming it "Parent" would be useless to the person it
 * is for — a parent with a child at two schools would read the same word twice.
 */
export function contextTitle(context: UserContext): string {
  if (context.side !== 'family') return context.primaryRoleName
  const names = context.children.map(child => child.name)
  if (names.length === 0) return context.primaryRoleName
  if (names.length === 1) return names[0]
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names.length} children`
}

/** The line under it: where this is, and for a family, which class. */
export function contextSubtitle(context: UserContext): string {
  if (context.side !== 'family') return context.tenantName
  const labelled = context.children.filter(child => child.classLabel)
  if (labelled.length === 1) return `Class ${labelled[0].classLabel} · ${context.tenantName}`
  if (labelled.length > 1) {
    return `Classes ${labelled.map(child => child.classLabel).join(' and ')} · ${context.tenantName}`
  }
  return context.tenantName
}

/**
 * What this context is narrowed to, in a phrase.
 *
 * Derived, never asserted: a role's axis says which question to answer, and
 * the profile says what it is answered with.
 */
export function scopeLine(context: UserContext): string {
  if (context.side === 'family') {
    const names = context.children.map(child => child.name)
    if (names.length === 0) return 'No children on record here'
    if (names.length === 1) return `${names[0]} only`
    return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]} only`
  }
  if (context.reachesWholeSchool) return 'The whole school'
  if (context.assignedClasses.length === 0) return 'No classes assigned yet'
  return `Class ${context.assignedClasses.join(', ')}`
}

/**
 * The two-or-three letters on the little square or circle.
 *
 * A family context is a person, so it takes the child's initials; a staff one
 * is a school, so it takes the school's. That is the same distinction the
 * avatar's *shape* carries — round for a person, not for an institution — and
 * both are decided from `side` so they cannot drift apart.
 */
export function contextMonogramSource(context: UserContext): string {
  return context.side === 'family'
    ? (context.children[0]?.name ?? context.primaryRoleName)
    : context.tenantName
}

/** Said out loud, for anything that needs one unambiguous sentence. */
export function contextAriaLabel(context: UserContext): string {
  return `${context.primaryRoleName} at ${context.tenantName}`
}

// ── Tints ─────────────────────────────────────────────────────────────

/** A background and something readable on it. */
export interface ContextTint {
  background: string
  foreground: string
}

/**
 * The three brand tokens, as avatar tints.
 *
 * The same trio the dashboard already distinguishes series with — accent,
 * primary, heading — paired here with a foreground, because an avatar has text
 * on it and navy on navy is nothing. Navy-on-card is the treatment the account
 * avatar in `UserMenu` already uses, so the third tint is not a new idea.
 *
 * Three is the whole palette on purpose. A fourth would have to come from
 * outside the brand, and a family with four children at one school is rarer
 * than a palette that stops looking like Sanketa.
 */
const TINTS: readonly ContextTint[] = [
  { background: 'var(--primary)', foreground: 'var(--heading)' },
  { background: 'var(--accent)', foreground: 'var(--heading)' },
  { background: 'var(--heading)', foreground: 'var(--card)' },
]

/** What an institution is tinted. One school, one colour — it is not a person. */
const INSTITUTION: ContextTint = { background: 'var(--accent)', foreground: 'var(--heading)' }

/**
 * A stable index for a child, from their id.
 *
 * Hashed rather than taken from their position in a list, so a child keeps the
 * same colour wherever they appear — the chip in the top bar shows only the
 * first of them, and it has to agree with the tile that was pressed to get
 * there. Position would also mean a child changed colour when a sibling was
 * added.
 */
function tintIndex(seed: string): number {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (Math.imul(31, hash) + seed.charCodeAt(i)) | 0
  }
  return Math.abs(hash) % TINTS.length
}

/** One child's tint. Stable for the life of the id. */
export function childTint(studentId: string): ContextTint {
  return TINTS[tintIndex(studentId)]
}

/**
 * Tints for several children shown together, nudged apart where they collide.
 *
 * Two siblings hashing to the same colour is a one-in-three accident, and two
 * identical circles overlapping is worse than either of them being off their
 * own colour. The first child always keeps their own — that is the one the chip
 * also shows — and later ones step forward until they differ.
 */
export function childTints(studentIds: string[]): ContextTint[] {
  const used = new Set<number>()
  return studentIds.map(id => {
    let index = tintIndex(id)
    while (used.has(index) && used.size < TINTS.length) {
      index = (index + 1) % TINTS.length
    }
    used.add(index)
    return TINTS[index]
  })
}

/**
 * The tint for a context's mark — a child's if it is a family, the school's
 * otherwise.
 */
export function contextTint(context: UserContext): ContextTint {
  const child = context.side === 'family' ? context.children[0] : undefined
  return child ? childTint(child.studentId) : INSTITUTION
}
