/**
 * Who is reading the board, in the terms an audience speaks.
 *
 * The companion to `config/audience.ts`, which is pure and knows nothing about
 * sessions: this is the part that reads the caller, the way
 * `abilityForCurrentSession` does in `caller.ts` and for the same reason — a
 * backend takes the reader from the request's token, so the mock takes it from
 * the stored session rather than letting a call site pass one in.
 *
 * Kept beside `caller.ts` rather than inside it because it answers a different
 * question. `caller.ts` asks what somebody may *do*; this asks who they *are*
 * to an item addressed at a group, which is a fact about their children and
 * their classes rather than about their permissions.
 */

import { authUtils } from '@/api/utils/auth'
import { resolveActiveAccess, resolveActiveSide } from '@/mocks/tenant/profiles'
import { findStudent } from '@/mocks/tenant/students/store'
import { callerMay } from './caller'
import type { AudienceViewer } from '@/config/audience'
import type { Subject } from '@/config/permissions'

/** The grade a section label belongs to — `'10B'` is grade `'10'`, not `'1'`. */
function gradeOfSection(label: string): string | undefined {
  const digits = label.match(/^\d+/)
  return digits ? digits[0] : undefined
}

/**
 * Build the viewer for one call.
 *
 * `subject` is what the caller would need to *manage* in order to read past
 * every audience — `Notice` for the board, `CalendarEvent` for the calendar.
 *
 * Signed out is nobody: no side, no grades, and no bypass, so only an item
 * with no reach at all comes back. The router keeps that path unreachable;
 * this makes it safe if it ever is not, the same way `visibleToCaller` does.
 */
export function callerAudience(subject: Subject): AudienceViewer {
  const session = authUtils.getUser()
  if (!session) {
    return { seesEverything: false, side: null, grades: [], everyGrade: false }
  }

  const side = resolveActiveSide(session.id)
  const access = resolveActiveAccess(session.id)

  // A family's grades are their children's. A teacher's are the grades of the
  // sections they hold. Staff holding no section are narrowed by nothing and
  // reach every grade — which is a principal, and the reason `everyGrade` is
  // its own answer rather than an empty list.
  const grades =
    side === 'family'
      ? access.studentIds.flatMap(id => {
          const grade = findStudent(id)?.gradeLevel
          return grade ? [grade] : []
        })
      : access.assignedClasses.flatMap(label => {
          const grade = gradeOfSection(label)
          return grade ? [grade] : []
        })

  return {
    seesEverything: callerMay('manage', subject),
    side,
    grades: [...new Set(grades)],
    everyGrade: side === 'staff' && access.assignedClasses.length === 0,
  }
}
