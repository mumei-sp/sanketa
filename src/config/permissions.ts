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
 * `manage` is CASL's wildcard — it implies every other action — which is why
 * "mark attendance" maps to `manage Attendance` rather than a bespoke verb:
 * whoever may amend a register may obviously read one, and saying so once
 * beats restating it.
 */
export type Action = 'read' | 'create' | 'update' | 'delete' | 'manage' | 'promote'

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
   * Whether holding this can be limited to a teacher's own classes.
   *
   * Declared rather than inferred, so which permissions answer "where?" as
   * well as "whether?" is visible in one place. Reading is deliberately never
   * scoped: a teacher should be able to look up any class's attendance or
   * marks — it is changing them that belongs to whoever owns the class.
   */
  scoped?: boolean
}

/**
 * The catalogue.
 *
 * `view` and a verb per area rather than a uniform read/write pair: "mark
 * attendance" and "enter grades" are the actions a school actually delegates,
 * and naming them after the job makes a role editor readable by the person
 * configuring it rather than by the person who wrote the table.
 */
export const PERMISSION_DEFINITIONS = [
  { id: 'dashboard.view', action: 'read', subject: 'Dashboard', group: 'General', label: 'View dashboard', description: 'See the home dashboard and its summaries.' },
  { id: 'calendar.view', action: 'read', subject: 'CalendarEvent', group: 'General', label: 'View calendar', description: 'See the school calendar.' },
  { id: 'calendar.manage', action: 'manage', subject: 'CalendarEvent', group: 'General', label: 'Manage calendar', description: 'Create, edit and cancel events.' },
  { id: 'notices.view', action: 'read', subject: 'Notice', group: 'General', label: 'View notices', description: 'Read the notice board.' },
  { id: 'notices.manage', action: 'manage', subject: 'Notice', group: 'General', label: 'Manage notices', description: 'Publish, pin and remove notices.' },

  { id: 'students.view', action: 'read', subject: 'Student', group: 'People', label: 'View students', description: 'See the student roster and profiles.' },
  { id: 'students.manage', action: 'manage', subject: 'Student', group: 'People', label: 'Manage students', description: 'Enrol students and edit their records.', scoped: true },
  { id: 'students.promote', action: 'promote', subject: 'Student', group: 'People', label: 'Run promotions', description: 'Move students between years.' },
  { id: 'teachers.view', action: 'read', subject: 'Teacher', group: 'People', label: 'View teachers', description: 'See the staff list and profiles.' },
  { id: 'teachers.manage', action: 'manage', subject: 'Teacher', group: 'People', label: 'Manage teachers', description: 'Add and edit staff records.' },

  { id: 'attendance.view', action: 'read', subject: 'Attendance', group: 'Academics', label: 'View attendance', description: 'See attendance records and history.' },
  { id: 'attendance.mark', action: 'manage', subject: 'Attendance', group: 'Academics', label: 'Mark attendance', description: "Submit and amend a class register.", scoped: true },
  { id: 'grades.view', action: 'read', subject: 'Grade', group: 'Academics', label: 'View grades', description: 'See grade sheets and report cards.' },
  { id: 'grades.enter', action: 'manage', subject: 'Grade', group: 'Academics', label: 'Enter grades', description: 'Record and submit exam marks.', scoped: true },
  { id: 'timetable.view', action: 'read', subject: 'Timetable', group: 'Academics', label: 'View timetable', description: 'See the class timetable.' },
  { id: 'timetable.manage', action: 'manage', subject: 'Timetable', group: 'Academics', label: 'Manage timetable', description: 'Edit periods and add substitutions.' },
  { id: 'assignments.view', action: 'read', subject: 'Assignment', group: 'Academics', label: 'View assignments', description: 'See assignments.' },

  { id: 'finance.view', action: 'read', subject: 'Finance', group: 'Finance', label: 'View finance', description: 'See fee collection and expenses.' },
  { id: 'finance.manage', action: 'manage', subject: 'Finance', group: 'Finance', label: 'Manage finance', description: 'Record payments and log expenses.' },
  { id: 'transport.view', action: 'read', subject: 'Transport', group: 'Transport', label: 'View transport', description: 'See routes, vehicles and drivers.' },
  { id: 'transport.manage', action: 'manage', subject: 'Transport', group: 'Transport', label: 'Manage transport', description: 'Edit routes, vehicles, drivers and transport fees.' },

  { id: 'settings.manage', action: 'manage', subject: 'Settings', group: 'Administration', label: 'Manage school settings', description: 'Change school, academic, timetable and appearance settings.' },
  { id: 'roles.manage', action: 'manage', subject: 'Role', group: 'Administration', label: 'Manage roles', description: 'Create roles and change what each one can do.' },
  { id: 'users.manage', action: 'manage', subject: 'User', group: 'Administration', label: 'Manage people', description: 'Change which role each person holds and which classes they cover.' },
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
  description?: string
  permissions: Permission[]
  /**
   * Limit this role's scoped permissions to the classes its holders are
   * assigned.
   *
   * The role says *whether* to narrow; the user says *what to*. Keeping the
   * two apart is what lets "Principals write everywhere" and "Teachers write
   * their own classes" be one mechanism instead of two: both hold
   * `attendance.mark`, and only one of them is scoped.
   */
  scopedToAssignedClasses?: boolean
  /**
   * Seeded with the app and not deletable.
   *
   * Their permissions can still be edited — a school may well decide its
   * Principals should not see finance — but removing them outright would
   * strand every user assigned to one.
   */
  builtin?: boolean
}

const EVERYONE: Permission[] = ['dashboard.view', 'calendar.view', 'notices.view']

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
      'students.view', 'students.manage', 'students.promote',
      'teachers.view', 'teachers.manage',
      'attendance.view', 'attendance.mark',
      'grades.view', 'grades.enter',
      'timetable.view', 'timetable.manage',
      'assignments.view',
      'finance.view',
      'transport.view',
    ],
    builtin: true,
  },
  {
    id: 'teacher',
    name: 'Teacher',
    description: 'Reads every class; writes only their own.',
    scopedToAssignedClasses: true,
    permissions: [
      ...EVERYONE,
      'students.view',
      'attendance.view', 'attendance.mark',
      'grades.view', 'grades.enter',
      'timetable.view',
      'assignments.view',
    ],
    builtin: true,
  },
  {
    id: 'accountant',
    name: 'Accountant',
    description: 'Fees, expenses and transport charges.',
    permissions: [
      ...EVERYONE,
      'students.view',
      'finance.view', 'finance.manage',
      'transport.view', 'transport.manage',
    ],
    builtin: true,
  },
]

/**
 * Roles that must keep `settings.manage` between them.
 *
 * Stripping it from the last role holding it locks everyone out of the panel
 * that would put it back — the one mistake in a role editor you cannot undo
 * from inside the app.
 */
export function wouldOrphanSettings(roles: Role[]): boolean {
  return !roles.some(role => role.permissions.includes('settings.manage'))
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
 */
export function impliedBy(id: Permission, held: Permission[]): PermissionDefinition | undefined {
  const definition = (PERMISSION_DEFINITIONS as readonly PermissionDefinition[]).find(
    candidate => candidate.id === id,
  )
  if (!definition || definition.action !== 'read') return undefined

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
