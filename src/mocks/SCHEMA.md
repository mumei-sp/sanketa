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

Identity, and nothing that belongs to a school. The rule from
`Multi-Tenant-LMS__ARCH.md`: *"GlobalDB stores identity and lightweight mapping
data only. Do not model domain FK relationships across GlobalDB and
SchoolDBs."*

| Table | Purpose | Status |
|---|---|---|
| `users` | Login identity: `email?`, `phone?`, `status`, `keycloak_user_id` | exists (MySQL) |
| `tenants` | The schools: `tenant_code`, `name`, `is_active` | exists (MySQL) |
| `user_tenant_mapping` | This person is at this school. `UNIQUE(user_id, tenant_id)` | exists (MySQL) |
| `tenant_database_mapping` | Which schema a tenant lives in | exists (MySQL) |
| `fabric_sessions` | Issued token hashes, for revocation | exists (MySQL) |

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

| Table | Purpose | Status |
|---|---|---|
| `user_profiles` | One row per person **at this school** | exists (MySQL) |
| `students` | `profile_id` PK → `user_profiles(id)` | exists (MySQL) |
| `teachers` | `profile_id` PK → `user_profiles(id)` | exists (MySQL) |
| `parents` | `profile_id` PK → `user_profiles(id)` | exists (MySQL) |
| `student_parents` | Who a child's guardians are | exists (MySQL) |
| `roles` | School-defined. `scope_axis` is new — see below | designed (Postgres) |
| `permissions` | The catalogue. Ids are code constants | designed (Postgres) |
| `role_permissions` | `role_id`, `permission_id`, `granted` | designed (Postgres) |
| `profile_roles` | **The multi-role join.** Was `user_roles` | this frontend |
| `teacher_classes` | `profile_id`, `class_section` | this frontend |

### Capacities, and why `profile_type` should go

`students`, `teachers` and `parents` each take `profile_id` as their primary
key, all three referencing the same `user_profiles(id)`. Nothing stops one
profile having a `teachers` row *and* a `parents` row — so **a teacher whose
child attends the same school is already representable**.

The only thing that disagrees is `user_profiles.profile_type`, a single
`TINYINT` claiming the person is one thing. It is correct only for people who
are exactly one thing, and wrong for every member of staff with a child at the
school. It should be dropped, or demoted to a display hint:

> A profile is a person at a school. What they *are* there is which capacity
> tables reference them.

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

## Modules with a designed schema and no mock table yet

`academic-mgmt` (`academic_years`, `terms`, `grade_levels`, `class_sections`,
`subjects`), `time-table` (`time_slots`, `rooms`, `calendar_categories`,
`calendar_events`, `timetable`, `event_attendees`) and `communication`
(`user_communication_preferences`) are designed on the Postgres branch. The
mocks for those features predate the schema and do not match it yet.

## Backend work this implies

1. `users`: email nullable, phone unique, at-least-one check.
2. Drop `profile_type` from both `user_profiles` copies, or demote it.
3. Create `roles`, `permissions`, `role_permissions`, `profile_roles`,
   `teacher_classes` in the tenant schema.
4. Add `scope_axis` to `roles`.
5. Write paths for `users`, `user_profiles`, `user_tenant_mapping` — the
   repositories are read-only today and nothing creates a person.
6. A login endpoint. `TenantContextTokenService.generateToken` is written and
   has no caller.
