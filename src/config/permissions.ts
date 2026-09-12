/**
 * What the app can do, and who is allowed to do it.
 *
 * Two halves, and the split is the whole design:
 *
 *   Permissions are a fixed catalogue. They enumerate the app's capabilities,
 *   which are decided by the code that implements them — a permission cannot
 *   be invented at runtime because there would be nothing behind it.
 *
 *   Roles are data. A role is a name and a set of permissions, kept in its own
 *   table behind `role-service`, so a school can add "Vice Principal" or
 *   "Librarian" without a release.
 *
 * A third axis sits on top: some permissions answer "where?" as well as
 * "whether?". A teacher holds `attendance.mark` for their own classes and
 * nobody else's, while a principal holds it everywhere — see `scoped` below
 * and `scopedToAssignedClasses` on Role.
 *
 * Features ask `can('fees.write')`, never `role === 'Accountant'`. Checking the
 * role at the call site is what makes RBAC impossible to change later: adding
 * one role would mean editing every component that mentioned the others.
 *
 * ── A warning that belongs in the source, not just a ticket ──────────────
 * None of this is security. Every rule here runs in the browser and can be
 * defeated with devtools in seconds. It stops people wandering into pages that
 * would confuse them and hides actions that would fail anyway, which is worth
 * doing — but when a real backend exists, every rule below has to exist there
 * too, and the server's copy is the one that counts. The catalogue is written
 * so that copy can be ported directly.
 */

/**
 * The subjects rules are written about — CASL's word for "the kind of thing
 * being acted on". Deliberately domain nouns, not screen names: a backend
 * enforcing the same rules cares about an Attendance record, not a page.
 */
export type Subject =
  | 'Dashboard'
  | 'CalendarEvent'
  | 'Notice'
  | 'Student'
  | 'Teacher'
  | 'Attendance'
  | 'Grade'
  | 'Timetable'
  | 'Assignment'
  | 'Finance'
  | 'Transport'
  | 'Settings'
  | 'Role'
  | 'User'

/**
 * What may be done to a subject.
 *
 * `manage` is CASL's wildcard — it implies every other action. It is still
 * used where a school delegates one write job rather than several: whoever may
 * edit the calendar may obviously add and remove events, and three switches
 * for that would be three switches nobody sets differently.
 *
 * Where the school *does* delegate the pieces separately — students, grades —
 * the verbs are explicit, which is also what the backend's permission table
 * settled on. See the note above `PERMISSION_DEFINITIONS`.
 *
 * `mark`, `promote`, `transfer`, `grade` and `assign` are bespoke verbs, and
 * deliberately not shades of `manage`: the wildcard would otherwise hand every
 * one of them to anyone holding `manage` on the same subject, which is how
 * "Run promotions" quietly became ungrantable once.
 */
export type Action =
  | 'read'
  | 'create'
  | 'update'
  | 'delete'
  | 'manage'
  | 'mark'
  | 'promote'
  | 'transfer'
  | 'assign'

/**
 * The two ways a grant can be narrowed.
 *
 * `classes` is a staff idea: a teacher writes to the sections assigned to
 * them. `students` is a family one: a student reads their own records, a
 * parent their children's. They are different axes, not degrees of the same
 * one, which is why a permission declares which of them it can be narrowed on
 * and a role declares which one to use.
 */
export type ScopeAxis = 'classes' | 'students'

/**
 * Which of a person's two lives at a school a session is being lived in.
 *
 * The member of staff whose child attends is one account holding roles that
 * answer different questions: as a teacher she reaches her own sections, as a
 * parent she reaches her own son, and he is in a class she does not teach.
 * Unioning both is correct for *what she may see across the day* and wrong for
 * *what she is doing right now* — it is what let a principal sign off her own
 * child's marks, and what made the access log unable to say which of the two
 * she was acting as.
 *
 * So a session picks one. The sides are the app's, not a school's: a school
 * invents roles, and each role lands on the side its axis already implies.
 *
 * ── Why this is derived and not a column ───────────────────────────────
 * The axis says it already. `classes` narrows to sections a person is assigned
 * to teach, which only staff are; `students` narrows to a person's own record
 * or their children's, which is what a family is. See `ScopeAxis` above, which
 * has said so since before this type existed. Storing the side separately
 * would let the two disagree, and a role whose axis is `students` but whose
 * side is `staff` grants a parent's narrowing with a teacher's reach.
 *
 * What makes the derivation *safe* is a rule in the roles store: a school's
 * own role may not take the `students` axis. A family role's scope is not
 * configurable — it comes from `student_guardians`, and your children are your
 * children — so the family side is a closed set of the two built-ins, and
 * nothing a school creates can land on it.
 *
 * The day a third axis is added — a counsellor's caseload, a head of year's
 * cohort — this stops being derivable, because such a role is staff narrowed
 * on students. That is the same change `ScopeAxis` already calls a developer's
 * change, and `sideOfRole` is the second place it has to be made.
 */
export type ContextSide = 'staff' | 'family'

/** Every side, in the order a chooser should offer them. Work before family. */
export const CONTEXT_SIDES: readonly ContextSide[] = ['staff', 'family']

/**
 * Which side a role belongs to.
 *
 * An unnarrowed role is staff: a Principal or an Admin reaches the whole
 * school, and nothing about that is a family's view of it.
 */
export function sideOfRole(role: Pick<Role, 'scopeBy'>): ContextSide {
  return role.scopeBy === 'students' ? 'family' : 'staff'
}

/** One capability. Grouped by the area of the app it belongs to. */
export interface PermissionDefinition {
  id: string
  /**
   * The (action, subject) pair this permission grants.
   *
   * Permission ids stay the storage and editing format — a role is a list of
   * them, and the role editor is a list of switches. This pair is how each one
   * becomes a rule the ability engine (and, later, a backend) can evaluate.
   */
  action: Action
  subject: Subject
  /** Area heading in the role editor. */
  group: string
  label: string
  description: string
  /**
   * The axes this permission can be narrowed on. Absent means never narrowed.
   *
   * Declared per permission rather than inferred, because the two axes apply
   * to opposite halves of the catalogue and the old single flag could not say
   * so. `attendance.mark` narrows by class — a teacher marks their own
   * sections — and must *not* narrow by student, because a teacher is not a
   * student. `attendance.read` is the mirror image: unscoped for staff, who
   * should be able to look up any class, and narrowed to their own records for
   * a family, who must not.
   *
   * That asymmetry is why "reading is never scoped" — true, and deliberate,
   * while every account belonged to staff — could not survive families
   * arriving.
   *
   * ── Where the `students` axis is enforced ─────────────────────────────
   * In the services, not the components: a read that filtered in the browser
   * would still have sent the rows. `students.read`, `attendance.read`,
   * `grades.read` and `finance.read` are all filtered at the service against
   * the caller's own scope — see `_shared/caller.ts`, which reads the session
   * the way a backend reads a token rather than taking a scope from the call
   * site.
   *
   * `assignments.read` is the one entry that still narrows nothing, because
   * the feature behind it does not exist. It becomes real the day there is a
   * service to enforce it in.
   */
  scopableBy?: readonly ScopeAxis[]
}

/**
 * The catalogue.
 *
 * `view` and a verb per area rather than a uniform read/write pair: "mark
 * attendance" and "enter grades" are the actions a school actually delegates,
 * and naming them after the job makes a role editor readable by the person
 * configuring it rather than by the person who wrote the table.
 */
/**
 * The catalogue.
 *
 * Ids follow the backend's `{resource}.{action}` convention, and where the
 * backend's permission table already names a capability — `students.read`,
 * `grades.update`, `attendance.mark`, `system.settings` — this uses that name
 * exactly. A mock that invents its own vocabulary makes every service written
 * before the backend lands something a person has to translate by hand, and
 * turns the `@apiRoute` comments into a description rather than a contract.
 *
 * Two deliberate departures, both recorded rather than accidental:
 *
 *   The backend splits roles and users five and six ways. This keeps
 *   `roles.manage` whole, because the app has one role editor and the split
 *   would produce switches nobody sets differently. Split them the day the
 *   backend insists.
 *
 *   The backend has no permission for calendar, notices, timetable, transport
 *   or fees. Those keep a single `manage` here and are offered to the backend
 *   as-is rather than being bent into a CRUD shape nothing asked for.
 */
export const PERMISSION_DEFINITIONS = [
  { id: 'dashboard.read', action: 'read', subject: 'Dashboard', group: 'General', label: 'View dashboard', description: 'See the home dashboard and its summaries.' },
  { id: 'calendar.read', action: 'read', subject: 'CalendarEvent', group: 'General', label: 'View calendar', description: 'See the school calendar.' },
  { id: 'calendar.manage', action: 'manage', subject: 'CalendarEvent', group: 'General', label: 'Manage calendar', description: 'Create, edit and cancel events.' },
  { id: 'notices.read', action: 'read', subject: 'Notice', group: 'General', label: 'View notices', description: 'Read the notice board.' },
  { id: 'notices.manage', action: 'manage', subject: 'Notice', group: 'General', label: 'Manage notices', description: 'Publish, pin and remove notices.' },

  { id: 'students.read', action: 'read', subject: 'Student', group: 'People', label: 'View students', description: 'See the student roster and profiles.', scopableBy: ['students'] },
  { id: 'students.create', action: 'create', subject: 'Student', group: 'People', label: 'Enrol students', description: 'Add a student to the roster.', scopableBy: ['classes'] },
  { id: 'students.update', action: 'update', subject: 'Student', group: 'People', label: 'Edit student records', description: 'Change a student\'s details, documents and history.', scopableBy: ['classes'] },
  { id: 'students.delete', action: 'delete', subject: 'Student', group: 'People', label: 'Remove students', description: 'Delete a student record permanently.', scopableBy: ['classes'] },
  { id: 'students.promote', action: 'promote', subject: 'Student', group: 'People', label: 'Run promotions', description: 'Move students between years.' },
  { id: 'students.transfer', action: 'transfer', subject: 'Student', group: 'People', label: 'Transfer students', description: 'Move a student between classes or sections.', scopableBy: ['classes'] },
  { id: 'teachers.read', action: 'read', subject: 'Teacher', group: 'People', label: 'View teachers', description: 'See the staff list and profiles.' },
  { id: 'teachers.manage', action: 'manage', subject: 'Teacher', group: 'People', label: 'Manage teachers', description: 'Add and edit staff records.' },

  { id: 'attendance.read', action: 'read', subject: 'Attendance', group: 'Academics', label: 'View attendance', description: 'See attendance records and history.', scopableBy: ['students'] },
  { id: 'attendance.mark', action: 'mark', subject: 'Attendance', group: 'Academics', label: 'Mark attendance', description: 'Submit and amend a class register.', scopableBy: ['classes'] },
  { id: 'grades.read', action: 'read', subject: 'Grade', group: 'Academics', label: 'View grades', description: 'See grade sheets and report cards.', scopableBy: ['students'] },
  { id: 'grades.create', action: 'create', subject: 'Grade', group: 'Academics', label: 'Enter grades', description: 'Record marks for an exam.', scopableBy: ['classes'] },
  { id: 'grades.update', action: 'update', subject: 'Grade', group: 'Academics', label: 'Amend grades', description: 'Change marks already recorded.', scopableBy: ['classes'] },
  { id: 'grades.delete', action: 'delete', subject: 'Grade', group: 'Academics', label: 'Delete grades', description: 'Remove a grade record permanently.', scopableBy: ['classes'] },
  // Narrowed by student like every other family-facing read, and the last one
  // to say so: a parent held this unconditionally and could open all nineteen
  // sections' grids. A timetable is not *about* a student, so the service does
  // the translation — the caller's children give their sections, and those are
  // the grids they may see. Same shape as the fee ledger keying on `S-2101`
  // while a scope holds profile ids.
  { id: 'timetable.read', action: 'read', subject: 'Timetable', group: 'Academics', label: 'View timetable', description: 'See the class timetable.', scopableBy: ['students'] },
  { id: 'timetable.manage', action: 'manage', subject: 'Timetable', group: 'Academics', label: 'Manage timetable', description: 'Edit periods and add substitutions.' },
  { id: 'assignments.read', action: 'read', subject: 'Assignment', group: 'Academics', label: 'View assignments', description: 'See assignments.', scopableBy: ['students'] },

  { id: 'finance.read', action: 'read', subject: 'Finance', group: 'Finance', label: 'View finance', description: 'See fee collection and expenses.', scopableBy: ['students'] },
  { id: 'finance.manage', action: 'manage', subject: 'Finance', group: 'Finance', label: 'Manage finance', description: 'Record payments and log expenses.' },
  { id: 'transport.read', action: 'read', subject: 'Transport', group: 'Transport', label: 'View transport', description: 'See routes, vehicles and drivers.' },
  { id: 'transport.manage', action: 'manage', subject: 'Transport', group: 'Transport', label: 'Manage transport', description: 'Edit routes, vehicles, drivers and transport fees.' },

  { id: 'system.settings', action: 'manage', subject: 'Settings', group: 'Administration', label: 'Manage school settings', description: 'Change school, academic, timetable and appearance settings.' },
  { id: 'roles.read', action: 'read', subject: 'Role', group: 'Administration', label: 'View roles', description: 'See the roles and what each one can do.' },
  { id: 'roles.manage', action: 'manage', subject: 'Role', group: 'Administration', label: 'Manage roles', description: 'Create roles and change what each one can do.' },
  { id: 'users.read', action: 'read', subject: 'User', group: 'Administration', label: 'View people', description: 'See who has an account.' },
  { id: 'users.create', action: 'create', subject: 'User', group: 'Administration', label: 'Add people', description: 'Create an account for someone.' },
  { id: 'users.update', action: 'update', subject: 'User', group: 'Administration', label: 'Edit access', description: 'Change which classes a person covers.' },
  { id: 'roles.assign', action: 'assign', subject: 'User', group: 'Administration', label: 'Assign roles', description: 'Change which role a person holds.' },
] as const satisfies readonly PermissionDefinition[]

export type Permission = (typeof PERMISSION_DEFINITIONS)[number]['id']

export const ALL_PERMISSIONS = PERMISSION_DEFINITIONS.map(p => p.id) as Permission[]

/** Catalogue grouped for the role editor, in declaration order. */
export function permissionsByGroup(): { group: string; permissions: PermissionDefinition[] }[] {
  const order: string[] = []
  const groups = new Map<string, PermissionDefinition[]>()
  PERMISSION_DEFINITIONS.forEach(definition => {
    const bucket = groups.get(definition.group)
    if (bucket) {
      bucket.push(definition)
    } else {
      order.push(definition.group)
      groups.set(definition.group, [definition])
    }
  })
  return order.map(group => ({ group, permissions: groups.get(group)! }))
}

// ── Roles ─────────────────────────────────────────────────────────────

export interface Role {
  /** Stable key. Stored on the user, so it must never be renamed in place. */
  id: string
  name: string
  /**
   * What holding this role means, in the school's own words.
   *
   * **Read by people who hold the role**, not only by the administrator
   * editing it: the profile chooser prints it on the tile somebody presses to
   * enter, because a choice that narrows what you may do has to say so before
   * it is made. So it is product copy — a sentence addressed to the holder —
   * and not a note to whoever is maintaining the seed.
   *
   * Two of these used to end "No accounts hold this yet", which was a remark
   * about the fixtures, was shown to the first parent who signed in, and had
   * stopped being true by then anyway.
   */
  description?: string
  permissions: Permission[]
  /**
   * Which axis this role's narrowable permissions are narrowed on.
   *
   * The role says *how* to narrow; the account says *what to*. Keeping the two
   * apart is what lets "Principals write everywhere", "Teachers write their
   * own classes" and "students read their own records" be one mechanism rather
   * than three: all three hold `attendance.read`, and only the axis differs.
   *
   * Absent means the role is not narrowed at all.
   */
  scopeBy?: ScopeAxis
  /**
   * Seeded with the app and not deletable.
   *
   * Their permissions can still be edited — a school may well decide its
   * Principals should not see finance — but removing them outright would
   * strand every user assigned to one.
   */
  builtin?: boolean
}

const EVERYONE: Permission[] = ['dashboard.read', 'calendar.read', 'notices.read']

export const BUILTIN_ROLES: Role[] = [
  {
    id: 'admin',
    name: 'Admin',
    description: 'Full access, including settings and roles.',
    permissions: [...ALL_PERMISSIONS],
    builtin: true,
  },
  {
    id: 'principal',
    name: 'Principal',
    description: 'Runs the school day. Everything except configuration.',
    permissions: [
      ...EVERYONE,
      'calendar.manage', 'notices.manage',
      'students.read', 'students.create', 'students.update', 'students.promote', 'students.transfer',
      'teachers.read', 'teachers.manage',
      'attendance.read', 'attendance.mark',
      'grades.read', 'grades.create', 'grades.update',
      'timetable.read', 'timetable.manage',
      'assignments.read',
      'finance.read',
      'transport.read',
    ],
    builtin: true,
  },
  {
    id: 'teacher',
    name: 'Teacher',
    description: 'Reads every class; writes only their own.',
    scopeBy: 'classes',
    permissions: [
      ...EVERYONE,
      'students.read',
      'attendance.read', 'attendance.mark',
      'grades.read', 'grades.create', 'grades.update',
      'timetable.read',
      'assignments.read',
    ],
    builtin: true,
  },
  {
    id: 'accountant',
    name: 'Accountant',
    description: 'Fees, expenses and transport charges.',
    permissions: [
      ...EVERYONE,
      'students.read',
      'finance.read', 'finance.manage',
      'transport.read', 'transport.manage',
    ],
    builtin: true,
  },
  /**
   * The two family roles.
   *
   * Seeded before any account can hold one, so the narrowing they depend on
   * can be built and previewed before the accounts project lands. Both are
   * narrowed by `students`, which is the whole reason the second axis exists:
   * they hold the same read permissions staff do, and see a hundredth of the
   * rows.
   */
  {
    id: 'student',
    name: 'Student',
    description: 'Reads their own records, and nothing else at the school.',
    scopeBy: 'students',
    permissions: [
      ...EVERYONE,
      'students.read',
      'attendance.read',
      'grades.read',
      'timetable.read',
      'assignments.read',
    ],
    builtin: true,
  },
  {
    id: 'parent',
    name: 'Parent',
    description: "Reads their children's records, fees included — and nothing else.",
    scopeBy: 'students',
    permissions: [
      ...EVERYONE,
      'students.read',
      'attendance.read',
      'grades.read',
      'timetable.read',
      'assignments.read',
      'finance.read',
    ],
    builtin: true,
  },
]

/**
 * Roles that must keep `system.settings` between them.
 *
 * Stripping it from the last role holding it locks everyone out of the panel
 * that would put it back — the one mistake in a role editor you cannot undo
 * from inside the app.
 */
/**
 * Permission ids that have been renamed, and what they became.
 *
 * Lives with the catalogue rather than in one store because more than one
 * table persists permission ids: the roles table stores what a role grants,
 * and the notification table stores the audience a row was addressed to. The
 * first rename migrated only the roles table, and every notification written
 * before it became invisible to everyone — the audience said `students.view`
 * and no role granted that any more. Anything that persists an id imports this.
 *
 * One old id can become several. `students.manage` was a single write switch
 * and is now create, update, delete and transfer — a school that granted the
 * one thing meant to grant all of it, so migrating to the whole set preserves
 * what they actually chose.
 *
 * Keep entries forever. A stored row is only migrated when it is next read,
 * and a browser that has not been opened since the rename is still out there.
 */
export const RENAMED_PERMISSIONS: Readonly<Record<string, readonly Permission[]>> = {
  'dashboard.view': ['dashboard.read'],
  'calendar.view': ['calendar.read'],
  'notices.view': ['notices.read'],
  'students.view': ['students.read'],
  'students.manage': ['students.create', 'students.update', 'students.delete', 'students.transfer'],
  'teachers.view': ['teachers.read'],
  'attendance.view': ['attendance.read'],
  'grades.view': ['grades.read'],
  'grades.enter': ['grades.create', 'grades.update'],
  'timetable.view': ['timetable.read'],
  'assignments.view': ['assignments.read'],
  'finance.view': ['finance.read'],
  'transport.view': ['transport.read'],
  'settings.manage': ['system.settings'],
  'users.manage': ['users.read', 'users.create', 'users.update', 'roles.assign'],
}

/**
 * Run stored ids through the rename map, keeping order and deduping.
 *
 * Ids with no entry pass through untouched, including ones this build no
 * longer defines — dropping those is `reconcile`'s job, and doing it here too
 * would mean a caller that only wants renaming silently gets pruning.
 */
export function migratePermissionIds(ids: readonly string[]): Permission[] {
  const out: Permission[] = []
  ids.forEach(id => {
    const next = RENAMED_PERMISSIONS[id] ?? [id as Permission]
    next.forEach(candidate => {
      if (!out.includes(candidate)) out.push(candidate)
    })
  })
  return out
}

/** Whether the map would change anything — a real comparison, not a length. */
export function needsPermissionMigration(ids: readonly string[]): boolean {
  return ids.some(id => id in RENAMED_PERMISSIONS)
}

export function wouldOrphanSettings(roles: Role[]): boolean {
  return !roles.some(role => role.permissions.includes('system.settings'))
}

/**
 * The permission that already grants `id` by implication, if the role holds it.
 *
 * `manage` is a wildcard action: holding "Manage teachers" grants every action
 * on Teacher, reading included. That is the right domain rule — whoever may
 * edit a record may obviously see it — but it makes "View teachers" and
 * "Manage teachers" look like independent switches in the editor when they are
 * not. Toggling view off while manage stays on changed nothing, which is worse
 * than a disabled control: it looks like it worked.
 *
 * *Every* action, not just `read`. This checked `action === 'read'` at first,
 * which quietly missed the one case where it mattered most: `students.promote`
 * is a bespoke verb on the same subject, so "Manage students" grants it too,
 * and "Run promotions" sat there as a live switch that could not turn anything
 * off. Written against the wildcard rather than a list of actions, so a new
 * verb is covered the day it is added.
 */
export function impliedBy(id: Permission, held: Permission[]): PermissionDefinition | undefined {
  const definition = (PERMISSION_DEFINITIONS as readonly PermissionDefinition[]).find(
    candidate => candidate.id === id,
  )
  if (!definition || definition.action === 'manage') return undefined

  return (PERMISSION_DEFINITIONS as readonly PermissionDefinition[]).find(
    candidate =>
      candidate.action === 'manage' &&
      candidate.subject === definition.subject &&
      held.includes(candidate.id as Permission),
  )
}

export function findRole(roles: Role[], id: string | undefined): Role | undefined {
  if (!id) return undefined
  // Case-insensitive because `AuthUser.role` used to hold a display name
  // ("Admin"), and sessions created before roles had ids are still in
  // localStorage.
  const wanted = id.toLowerCase()
  return roles.find(role => role.id.toLowerCase() === wanted || role.name.toLowerCase() === wanted)
}
