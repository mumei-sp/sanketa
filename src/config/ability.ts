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
  type ScopeAxis,
  type Subject,
} from './permissions'

/**
 * What the signed-in account is narrowed *to*, on each axis.
 *
 * Both lists are carried whatever the role, because the role decides which one
 * is consulted and a caller should not have to know that. A staff account has
 * classes and no students; a family account the reverse; an unscoped role
 * ignores both.
 */
export interface AbilityScope {
  classSections: string[]
  studentIds: string[]
}

/** The condition an axis puts on a rule, given what the account holds. */
function conditionFor(axis: ScopeAxis, scope: AbilityScope) {
  return axis === 'classes'
    ? { classSection: { $in: scope.classSections } }
    : { studentId: { $in: scope.studentIds } }
}

/** What the account holds on an axis. Empty means the rule is not written. */
function valuesFor(axis: ScopeAxis, scope: AbilityScope): string[] {
  return axis === 'classes' ? scope.classSections : scope.studentIds
}

/**
 * The fields a rule may be written about.
 *
 * One shape for every subject rather than a per-subject interface: the only
 * condition in the app narrows by class section, and giving Finance a
 * `classSection` it never uses costs nothing while keeping the ability's type
 * one line instead of thirteen. Add a field here the day a rule needs it.
 */
export interface SubjectFields {
  /** The class a record belongs to. Narrows staff to their own sections. */
  classSection?: string
  /** The student a record is about. Narrows a family to their own. */
  studentId?: string
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
 * Build the ability for one signed-in account.
 *
 * A permission is narrowed only when the role's axis is one the permission
 * declares it can be narrowed on. That double condition is what lets the same
 * `attendance.read` be unrestricted for a class-scoped teacher and restricted
 * for a student: the teacher's axis is `classes`, which `attendance.read` does
 * not offer, so no condition is written.
 *
 * @param role   Their role, or null when signed out or unassigned.
 * @param scope  What they are narrowed to on each axis. Ignored on any axis
 *               the role does not use.
 */
export function defineAbilityFor(role: Role | null, scope: AbilityScope): AppAbility {
  const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility)

  const axis = role?.scopeBy

  role?.permissions.forEach(permission => {
    const definition = BY_ID.get(permission)
    // A stored id with no definition behind it grants nothing — a role written
    // by an older build can name a permission this one has dropped.
    if (!definition) return

    const narrows = axis !== undefined && definition.scopableBy?.includes(axis) === true

    if (!narrows) {
      can(definition.action, definition.subject)
      return
    }

    // A narrowed holder with nothing on that axis yet gets no rule at all
    // rather than one whose condition can never match. The difference is
    // visible to the UI: `can('mark', 'Attendance')` should be false for a
    // teacher with no classes, not true-until-you-name-one.
    if (valuesFor(axis, scope).length === 0) return

    can(definition.action, definition.subject, conditionFor(axis, scope))
  })

  return build()
}

/**
 * The two questions a UI asks, and why they differ.
 *
 * Passing a bare subject name asks "anywhere?" — CASL cannot test a condition
 * without a record, so a conditional rule matches the type. That is exactly
 * what a toolbar button needs: it should exist if there is any class you could
 * use it on. Passing fields asks "here?", and the condition decides.
 *
 * A record with every field undefined is the first question, not the second:
 * a caller that passes `{ classSection: undefined }` means "I have no class in
 * hand", and tagging the subject with it would silently fail every condition.
 */
export function subjectFor(subject: Subject, fields?: SubjectFields): AppSubject {
  if (!fields) return subject
  const present = Object.values(fields).some(value => value !== undefined)
  return present ? asSubject(subject, fields) : subject
}
