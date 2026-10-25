# Schema conventions (PostgreSQL 18)

Defaults for every table. Deviate only with a reason in the migration header.

## Database

- PostgreSQL **18**, encoding UTF8, `builtin` locale provider with `C.UTF-8`. Sort order is byte order, and it never changes under OS upgrades (glibc collation drift silently corrupts indexes). Use an ICU collation per column/query when language-aware sorting is needed for display.
- Server time zone `UTC`. Prod must match `docker-compose.yml`.
- Two kinds of database (see README → Architecture): the **Global DB** `sanketa_global` (schema `global`) and **tenant instances** `sanketa_db_N` (one schema per school, `tenant_<code>`).
- Nothing lives in `public`. Flyway sets `search_path` to the schema being migrated, so **never schema-qualify** in migrations (use `${flyway:defaultSchema}` if you must). The same tenant file runs on hundreds of schemas.

## Naming

| Thing            | Rule                                    | Example                          |
|------------------|-----------------------------------------|----------------------------------|
| table            | `snake_case`, plural                    | `students`, `class_sections`     |
| join table       | both sides, alphabetical                | `guardians_students`             |
| column           | `snake_case`, singular                  | `admission_no`                   |
| FK column        | `<referenced_singular>_id`              | `student_id`                     |
| boolean          | `is_` / `has_` prefix                   | `is_active`                      |
| primary key      | `pk_<table>`                            | `pk_students`                    |
| foreign key      | `fk_<table>__<ref_table>`               | `fk_students__class_sections`    |
| unique           | `uq_<table>__<cols>`                    | `uq_students__admission_no`      |
| index            | `ix_<table>__<cols>`                    | `ix_students__last_name`         |
| check            | `ck_<table>__<rule>`                    | `ck_fees__amount_positive`       |
| trigger          | `tg_<table>__<purpose>`                 | `tg_students__updated_at`        |

Identifiers are lower-case and never quoted. Max 63 chars.

## Keys

- **One ID per table:** `id UUID NOT NULL DEFAULT uuidv7()`, primary key, used everywhere: joins, foreign keys, APIs, URLs and references from other databases. No second "public" ID, no `SERIAL` / identity numbers.
  - UUIDv7 is time-ordered, so it indexes well, and unguessable, so it's safe to expose. `uuidv7()` is built into PG 18; the app may also generate one before inserting (e.g. offline sync).
  - Measured on 2M rows vs `bigint`: keys/indexes ~20–30% larger, big joins ~5% slower, everyday joins no difference. Accepted for one ID that can't leak and never clashes across databases.
  - Humans (support, logs) use readable identifiers such as `users.login_id`, not UUIDs.
- **Primary and foreign keys are declared inline on their column**, always named (`CONSTRAINT pk_<table> PRIMARY KEY`, `CONSTRAINT fk_<table>__<ref> REFERENCES …`). Checks and multi-column rules go at the bottom of the table.
- **Postgres does not index FK columns automatically.** Every FK gets an explicit index unless it's the leading column of another index.
- FK actions default to `ON DELETE RESTRICT`. Use `CASCADE` only for true ownership (e.g. invoice line items) and say so in the header.
- **No cross-database or cross-schema references.** The Global DB and tenant instances are separate databases (often separate servers), so there are no FKs, joins or views across them. Tenant tables reference global rows by id only (e.g. `global_user_id`), and `fabric` enforces integrity.
- Never reference another school's schema from a tenant migration.

## Standard columns

```sql
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by  UUID,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),   -- set by the app (JPA @PreUpdate)
    updated_by  UUID,
    deleted_at  TIMESTAMPTZ,                          -- soft delete; omit on log tables
    version     INTEGER     NOT NULL DEFAULT 0        -- JPA @Version
```

Uniques that should ignore soft-deleted rows are **partial** indexes:
`CREATE UNIQUE INDEX uq_students__admission_no ON students (admission_no) WHERE deleted_at IS NULL;`

## Types

| Data            | Use                                          | Not                              |
|-----------------|----------------------------------------------|----------------------------------|
| instants        | `TIMESTAMPTZ`                                | `TIMESTAMP` (no zone)            |
| calendar dates  | `DATE`                                       | `TIMESTAMPTZ`                    |
| text            | `TEXT` + `CHECK (char_length(x) <= n)` when a limit matters | `VARCHAR(n)` (resizing it is painful) / `CHAR(n)` |
| money           | `NUMERIC(19,4)` + `currency CHAR(3)`         | `MONEY`, `REAL`/`DOUBLE`         |
| marks / scores  | `NUMERIC(6,2)`                               | floats                           |
| fixed value sets| `TEXT` + `CHECK (x IN (...))` or lookup table| Postgres `ENUM` (values can't be removed) |
| email           | `TEXT`; unique on `lower(email)`             | `citext` (needs an extension; non-deterministic) |
| phone           | `TEXT`, E.164                                | numeric types                    |
| flexible attrs  | `JSONB`, only when not queried/joined        | `JSON`                           |
| flags           | `BOOLEAN NOT NULL DEFAULT false`             | `SMALLINT`                       |

Every column is `NOT NULL` unless null means something. Add `COMMENT ON` for anything whose meaning isn't obvious.

## Table template

```sql
CREATE TABLE students (
    id UUID NOT NULL DEFAULT uuidv7() CONSTRAINT pk_students PRIMARY KEY,
    class_section_id UUID NOT NULL CONSTRAINT fk_students__class_sections REFERENCES class_sections (id),
    admission_no TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID,
    deleted_at TIMESTAMPTZ,
    version INTEGER NOT NULL DEFAULT 0,
    -- Checks and multi-column rules at the bottom; keys inline on their column.
    CONSTRAINT ck_students__admission_no_length CHECK (char_length(admission_no) BETWEEN 1 AND 32)
);
CREATE INDEX ix_students__class_section_id ON students (class_section_id);
CREATE UNIQUE INDEX uq_students__admission_no ON students (admission_no) WHERE deleted_at IS NULL;
COMMENT ON TABLE students IS 'Student enrolled in this school';
```

## Migrations

- **Before the first release** each scope is one baseline file (`V1__global_baseline.sql`, `V1__tenant_baseline.sql`), edited in place. After the release tag (`db-release-N`) it is frozen and changes are new files.

- Postgres DDL is **transactional**: each file commits or rolls back as a whole. Group a feature's DDL in one file.
- Index on an existing, populated table → `CREATE INDEX CONCURRENTLY`, alone in its own file, with a sibling `.sql.conf` containing `executeInTransaction=false`. Precede it with `DROP INDEX CONCURRENTLY IF EXISTS` so a retry after failure is clean.
- Views, functions → `R__<name>.sql` using `CREATE OR REPLACE`. They're re-applied whenever their checksum changes.
- Large backfills run as batched jobs, not inside a migration.

## Changing existing tables

The schema must work with both the old and the new app version at the same time.

| Change                       | Safe way                                                              |
|------------------------------|-----------------------------------------------------------------------|
| add column                   | nullable, or with a constant `DEFAULT`; both are instant              |
| add `NOT NULL`               | `ADD CONSTRAINT … CHECK (c IS NOT NULL) NOT VALID` → next migration `VALIDATE CONSTRAINT` → `SET NOT NULL` |
| add FK                       | `… NOT VALID`, then `VALIDATE CONSTRAINT` in a later migration         |
| add index                    | `CONCURRENTLY` (see above)                                            |
| rename / retype / drop column| expand → migrate → contract across releases; never in place           |
| change column type           | new column + backfill + switch reads + drop old                       |

`lock_timeout` is set for every migration session (default `5s`). If a migration fails with *canceling statement due to lock timeout*, something held a conflicting lock, so retry off-peak. Don't raise the timeout to get around it.
