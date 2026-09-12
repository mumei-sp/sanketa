/**
 * Who a notice or an event is addressed to.
 *
 * Both already carried an audience — `Notice.audience`, `CalendarEvent.
 * extendedProps.attendees` — and both were free prose a person typed into a
 * form: "Classes 6 to 10", "Parents — Vijayanagar Route", "Department Heads,
 * HR", "Choir Members". Fourteen distinct strings across two schools, and
 * nothing read any of them. Every notice and every event reached everybody,
 * so a parent's board carried the staff appraisal schedule.
 *
 * Parsing that prose would be a guessing game, and a wrong guess either hides
 * a notice somebody needed or shows one they should not have. So the prose
 * stays exactly as written — it is the only thing anybody reads — and a
 * machine-readable `reach` is declared beside it. The same pairing
 * `profile_types` makes, where `code` is what the app matches on and `name` is
 * what a person sees.
 *
 * ── What a reach can say, and what it deliberately cannot ──────────────
 * Two axes, because two are what the app can actually answer:
 *
 *   `sides`   staff, family, or both. The side is the honest discriminator —
 *             a parent and a teacher both hold `notices.read`, so a permission
 *             cannot tell them apart, and the session already picked a side.
 *   `grades`  which grade levels it concerns.
 *
 * It cannot say "Vijayanagar Route", "Science Dept." or "Choir Members",
 * because a bus route, a department and a club are not things this app models.
 * Those notices declare no reach and go to the whole board — which is what a
 * board is, and honest about the limit rather than pretending to a precision
 * the data cannot support. The day routes or clubs become tables, they become
 * axes here.
 *
 * ── Absent means everybody ─────────────────────────────────────────────
 * A notice board is a wall in a corridor: public is its resting state, and the
 * exceptional thing is the one addressed to staff. So an undeclared reach is
 * open, the same bargain `notifications`' audience column already makes.
 *
 * The cost is that an author who means "staff only" and says nothing is not
 * protected by the default — which is why the seeded staff-facing notices
 * declare their side, and why the compose form should grow a reach picker
 * rather than leaving it to prose for ever.
 */

import { z } from 'zod'
import type { ContextSide } from './permissions'

/** The machine-readable half of an audience. Absent means everybody. */
export interface AudienceReach {
  /** Which sides it is addressed to. Absent or empty means both. */
  sides?: ContextSide[]
  /** Which grade levels — `'7'`, `'8'`. Absent or empty means all of them. */
  grades?: string[]
  /**
   * Particular people, by profile id.
   *
   * The other two axes describe a group; this names individuals, and it is the
   * one axis that *widens*. See `audienceReaches` for why, and for what it
   * means on its own.
   */
  profileIds?: string[]
}

/** What the app knows about whoever is reading, in the terms a reach speaks. */
export interface AudienceViewer {
  /**
   * Reads the whole board regardless of who each item is for.
   *
   * Whoever administers a board has to see everything pinned to it, including
   * the notices addressed to somebody else — moderating a wall you can only
   * half see is not moderating it.
   */
  seesEverything: boolean
  /** The side this session is in, or null when it holds no role here. */
  side: ContextSide | null
  /** The grade levels this viewer has a stake in. */
  grades: string[]
  /** True when no grade narrows them — a principal, an administrator. */
  everyGrade: boolean
  /** This reader's profile id here, for an item that names people. */
  profileId: string | null
}

/**
 * Whether this item reaches this viewer.
 *
 * ── Two kinds of axis, and why they compose the way they do ────────────
 * `sides` and `grades` describe a *group*, and each one narrows it: "families"
 * and then "in year 9" is a smaller set than either alone, so they are an AND.
 *
 * `profileIds` names *people*, and naming somebody widens. It is a "To:" line:
 * a notice for the whole staff room that also names three parents reaches the
 * staff room and those three parents, which is the only reading of it that is
 * not a trap for whoever wrote it.
 *
 * That leaves one case worth stating outright. Naming people and describing no
 * group at all means **exactly those people** — not everybody, which is what
 * an OR against a vacuous group would otherwise give, and which would turn the
 * most precise thing an author can say into the widest.
 *
 * Order matters inside the group: the administrator's bypass first, then the
 * side, then the grades. Checking grades before sides would let a principal —
 * who reaches every grade — through a `family` restriction on that alone.
 */
export function audienceReaches(
  reach: AudienceReach | undefined,
  viewer: AudienceViewer,
): boolean {
  if (viewer.seesEverything) return true
  if (!reach) return true

  const named =
    reach.profileIds !== undefined &&
    reach.profileIds.length > 0 &&
    viewer.profileId !== null &&
    reach.profileIds.includes(viewer.profileId)

  const describesGroup =
    (reach.sides !== undefined && reach.sides.length > 0) ||
    (reach.grades !== undefined && reach.grades.length > 0)

  // Named people and nothing else: the addressees are the audience.
  if (!describesGroup) {
    return reach.profileIds !== undefined && reach.profileIds.length > 0 ? named : true
  }

  return named || matchesGroup(reach, viewer)
}

/** The `sides` ∧ `grades` half, which narrows. */
function matchesGroup(reach: AudienceReach, viewer: AudienceViewer): boolean {
  if (reach.sides !== undefined && reach.sides.length > 0) {
    // No side means no role here, and an item addressed to a particular side
    // is not addressed to somebody who is not in one.
    if (viewer.side === null || !reach.sides.includes(viewer.side)) return false
  }

  if (reach.grades !== undefined && reach.grades.length > 0) {
    if (viewer.everyGrade) return true
    return reach.grades.some(grade => viewer.grades.includes(grade))
  }

  return true
}

/** `['6','7','8','9','10']` — for the "Classes 6 to 10" shape of audience. */
export function gradeRange(from: number, to: number): string[] {
  const out: string[] = []
  for (let grade = from; grade <= to; grade += 1) out.push(String(grade))
  return out
}

/**
 * The zod shape for a form collecting a reach.
 *
 * Declared here rather than in each feature's schema so the notice form and
 * the event form cannot drift into validating the same object two ways.
 */
export const AudienceReachSchema = z
  .object({
    sides: z.array(z.enum(['staff', 'family'])).optional(),
    grades: z.array(z.string()).optional(),
    profileIds: z.array(z.string()).optional(),
  })
  .optional()
