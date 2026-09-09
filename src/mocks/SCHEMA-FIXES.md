# Schema changes the frontend needs

Companion to [SCHEMA.md](./SCHEMA.md), which describes the target. This is the
list of changes to get there, written for whoever owns the backend.

DDL is MySQL, targeting `develop/user-management` — the branch the Java builds
against. Where a design already exists on `feature/db-schema` (PostgreSQL) it
is cited, because most of this is porting that draft rather than inventing.

Nothing here is speculative: every item is either something the frontend
already ships and the schema cannot store, or something without which the
multi-role model does not work.

---

## 1. Blocking — behaviour already shipped that has nowhere to live

### 1.1 A teacher's assigned classes

The app scopes teachers to class sections. `teachers` has `employee_id`,
`qualification`, `specialization`, `joining_date`, `department`,
`professional_info` — and no classes. There is no `teacher_classes` table and
no `class_sections` table in the MySQL tenant schema at all.

```sql
CREATE TABLE teacher_classes (
    profile_id    BIGINT NOT NULL,
    class_section VARCHAR(20) NOT NULL,
    PRIMARY KEY (profile_id, class_section),
    CONSTRAINT fk_teacher_classes_profile FOREIGN KEY (profile_id)
        REFERENCES teachers(profile_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

`class_section` is a label (`9A`) because that is what the app scopes on today.
Once `academic-mgmt`'s `class_sections` lands (§5.1) this should become an FK to
it — a label is fine while there is nothing to point at, and a foreign key is
better the moment there is.

### 1.2 Sign-in by mobile number

`users.email` is `UNIQUE NOT NULL` and `phone` has a plain, non-unique index,
so a number can neither be required-of nor resolved-to an account. A school
knows a family's mobile long before it knows an address and usually never
learns one.

```sql
ALTER TABLE users MODIFY email VARCHAR(255) NULL;
ALTER TABLE users ADD CONSTRAINT uk_users_phone UNIQUE (phone);
ALTER TABLE users ADD CONSTRAINT chk_users_identifier
    CHECK (email IS NOT NULL OR phone IS NOT NULL);
```

Unique on `phone` is a deliberate cost, not an oversight: two parents sharing
one family mobile cannot both hold it, and the second needs an address. The
frontend says so in the row rather than failing on submit.

### 1.3 A student's status

The app has students who are `Active` or `On Leave`. `students` has no status
column, so the only way to stop a student appearing is to delete the row.

```sql
ALTER TABLE students ADD status TINYINT NOT NULL DEFAULT 0
    COMMENT '0=ACTIVE, 1=ON_LEAVE, 2=WITHDRAWN, 3=GRADUATED';
```

### 1.4 Soft delete on tenant tables

Every global table carries `is_deleted`. **None of the five tenant tables
does** — not `user_profiles`, `students`, `teachers`, `parents` or
`student_parents`. So a school cannot deactivate a person, only erase them,
and erasing a profile cascades their whole history away.

```sql
ALTER TABLE user_profiles   ADD is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE students        ADD is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE teachers        ADD is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE parents         ADD is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE student_parents ADD is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
```

---

## 2. The multi-role, multi-capacity model

### 2.1 Roles and permissions, in the tenant schema

Ported from `feature/db-schema:modules/permission-mgmt/schema.sql`, which
already designs all of this. Tenant-scoped, not global: a school invents its
own roles, and the schema comment on the MySQL branch already says *"Tenant DBs
store all school-specific data and roles"*.

```sql
CREATE TABLE permissions (
    id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code         VARCHAR(150) UNIQUE NOT NULL,   -- 'attendance.mark'
    name         VARCHAR(150) NOT NULL,
    description  TEXT,
    category     VARCHAR(50) NOT NULL,
    module       VARCHAR(50) NOT NULL,
    -- Reserved. See SCHEMA.md, "mirrored but not implemented".
    inheritable      BOOLEAN NOT NULL DEFAULT FALSE,
    inheritance_rule VARCHAR(20) NOT NULL DEFAULT 'none',
    is_active    BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE roles (
    id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code          VARCHAR(50) UNIQUE NOT NULL,
    name          VARCHAR(100) NOT NULL,
    description   TEXT,
    -- Which way holders are narrowed. NULL = not narrowed.
    scope_axis    VARCHAR(20) NULL COMMENT 'classes | students',
    is_builtin    BOOLEAN NOT NULL DEFAULT FALSE,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    -- Reserved.
    parent_role_id   BIGINT UNSIGNED NULL,
    hierarchy_level  INT NOT NULL DEFAULT 0,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    is_deleted    BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_roles_parent FOREIGN KEY (parent_role_id)
        REFERENCES roles(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE role_permissions (
    role_id       BIGINT UNSIGNED NOT NULL,
    permission_id BIGINT UNSIGNED NOT NULL,
    -- Reserved, and constrained. One deny makes rule order semantic while
    -- multi-role and hierarchy are both in play; nothing needs it yet.
    granted       BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT chk_role_permissions_granted CHECK (granted = TRUE),
    CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id)
        REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id)
        REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

`scope_axis` is the one column neither draft has. It says which way a role
narrows — a teacher to their class sections, a family to their own children.
The set is closed on purpose: each axis needs a matching field on the subject
and a branch in the condition builder, so adding "by subject" or "by campus" is
a developer's change, not a school's.

`permissions` is seeded from the frontend's catalogue, which is the authority —
a permission has to correspond to a code path, so one invented through the UI
would grant nothing. The table exists so `role_permissions` has something to
key on and so a school's role editor can show names and descriptions.

### 2.2 `profile_roles` — many roles per person per school

The join that makes the whole model work. `feature/db-schema` has this as
`user_roles(user_id, role_id)`; re-keying it to `profile_id` is what makes it
per-school, because a profile *is* one person at one school.

```sql
CREATE TABLE profile_roles (
    profile_id   BIGINT NOT NULL,
    role_id      BIGINT UNSIGNED NOT NULL,
    assigned_by  BIGINT NULL,
    assigned_at  DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    expires_at   DATETIME(6) NULL,
    PRIMARY KEY (profile_id, role_id),
    CONSTRAINT chk_profile_roles_expiry
        CHECK (expires_at IS NULL OR expires_at > assigned_at),
    CONSTRAINT fk_profile_roles_profile FOREIGN KEY (profile_id)
        REFERENCES user_profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_profile_roles_role FOREIGN KEY (role_id)
        REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

One person at one school may hold Admin and Teacher and Parent at once. The
permissions they get are the union of those roles', and each role is narrowed
on its own axis — so a teacher who is also a parent reads her own classes *and*
her own child, which single-role scoping cannot express at all.

`expires_at` is worth keeping from the draft. An acting head of department for
one term is a real thing, and a role that lapses on its own is better than one
somebody has to remember to remove.

### 2.3 Profile types — tenant-scoped, extensible, with built-ins

`user_profiles.profile_type` is a `TINYINT` against a hard-coded six-value
enum, mirrored in four places (the MySQL comment, the PostgreSQL `CREATE TYPE`,
a Java enum, and a TypeScript union whose array index *is* the wire code).
Adding a value is four coordinated edits and a migration.

It is also already wrong. Six values, three tables: `student`, `teacher` and
`parent` have capacity tables; `guardian` shares `parents`; **`admin` and
`staff` have no table at all.** Half the enum names something with no record
behind it.

Replace it with a tenant table, seeded with the built-ins and open to a
school's own additions.

```sql
CREATE TABLE profile_types (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code        VARCHAR(50) UNIQUE NOT NULL,
    name        VARCHAR(100) NOT NULL,
    -- Which record shape a person of this type has. NOT extensible: a
    -- capacity is a set of columns, not a label, so a new one is a developer
    -- adding a table. A school's custom type reuses an existing shape.
    capacity    VARCHAR(20) NOT NULL
                COMMENT 'student | staff | teacher | parent | none',
    is_builtin  BOOLEAN NOT NULL DEFAULT FALSE,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT chk_profile_types_capacity
        CHECK (capacity IN ('student','staff','teacher','parent','none'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE profile_profile_types (
    profile_id      BIGINT NOT NULL,
    profile_type_id BIGINT UNSIGNED NOT NULL,
    is_primary      BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (profile_id, profile_type_id),
    CONSTRAINT fk_ppt_profile FOREIGN KEY (profile_id)
        REFERENCES user_profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_ppt_type FOREIGN KEY (profile_type_id)
        REFERENCES profile_types(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE user_profiles DROP COLUMN profile_type;
```

**Why plural.** Every single-valued field in this model has broken on the same
person: the member of staff whose child attends the school. A scalar
`profile_type` would break in exactly the way the scalar `role` did. `is_primary`
carries whatever a UI needs a single answer for — the same pattern
`student_parents.is_primary` already uses.

**Why `capacity` is closed while `code` is open.** A profile type is a
classification a school can invent — "Bus Driver", "Visiting Faculty",
"Alumni", "Lab Assistant". A capacity is a set of columns: `students` has an
admission number and a roll number, `teachers` has a qualification. "Create a
Librarian profile type" is answerable; "create a Librarian *table*" needs
somebody to say what fields a librarian record has. So a custom type declares
which existing shape it uses, and `none` covers a classification with no record
of its own.

Built-in rows, seeded per tenant and flagged `is_builtin` so a school cannot
delete what the app relies on:

| code | capacity |
|---|---|
| `student` | `student` |
| `teacher` | `teacher` |
| `staff` | `staff` |
| `parent` | `parent` |
| `guardian` | `parent` |
| `admin` | `staff` |

Note that `librarian`, `counselor` and `coordinator` are **not** here.
`feature/db-schema:modules/permission-mgmt/seed.sql` already seeds those as
*roles*, which is right — they describe what someone may do, not what record
they have. The design was role-based from the start; the enum never caught up.

### 2.4 A `staff` capacity

`admin` and `staff` name no table, so an accountant or a receptionist has no
record. `teachers` already carries the employment columns (`employee_id`,
`joining_date`, `department`) mixed in with the teaching ones.

Split them, the way JOINED inheritance is used elsewhere in this codebase — a
teacher is staff who teach:

```sql
CREATE TABLE staff (
    profile_id   BIGINT PRIMARY KEY,
    employee_id  VARCHAR(50) UNIQUE NOT NULL,
    joining_date DATE,
    department   VARCHAR(100),
    designation  VARCHAR(100),
    is_deleted   BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT chk_staff_joining_date CHECK (joining_date IS NULL OR joining_date <= CURDATE()),
    CONSTRAINT chk_staff_employee_id_format CHECK (employee_id REGEXP '^[A-Z0-9]+$'),
    CONSTRAINT fk_staff_profile FOREIGN KEY (profile_id)
        REFERENCES user_profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

`teachers` then keeps only what is true of teaching staff —
`qualification`, `specialization`, `professional_info` — and its `profile_id`
references `staff(profile_id)` instead of `user_profiles(id)`. Its
`employee_id`, `joining_date` and `department` columns move to `staff`.

---

## 3. Structural corrections

### 3.1 Tenant JPA entities do not compile

`src/main/java/com/sanketa/user/domain/entity/*.java` import
`com.sanketa.user.converter.ProfileTypeConverter`,
`com.sanketa.user.domain.enums.ProfileType` and
`com.sanketa.user.domain.entity.User` — **none of which exist on the branch.**

`UserProfile.java` also maps a real foreign key to a `users` entity:

```java
@JoinColumn(name = "user_id", nullable = false, unique = true,
            foreignKey = @ForeignKey(name = "fk_user_profiles_user_id"))
private User user;
```

implying a `users` table inside the tenant schema. The tenant SQL has none, and
deliberately leaves `user_id` an unconstrained `BIGINT` — the ARCH doc's rule
is no FKs across the global/tenant boundary. The entity also declares
`first_name`/`last_name` `nullable = false` with `@NotBlank`, contradicting both
SQL schemas, which allow either to be null for Indian naming and check that at
least one of first/last/full is present.

Treat the SQL as authoritative and regenerate the entities.

### 3.2 Nothing keeps the tenant profile copy in sync

Tenant `user_profiles` is documented as *"a denormalized copy of
frequently-accessed profile columns from GlobalDB.user_profiles… kept in sync
via application-level synchronization (event-driven or on-demand)."* No such
synchronisation exists. There is no publisher, no listener, no sync service.

Until it does, provisioning a person into a second school has no way to create
their tenant-local profile row, which is the step the whole cross-school case
depends on.

### 3.3 `guardian` has no table and no meaning

The enum distinguishes `guardian` from `parent`; the schema does not. Both use
`parents`, and the actual relationship is already recorded in
`student_parents.relationship` (`'Father'`, `'Aunt'`, `'Guardian'`). Either
drop the type or state what it means beyond that column. §2.3 keeps it as a
classification over the `parent` capacity, which is the smaller change.

---

## 4. Missing infrastructure

### 4.1 No write paths anywhere

Every repository is `@Transactional(readOnly = true)` with only `findBy*`
methods. Nothing in the codebase creates or updates `users`, `user_profiles` or
`user_tenant_mapping`. So the rule that School B must reuse an existing parent
rather than create a second account is enforced only by `users.email UNIQUE` —
the database will reject the duplicate, and nothing turns that rejection into
"found this person, attach them to your school".

Needed: a lookup that answers *whether* an identifier is taken without
disclosing whose it is (School B must not learn School A's name, children, or
even how many), and a service that inserts a `user_tenant_mapping` row plus the
tenant-local profile.

### 4.2 No login endpoint

There are zero controllers in the repository — the only `@RestController*`
match is `GlobalExceptionHandler`. `TenantContextTokenService.generateToken(
userId, tenantIds, keyId)` is written and **has no caller**.

### 4.3 Keycloak is asserted, not wired

No `spring-boot-starter-security`, no `spring-boot-starter-oauth2-resource-server`,
no Keycloak adapter in `pom.xml`; no `issuer-uri` or `spring.security.*` in
`application.yml`. `TenantContextTokenFilter` is `@Order(2)` and its javadoc
says it runs "after Keycloak filter (order 1)" — there is no order-1 filter.

Whether Keycloak can accept a mobile number as a username is unresolved, and
§1.2 depends on it.

### 4.4 No audit trail

The frontend keeps an access log — who changed whose role, when, with undo.
`profile_roles.assigned_by` covers role assignment alone. There is no general
audit table for the rest.

---

## 5. Designed elsewhere, absent here

These have schemas on `feature/db-schema` and no counterpart in the MySQL
tenant schema, so the app's mocks for them have no target to be modelled on.

### 5.1 `academic-mgmt`
`academic_years`, `terms`, `grade_levels`, `class_sections`, `subjects`.

This one is load-bearing: the app scopes teachers on class-section *labels*
(`9A`) because there is no table to point at. §1.1 becomes an FK once this
lands, and `students.grade_level` / `students.section` become FKs too.

### 5.2 `time-table`
`time_slots`, `rooms`, `calendar_categories`, `calendar_events`, `timetable`,
`event_attendees`.

### 5.3 `communication`
`user_communication_preferences`.

### 5.4 No design at all
Attendance, grades and marks, fees and payments, expenses, transport, notices
and notifications. All exist as features with mock stores and have no schema on
any branch.

---

## Order I would do them in

1. §4.1 write paths and §3.2 profile sync — without these nothing can create a
   person, and every other item is theory.
2. §2.1–2.4 roles, `profile_roles`, `profile_types`, `staff`.
3. §1.1–1.4 the four blocking gaps.
4. §4.2 login and §4.3 Keycloak, which unblocks §1.2.
5. §5.1 `academic-mgmt`, then turn the labels in §1.1 into foreign keys.
