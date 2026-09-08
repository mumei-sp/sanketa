/**
 * Turning a role into rules the ability engine can evaluate.
 *
 * This file is the point of the whole exercise: `defineAbilityFor` takes a
 * role and a user's class assignments and returns a CASL ability. It imports
 * nothing from React, nothing from the DOM and nothing from a service — which
 * means a Node backend can import it verbatim and evaluate the identical rules
 * on the same data. One definition of who may do what, enforced in two places,
 * rather than a client copy that drifts from a server copy.
 *
 * Roles remain a list of permission ids, not raw CASL rules. That keeps the
 * role editor a list of switches rather than a query builder, and keeps the
 * stored format something a person can read. The translation happens here: a
 * permission id carries the (action, subject) pair it grants, and the role's
 * `scopedToAssignedClasses` decides whether that grant gets a condition.
 *
 * ── Still not security ──────────────────────────────────────────────────
 * Running these rules in the browser decides what to render. Running the same
 * rules on the server decides what is true. Both are needed; only the second
 * one protects anything.
 */

import {
  AbilityBuilder,
  createMongoAbility,
  subject as asSubject,
  type ForcedSubject,
  type MongoAbility,
} from '@casl/ability'
import {
  PERMISSION_DEFINITIONS,
  type Action,
  type Permission,
  type PermissionDefinition,
  type Role,
  type Subject,
} from './permissions'

/**
 * The fields a rule may be written about.
 *
 * One shape for every subject rather than a per-subject interface: the only
 * condition in the app narrows by class section, and giving Finance a
 * `classSection` it never uses costs nothing while keeping the ability's type
 * one line instead of thirteen. Add a field here the day a rule needs it.
 */
interface SubjectFields {
  classSection?: string
}

/**
 * Checked either as a bare name ("may I mark attendance at all?") or as a
 * record ("may I mark 9A's?"). `ForcedSubject` is how CASL tags a plain object
 * with the subject it stands for.
 */
// Distributed over each subject name rather than written as
// `SubjectFields & ForcedSubject<Subject>`: CASL reads the field types off
// each arm to type a rule's conditions, and a single arm tagged with the whole
// union collapses them to `never`, which makes `{ $in: string[] }` unassignable.
type TaggedSubject = { [S in Subject]: SubjectFields & ForcedSubject<S> }[Subject]

export type AppSubject = Subject | TaggedSubject
export type AppAbility = MongoAbility<[Action, AppSubject]>

const BY_ID = new Map<string, PermissionDefinition>(
  (PERMISSION_DEFINITIONS as readonly PermissionDefinition[]).map(definition => [
    definition.id,
    definition,
  ]),
)

export function permissionDefinition(id: Permission): PermissionDefinition | undefined {
  return BY_ID.get(id)
}

/**
 * Build the ability for one signed-in user.
 *
 * @param role              Their role, or null when signed out or unassigned.
 * @param assignedClasses   Class sections they own. Ignored unless the role is
 *                          scoped.
 */
export function defineAbilityFor(role: Role | null, assignedClasses: string[]): AppAbility {
  const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility)

  const scopeRole = role?.scopedToAssignedClasses === true

  role?.permissions.forEach(permission => {
    const definition = BY_ID.get(permission)
    // A stored id with no definition behind it grants nothing — a role written
    // by an older build can name a permission this one has dropped.
    if (!definition) return

    const narrow = scopeRole && definition.scoped === true

    if (!narrow) {
      can(definition.action, definition.subject)
      return
    }

    // A scoped holder with no classes assigned yet gets no rule at all rather
    // than one whose condition can never match. The difference shows up in the
    // type-level check below: `can('manage', 'Attendance')` should be false for
    // someone with nothing to manage, not true-until-you-name-a-class.
    if (assignedClasses.length === 0) return

    can(definition.action, definition.subject, {
      classSection: { $in: assignedClasses },
    })
  })

  return build()
}

/**
 * The two questions a UI asks, and why they differ.
 *
 * Passing a bare subject name asks "anywhere?" — CASL cannot test a condition
 * without a record, so a conditional rule matches the type. That is exactly
 * what a toolbar button needs: it should exist if there is any class you could
 * use it on. Passing a record asks "here?", and the condition decides.
 */
export function subjectFor(subject: Subject, classSection?: string): AppSubject {
  return classSection === undefined ? subject : asSubject(subject, { classSection })
}
