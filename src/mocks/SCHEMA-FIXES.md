# Schema issues and fixes

Companion to [SCHEMA.md](./SCHEMA.md), which describes the target shape. This is
the list of schema problems and what to do about each.

Scope is the schema only — tables, columns, constraints. DDL is MySQL, against
`develop/user-management`. Where `feature/db-schema` (PostgreSQL) already
designs something, the fix is to port it rather than invent it.

## Global — identity

| Problem | Fix |
|---|---|
| `users.email` is `UNIQUE NOT NULL`, so an account cannot exist without an address — but a school knows a family's mobile long before it knows an email, and usually never learns one | `MODIFY email VARCHAR(255) NULL` |
| `users.phone` has a plain, non-unique index, so a number cannot resolve a login | `ADD CONSTRAINT uk_users_phone UNIQUE (phone)`. Deliberate cost: two parents sharing a family mobile cannot both hold it |
| Nothing stops a row with neither identifier | `CHECK (email IS NOT NULL OR phone IS NOT NULL)` |

## Tenant — people and roles

| Problem | Fix |
|---|---|
| No roles, permissions or role-permission tables exist, though both schema files' comments say roles live in the tenant DB | Port `roles`, `permissions`, `role_permissions` from `feature/db-schema:modules/permission-mgmt/schema.sql` into the tenant schema |
| `roles` has no way to say which way a holder is narrowed | Add `scope_axis VARCHAR(20) NULL` — `classes`, `students`, or null for unnarrowed. Closed set: each axis needs a subject field and a condition branch, so a new one is a developer's change |
| No table assigns roles to people, so a person can hold at most the one role a session carries | Add `profile_roles(profile_id, role_id, assigned_by, assigned_at, expires_at)`, `PRIMARY KEY (profile_id, role_id)`. This is the Postgres draft's `user_roles` re-keyed to the profile, which is what makes it per-school |
| `role_permissions.granted` allows an explicit deny, which makes rule order semantic once one person holds several roles | Keep the column for shape, `CHECK (granted = TRUE)` until precedence is designed |
| `user_profiles.profile_type` is a hard-coded 6-value enum mirrored in four places, and already wrong in three: `admin` and `staff` name no table, `guardian` shares `parents` | Drop the column. Add tenant tables `profile_types(code, name, capacity, is_builtin, is_active)` and `profile_profile_types(profile_id, profile_type_id, is_primary)` |
| A school cannot name its own kinds of person — "Bus Driver", "Visiting Faculty", "Lab Assistant" | `profile_types.code` is open and school-owned. `capacity` is closed (`student\|staff\|teacher\|parent\|none`) because a capacity is a set of columns, not a label — a custom type reuses an existing shape |
| One profile type per person breaks on the member of staff whose child attends the school | `profile_profile_types` is plural, with `is_primary` for anywhere a UI needs one answer |
| `admin` and `staff` have no capacity table, so an accountant or receptionist has no record | Add `staff(profile_id, employee_id, joining_date, department, designation)`. Move those columns out of `teachers`, whose `profile_id` then references `staff(profile_id)` — a teacher is staff who teach |
| `guardian` is distinct in the enum and identical in the schema; the real relationship is already in `student_parents.relationship` | Keep it as a built-in profile type over the `parent` capacity, or drop it |

## Tenant — records

| Problem | Fix |
|---|---|
| A teacher's assigned classes have no table, though the app already scopes teachers to class sections | Add `teacher_classes(profile_id, class_section)`, `PRIMARY KEY` on both. `class_section` is a label until `class_sections` exists, then an FK |
| `students` has no status, so the only way to stop a student appearing is to delete the row | `ADD status TINYINT NOT NULL DEFAULT 0` — active, on leave, withdrawn, graduated |
| None of the five tenant tables has `is_deleted`, though every global table does — a school can only erase a person, and erasing a profile cascades their history away | `ADD is_deleted BOOLEAN NOT NULL DEFAULT FALSE` to `user_profiles`, `students`, `teachers`, `parents`, `student_parents` |

## Missing tables

| Problem | Fix |
|---|---|
| `academic-mgmt` is designed on the Postgres branch and absent here, so class sections are bare strings with nothing to point at | Port `academic_years`, `terms`, `grade_levels`, `class_sections`, `subjects`. Then make `teacher_classes.class_section` and `students.grade_level`/`section` foreign keys |
| `time-table` designed and absent | Port `time_slots`, `rooms`, `calendar_categories`, `calendar_events`, `timetable`, `event_attendees` |
| `communication` designed and absent | Port `user_communication_preferences` |
| Attendance, grades, fees, expenses, transport, notices and notifications have no schema on any branch | Design them. They exist as features with mock stores and no target |

## Order

1. Roles, `profile_roles`, `profile_types`, `staff` — the multi-role model.
2. The three record gaps: `teacher_classes`, student status, `is_deleted`.
3. The identity change on `users`.
4. `academic-mgmt`, then turn the class-section labels into foreign keys.
