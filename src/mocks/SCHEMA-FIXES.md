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
| GlobalDB's `user_profiles` is replicated into every tenant as a column subset, so `UNIQUE(user_id)` plus `profile_type NOT NULL` gives one person one `profile_type` in every school at once — a teacher at one and a parent at another cannot be expressed | **Agreed: `profile_type` is dropped from both copies.** The rest of the replica is sound — name, DOB, gender, phone and picture are facts about the person, not about the person at a school |

## Tenant — people and roles

| Problem | Fix |
|---|---|
| `user_profiles.user_id` is `NOT NULL` in both databases, so a person cannot exist at a school without a login — but a school of 1,100 people has a handful who sign in, and the rest would need accounts created solely to satisfy the column, each one needing an email or phone under the identifier check above | `MODIFY user_id BIGINT NULL` in both. The unique index tolerates it: MySQL allows repeated NULLs. The tenant row must also be allowed to originate locally, since a person with no login has no global row to sync from |
| No roles, permissions or role-permission tables exist, though both schema files' comments say roles live in the tenant DB | Port `roles`, `permissions`, `role_permissions` from `feature/db-schema:modules/permission-mgmt/schema.sql` into the tenant schema |
| `roles` has no way to say which way a holder is narrowed | Add `scope_axis VARCHAR(20) NULL` — `classes`, `students`, or null for unnarrowed. Closed set: each axis needs a subject field and a condition branch, so a new one is a developer's change |
| A school could invent a role narrowed to `students` — a family role it made up — and a family role's scope is not configurable: it comes from `student_guardians` | Only a built-in role may hold `scope_axis = 'students'`, and a built-in one may not leave it. `CHECK (scope_axis <> 'students' OR is_builtin)` states half of it; the other half is that nothing may move Student or Parent off the axis, which is the mistake in a role editor with no visible symptom |
| No table assigns roles to people, so a person can hold at most the one role a session carries | Add `profile_roles(profile_id, role_id, assigned_by, assigned_at, expires_at)`, `PRIMARY KEY (profile_id, role_id)`. This is the Postgres draft's `user_roles` re-keyed to the profile, which is what makes it per-school |
| `role_permissions.granted` allows an explicit deny, which makes rule order semantic once one person holds several roles | Keep the column for shape, `CHECK (granted = TRUE)` until precedence is designed |
| Nothing stops `profile_roles` naming a profile with no login. The row is inert — a role nobody can exercise, because roles are resolved from the session's `users.id` through `user_profiles.user_id` | Leave it. A person can be given a role before being given an account, and a constraint would make the two writes ordered. Worth a report, not a check |
| `user_profiles.profile_type` is a hard-coded 6-value enum mirrored in four places, and already wrong in three: `admin` and `staff` name no table, `guardian` names the same one as `parent` | **Agreed.** `DROP COLUMN profile_type` in GlobalDB and in the tenant replica. What records somebody has is which capacity tables hold their `profile_id` — nothing to store. What their job is called is `staff_designations`, staff only |
| A school cannot name its own kinds of person — "Bus Driver", "Visiting Faculty", "Lab Assistant" | **Agreed, and they are job titles.** Add `staff_designations(code, name, is_active)`, school-owned in full, with `staff.designation_id` a nullable FK. A catalogue rather than free text so headcount-by-title is a `GROUP BY` and a restructure is one row |
| One kind per person breaks on the member of staff whose child attends the school | Capacities are plural by construction — she has a `teachers` row and a `guardians` row. Nothing else needs to be: a job title is one thing, and the plurality that carries meaning is `profile_roles` |
| `admin` and `staff` have no capacity table, so an accountant or receptionist has no record | **Agreed and done in the mock.** `staff(profile_id, employee_id, joining_date, department, designation_id)`, and `teachers.profile_id` references `staff(profile_id)` rather than `user_profiles(id)` — a teacher is staff who teach. `employee_id`, `joining_date` and `department` move off `teachers`, which keeps only what is true of teaching |
| The member of staff who is Bus Driver *and* Librarian has one job title | One is right. Two **roles** carry what he may do, and roles are already plural; a designation is what the letterhead says. If a school wants both on the letterhead it adds the title "Bus Driver / Librarian" |
| `parents` is named for the commonest case, not for what it holds — 62 of the 1,129 rows across the two schools are an uncle. Which one somebody is is already in the link's `relationship` | **Agreed.** Rename to `guardians` / `student_guardians`, `parent_profile_id` → `guardian_profile_id`, capacity `parent` → `guardian` |

## Tenant — records

| Problem | Fix |
|---|---|
| A teacher's assigned classes have no table, though the app already scopes teachers to class sections | Add `teacher_classes(profile_id, class_section)`, `PRIMARY KEY` on both. `class_section` is a label until `class_sections` exists, then an FK |
| `students` has no status, so the only way to stop a student appearing is to delete the row | `ADD status TINYINT NOT NULL DEFAULT 0` — active, on leave, withdrawn, graduated |
| None of the five tenant tables has `is_deleted`, though every global table does — a school can only erase a person, and erasing a profile cascades their history away | `ADD is_deleted BOOLEAN NOT NULL DEFAULT FALSE` to `user_profiles`, `students`, `teachers`, `guardians`, `student_guardians` |

## Missing tables

| Problem | Fix |
|---|---|
| `academic-mgmt` is designed on the Postgres branch and absent here, so class sections are bare strings with nothing to point at | Port `academic_years`, `terms`, `grade_levels`, `class_sections`, `subjects`. Then make `teacher_classes.class_section` and `students.grade_level`/`section` foreign keys |
| `time-table` designed and absent | Port `time_slots`, `rooms`, `calendar_categories`, `calendar_events`, `timetable`, `event_attendees` |
| `communication` designed and absent | Port `user_communication_preferences` |
| Attendance, grades, fees, expenses, transport, notices and notifications have no schema on any branch | Design them. They exist as features with mock stores and no target |

## Order

1. `user_profiles.user_id` nullable. Everything below assumes a person can
   exist at a school without a login, and most of them do.
2. Roles, `profile_roles`, `staff`, `staff_designations` — the multi-role model.
3. The three record gaps: `teacher_classes`, student status, `is_deleted`.
4. The identity change on `users`.
5. `academic-mgmt`, then turn the class-section labels into foreign keys.
6. Dropping `profile_type` from GlobalDB's `user_profiles` and from the tenant
   replica. Last because step 2 has to give it somewhere to go first.
