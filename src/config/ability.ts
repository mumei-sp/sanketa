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
 *
 * That was an acceptable trade while every account belonged to staff, who are
 * trusted with the data either way. It stops being one the moment a family can
 * sign in: "the client filtered the rows" then means another child's marks
 * reached this browser and were merely not drawn.
 *
 * So the same rules run again in `_shared/caller.ts`, where the mock's reads
 * drop the rows a caller may not have before returning them. That is the
 * shape a backend would take, and it is what the `students` axis is for. It is
 * still the same process — nothing here is a boundary until one of the two
 * copies runs somewhere the client cannot reach.
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
 * One role or many, as many.
 *
 * `Array.isArray` does not narrow a `readonly Role[]` union on its own, and
 * the alternative — making every caller wrap a single role in brackets — is
 * three call sites paying for one signature.
 */
function asRoleList(roles: Role | readonly Role[] | null): readonly Role[] {
  if (roles === null) return []
  return Array.isArray(roles) ? (roles as readonly Role[]) : [roles as Role]
}

/**
 * Build the ability for one signed-in account, from every role it holds.
 *
 * A permission is narrowed only when the role's axis is one the permission
 * declares it can be narrowed on. That double condition is what lets the same
 * `attendance.read` be unrestricted for a class-scoped teacher and restricted
 * for a student: the teacher's axis is `classes`, which `attendance.read` does
 * not offer, so no condition is written.
 *
 * ── Why roles are plural, and what that costs ──────────────────────────
 * A person can be more than one thing at one school. The teacher whose child
 * attends is the ordinary case, and a single role could not express her: as a
 * teacher she reaches her own class sections, as a parent she reaches her own
 * child, and her child is in a class she does not teach.
 *
 * Each role is applied with *its own* axis, and CASL unions the rules — so she
 * gets `{ classSection: { $in: [her classes] } }` from one and
 * `{ studentId: { $in: [her children] } }` from the other, and a record
 * matching either passes. That is the right answer and it falls out of rule
 * union with no special casing.
 *
 * The cost is that roles must stay purely additive. There are no `cannot`
 * rules in the catalogue and there must not be: CASL is last-rule-wins, so one
 * deny would make the *order* roles are listed in silently change what
 * somebody may do. `role_permissions.granted` is pinned to true in the schema
 * for the same reason — see SCHEMA-FIXES.
 *
 * @param roles  Every role held, or null/[] when signed out or unassigned.
 *               A single role is accepted for the callers that only have one.
 * @param scope  What they are narrowed to on each axis. Ignored on any axis
 *               no role uses.
 */
export function defineAbilityFor(
  roles: Role | readonly Role[] | null,
  scope: AbilityScope,
): AppAbility {
  const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility)

  const held = asRoleList(roles)

  held.forEach(role => {
    const axis = role.scopeBy

    role.permissions.forEach(permission => {
      const definition = BY_ID.get(permission)
      // A stored id with no definition behind it grants nothing — a role
      // written by an older build can name a permission this one has dropped.
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

/**
 * May this caller see every row of this kind?
 *
 * True only when they hold a rule with no conditions on it — one that matches
 * any record. That is the question, and getting it wrong is what let two
 * aggregates leak.
 *
 * The first version asked the opposite one, "is this caller *narrowed*", as
 * `rules.length > 0 && rules.every(has conditions)`. A caller holding no rule
 * at all scores false there, exactly like an admin, because there is nothing
 * to be narrowed. So a Teacher — who holds no finance permission whatsoever —
 * passed the fee-stats guard and received the school's totals, and an
 * Accountant with no attendance permission received every attendance record.
 * The list reads gave both of them nothing, which is what kept it hidden.
 *
 * `can(action, subject)` cannot stand in for this: with a bare subject name it
 * answers "anywhere?", which a narrowed caller also answers yes to.
 *
 * Inverted rules (`cannot`) are excluded. Nothing writes one today, but one
 * would be a *removal* of access, and counting it as permission to see
 * everything is the same failing-open shape as the bug above.
 *
 * ── Why it lives here rather than beside the services ──────────────────
 * Two callers need the same answer for opposite reasons. A service asks it to
 * decide whether to *compute* an aggregate; the dashboard asks it to decide
 * whether to *draw* one. They have to agree, or a panel renders a chart of the
 * empty array the service just refused to fill — which is exactly what the
 * dashboard did to every teacher who ever opened it. One predicate, so the
 * page shows what the services will answer.
 */
export function seesEveryRow(ability: AppAbility, action: Action, subject: Subject): boolean {
  return ability
    .rulesFor(action, subject)
    .some(rule => rule.conditions === undefined && !rule.inverted)
}
