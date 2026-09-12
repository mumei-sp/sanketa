# The schema this mock is modelled on

Every store under `src/mocks/` is shaped as a table in the schema the backend
is expected to have, so adoption is a mapping rather than a rewrite. This file
is the contract: what the tables are, which of them exist on a backend branch
today, and which are this frontend's specification.

## Where the target comes from

Two backend drafts exist and neither is a superset of the other.

| | `feature/db-schema` (PostgreSQL) | `develop/user-management` (MySQL) |
|---|---|---|
| Roles, permissions, multi-role | designed | absent |
| Role hierarchy, deny, expiry | designed | absent |
| Multi-tenancy, routing, tokens | absent | designed |
| Academic / timetable / communication | designed | absent |

The target below merges them. The join is one decision: the Postgres draft's
`user_roles(user_id, role_id)` becomes **`profile_roles(profile_id, role_id)`
in the tenant schema**. A profile is "this user at this school", so keying role
assignments on the profile makes them per-school without a tenant column, and
the two drafts compose.

## Global database — `sanketa_global`

Identity, and nothing that belongs to a school. `Multi-Tenant-LMS__ARCH.md`
(on `feature/db-schema`) states the rule twice — *"GlobalDB stores identity and
lightweight mapping data only"* of the global model, and *"Do not model domain
FK relationships across GlobalDB and SchoolDBs"* of the tenant one.

| Table | Purpose | Status | Mocked |
|---|---|---|---|
| `users` | Login identity: `email?`, `phone?`, `status`, `keycloak_user_id` | exists (MySQL) | yes |
| `user_profiles` | The person behind the login: name, DOB, gender, phone. Source of truth for the copy each tenant holds | exists (MySQL) | no — see below |
| `tenants` | The schools: `tenant_code`, `name`, `is_active` | exists (MySQL) | yes |
| `user_tenant_mapping` | This person is at this school. `UNIQUE(user_id, tenant_id)` | exists (MySQL) | yes |
| `tenant_database_mapping` | Which schema a tenant lives in | exists (MySQL) | folded into `tenants.schema` |
| `fabric_sessions` | Issued token hashes, for revocation | exists (MySQL) | yes |

### `user_profiles` lives in both databases on purpose

The tenant copy is a read replica of a column subset.
`DENORMALIZED_PROFILE_ARCHITECTURE.md` names the global row the source of truth
and the tenant row a denormalized copy, kept current by sync triggers. The
subset is strict: the tenant carries name, DOB, gender, primary phone and
picture; the global row adds secondary and emergency contacts, address, bio,
privacy flags and `custom_fields`, none of which a school screen reads.
Rendering a class list without the copy would mean a cross-database join per
row — the one thing the ARCH doc forbids above.

The mock has no global `user_profiles` because it has nothing to gain from
one. There is no round trip to save in a browser, and a second copy of every
name could only go stale. `tenant/profiles` **is** the replica, and the sync is
out of scope.

One replicated column did not belong there: `profile_type`. `UNIQUE(user_id)`
on the global row meant a person had exactly one, copied verbatim into every
school — so a teacher at Kendriya who is a parent at Vidya Mandir could not be
both. **It is being dropped from both copies**, which is the one schema change
on this page that is settled rather than proposed. Every other replicated
column is a fact about the person rather than about the person *at a school*,
which is what makes the rest of the design sound.

### Changes this frontend requires of `users`

```sql
email VARCHAR(255) UNIQUE NULL,      -- was NOT NULL
phone VARCHAR(20)  UNIQUE NULL,      -- was a plain, non-unique index
CONSTRAINT chk_users_identifier CHECK (email IS NOT NULL OR phone IS NOT NULL)
```

A school knows a family's mobile long before it knows an address, and usually
never learns one. Requiring an email meant provisioning a parent began by
inventing a fact about them. Unique on `phone` is the cost: two parents sharing
a family mobile cannot both hold it, and the second needs an address.

## Tenant schema — one per school

| Table | Purpose | Status | Mocked |
|---|---|---|---|
| `user_profiles` | One row per person **at this school** | exists (MySQL) | yes |
| `students` | `profile_id` PK → `user_profiles(id)` | exists (MySQL) | yes |
| `teachers` | `profile_id` PK → `user_profiles(id)` | exists (MySQL) | yes |
| `parents` | `profile_id` PK → `user_profiles(id)` | exists (MySQL) | yes |
| `student_parents` | Who a child's guardians are | exists (MySQL) | yes |
| `staff` | `profile_id` PK — non-teaching staff, and what `teachers` extends | this frontend | yes |
| `roles` | School-defined. `scope_axis` is new — see below | designed (Postgres) | yes |
| `permissions` | The catalogue. Codes are code constants | designed (Postgres) | code constants |
| `role_permissions` | `role_id`, `permission_id`, `granted` | designed (Postgres) | an array on the role |
| `profile_roles` | **The multi-role join.** Was `user_roles` | this frontend | yes |
| `profile_types` | School-extensible classifications, with built-ins | this frontend | yes |
| `profile_profile_types` | A person may be more than one kind | this frontend | yes |
| `teacher_classes` | `profile_id`, `class_section` | this frontend | flattened onto the profile |

### Capacities and profile types — two different things

`students`, `teachers` and `parents` each take `profile_id` as their primary
key, all three referencing the same `user_profiles(id)`. Nothing stops one
profile having a `teachers` row *and* a `parents` row — so **a teacher whose
child attends the same school is already representable**.

The only thing that disagreed was `user_profiles.profile_type`, a single
`TINYINT` claiming the person is one thing. It was correct only for people who
are exactly one thing, and wrong for every member of staff with a child at the
school — and being replicated from a global row with `UNIQUE(user_id)`, it made
the same claim in every school at once. **It is going, from GlobalDB and from
the tenant replica**, replaced by two ideas that were tangled inside it:

**A capacity is a record shape.** `students` has an admission number and a roll
number; `teachers` has a qualification; `staff` has an employee id. The set is
closed, and a new one is a developer adding a table — because "create a
Librarian capacity" cannot be answered without somebody saying what fields a
librarian record has. Capacities are plural per profile and **not stored**: what
someone is here is which capacity tables reference them.

**A profile type is a classification, and a school may invent them.** "Bus
Driver", "Visiting Faculty", "Alumni", "Lab Assistant". Tenant-scoped, because
one school's vocabulary is not another's. Each one declares which capacity it
uses — so a custom type gets a sane record shape without inventing columns —
and `none` covers a classification with no record of its own. Built-in types
are seeded per tenant and flagged so a school cannot delete what the app relies
on.

Profile types are plural per profile, with `is_primary` for anywhere a UI needs
one answer. Every single-valued field in this model has broken on the same
person — the member of staff whose child attends the school — and a scalar
profile type would break in exactly the way the scalar role did.

### `profile_roles` — the merge

```sql
CREATE TABLE profile_roles (
    profile_id   BIGINT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    role_id      BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by  BIGINT,
    assigned_at  DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    expires_at   DATETIME(6) NULL,
    PRIMARY KEY (profile_id, role_id),
    CONSTRAINT chk_role_expiry CHECK (expires_at IS NULL OR expires_at > assigned_at)
);
```

Straight from the Postgres draft's `user_roles`, re-keyed to the profile. That
one change gives all four cases at once: many roles per person, many capacities
per person, many schools per person, and role sets that differ per school.

`expires_at` is worth keeping — an acting head of department for one term is a
real thing, and a role that expires on its own is better than one somebody has
to remember to remove.

### `roles.scope_axis` — new, and this frontend's

```sql
scope_axis ENUM('classes','students') NULL
```

Neither draft has it. It says which way a role narrows: a teacher to their
class sections, a family to their own children. `NULL` means the role is not
narrowed and reaches everything its permissions allow.

Scope axes are a closed set on purpose — each one needs a matching field on the
subject and a branch in the condition builder, so adding "by subject" or "by
campus" is a developer's change, not a school's.

## What "mocked" means, and what it does not

A `yes` in the column above means `src/mocks/` holds that table under its own
name, with that key, and the app reads and writes it through functions rather
than reaching for an array. It is a working reference for the shape — not
evidence that any of it exists in a database. Everything in
[SCHEMA-FIXES.md](./SCHEMA-FIXES.md) is still to do.

Three rows say something other than `yes`, and the difference is the point:
`tenant_database_mapping` is a column on the tenant row rather than a table,
`role_permissions` is an array on the role, and `teacher_classes` is a field on
the profile. Each is a join table collapsed because nothing yet needs the third
column, and each is a place the mock will have to grow one.

### The demonstration worth having

`user_profiles` is one row per person and not one per login, which is the
thing easiest to get wrong and hardest to notice. At Kendriya the mock seeds
**1,129 profiles for 1,127 people** — 441 students, 31 staff, 655 parents, plus
three office staff, less one person counted twice — against **five logins**.
That one person counted twice is the whole case: the teacher whose child
attends is a single profile with a `teachers` row and a `parents` row under one
id, and she reads her own classes and her own son from it.

`user_id` is null on 1,124 of those rows, which is why SCHEMA-FIXES puts making
the column nullable first.

## States the mock carries and has never exercised

Columns and paths that exist in the shape and have no seeded data behind them.
Each is a code path nothing has run:

- `user_tenant_mapping.is_active` — no membership is revoked.
- `tenants.is_active` — both schools are live.
- `users.status` — no account is invited or suspended.
- `profile_roles.expires_at` — nothing expires.
- A school-created `profile_types` row — all six are built-in at both schools.
- `is_deleted` — the field is on the profile and nothing sets it.

## What is mirrored but not implemented

These columns exist in the Postgres draft and are carried into the mock's types
so the shape matches, but nothing reads them yet. They are marked in the code.

- **`roles.parent_role_id`, `hierarchy_level`** — role inheritance.
- **`permissions.inheritable`, `inheritance_rule`** — permission inheritance
  down that tree.
- **`role_permissions.granted`** — explicit deny. **Constrained to `true`.**
  The ability builder unions the rules of every role a person holds, which is
  correct while rules only ever grant. One deny and evaluation order becomes
  semantic — with multi-role and hierarchy both in play, precedence is a design
  problem in its own right, and nothing needs it yet.

## Tenant schema — `academic-mgmt`

Ported from the Postgres branch rather than invented. Postgres enums become
string unions and UUIDs become strings; nothing else is reshaped.

| Table | Purpose | Status | Mocked |
|---|---|---|---|
| `academic_years` | The year, its working days, its grade scale | designed (Postgres) | yes |
| `terms` | Three per year, each with an exam window | designed (Postgres) | yes |
| `grade_levels` | Class 1 to 10, with `level_order` | designed (Postgres) | yes |
| `class_sections` | `capacity`, `current_enrollment`, **`class_teacher_id`** | designed (Postgres) | yes |
| `subjects` | The school's own, with a `department` | designed (Postgres) | yes |

### What its absence was costing

A class section was a bare string — `'8B'` on a student, on a teacher's
assignment, on a register, in a timetable, with nothing to point at. The only
list of them was `SchoolConfig.classSections`, a UI settings blob, which made
a school's academic structure a *preference*. Three consequences the app
actually carried:

**No class teacher.** `classTeacherOf` picked one by hashing the section label.
`class_sections.class_teacher_id` is the column that was missing; a school sets
it, because teaching a class is not the same as being responsible for it.

**No capacity.** "Is 8B full?" had no answer. `current_enrollment` is counted
off the roster rather than typed, so the two cannot drift.

**Subjects were the app's, not a school's.** Vidya Mandir employs Kannada
teachers — Karnataka requires the state language — and there was no slot in the
grid for a subject the app had not heard of. They had a department, a payroll
line, and no lesson to teach. `subjects` being tenant data is what fixes that.

### The one thing here that is not a ported table

`CurriculumEntry` — how many periods a week each subject gets, by band. The
schema it wants to be is
`grade_level_subjects(grade_level_id, subject_id, periods_per_week)`, which
neither branch designs. It is kept apart from the five above so nobody mistakes
it for a port. It has to live somewhere: the period counts were two constants
inside the timetable generator, which made a curriculum the app's opinion.

## Tenant schema — `time-table`

| Table | Purpose | Status | Mocked |
|---|---|---|---|
| `time_slots` | The bell — periods and breaks, per school | designed (Postgres) | yes |
| `rooms` | **Where a class is**, with a capacity and a type | designed (Postgres) | yes |
| `calendar_categories` | Colour and icon per kind of event | designed (Postgres) | yes |
| `calendar_events` | Every scheduled thing, with academic context | designed (Postgres) | yes |
| `timetable` | The weekly pattern that generates those events | designed (Postgres) | yes |
| `event_attendees` | Who is invited, and what they answered | designed (Postgres) | yes |

### What a room being a string was costing

A room was text on a slot — `'Lab 1'`, `'Ground'`, `'Room 901'`. Nothing
pointed at anything, so nothing could check, and nothing did: the timetabler
put **three classes in Lab 1 at once, 57 times at one school and 14 at the
other**. It refused to double-book a teacher and had no idea a room could be
double-booked at all.

With `rooms` as rows, a class has a homeroom and a specialist subject books a
shared room that holds one class at a time. That is a second hard constraint on
placement — one computer lab means at most one class doing Computer Science in
any period, whatever the teachers are doing — and both schools now schedule
with **zero** room conflicts.

`time_slots` moves the bell out of the app's shared config, where two schools
in two cities rang it at the same minute.

### The pattern and its occurrences

The schema's own comment calls `timetable` rows "weekly patterns that generate
calendar events", and `timetable.calendar_event_id` is the link: a row is the
rule, an event is one occurrence. The mock holds the rule — 570 rows at
Kendriya, 360 at Vidya Mandir — and generating a term's occurrences from it is
a backend job.

`event_attendees` had no mock at all, so the RSVP the schema designs was a
table nothing had ever written a row into. Staff meetings carry one now.

## Modules with a designed schema and no mock table yet

`communication` (`user_communication_preferences`) is designed on the Postgres
branch and has no mock.

## Backend work this implies

See [SCHEMA-FIXES.md](./SCHEMA-FIXES.md) for the change list with DDL, in the
order worth doing it.
