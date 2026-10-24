# ADR-0001: Flyway, PostgreSQL 18, Global DB + tenant instances (schema per school)

- Status: Accepted
- Date: 2026-10-19

## Context
Sanketa is multi-tenant, one tenant per school. The `fabric` service already routes requests using a separate **Global DB** (`sanketa_global`: identity, tenants, `database_instances`, `tenant_database_mapping`) and many **tenant DB instances** (`sanketa_db_1`, …), each hosting several schools as separate schemas. Earlier schema SQL was hand-run MySQL `schema.sql` files with no history, ordering, or per-tenant version tracking. The platform is moving to PostgreSQL.

## Decision
- **PostgreSQL 18.** Global DB = database `sanketa_global`, schema `global`. Tenant instance = its own database (`sanketa_db_N`, possibly on its own server) with **one schema per school** (`tenant_<code>`).
- **Flyway** (Community, run in Docker) owns all DDL, with one `flyway_schema_history` per schema. `migrations/global` targets the Global DB; `migrations/tenant` runs identically on every tenant schema of every instance.
- One idempotent migrator, `scripts/db-sync.sh`, is used identically by developers, CI and CD (via mise tasks, see ADR-0002): global first, then each instance, fail-fast.
- Separate roles per kind of database: global/tenant migrators (DDL) and global/tenant app roles (DML only, no access to the other kind). Migrator credentials can differ per instance.
- Instances are listed in config (`TENANT_INSTANCES`) for now.
- Delivery: GitHub Actions. CI runs every check and the end-to-end suite on each push/PR; `db-cd` is manual until remote environments exist, gated by GitHub environment reviewers.

## Consequences
- Transactional DDL: a failed migration leaves no partial state (except explicit `executeInTransaction=false` files).
- Onboarding a school = `mise run tenant:add <code> --instance <instance>`, plus the routing rows in the Global DB.
- Adding an instance = provision the database + roles, then add it to `TENANT_INSTANCES` with its host/credentials. No code change.
- No cross-database integrity: tenant → global references are ids, enforced by `fabric`.
- Postgres needs a database name per instance; the Postgres version of `database_instances` must add `database_name`.
- Follow-up: once the routing tables exist here, `db-sync.sh` should read instances and tenant schemas from the Global DB instead of config plus schema scanning (TODO in the script).
- A fleet migration is sequential; past a few hundred schools, add per-instance parallelism.
- `fabric` must switch to the PostgreSQL driver, connect as the app roles, and use `ddl-auto=validate`.
