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
