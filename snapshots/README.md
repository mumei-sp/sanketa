# Schema snapshots

`<profile>/global.sql` and `<profile>/tenant.sql` are schema-only, normalised `pg_dump`s of the Global DB and of one tenant schema (named `__TENANT__`, since every tenant must be identical).
Regenerate with `mise run db:dump` (or `mise -E <profile> run db:dump`) after `db:sync`, and commit them with the migration, so a schema change shows up as a readable diff in review.
`mise run db:diff --against <profile>` checks a live database against them; `mise run db:diff` checks that all tenant schemas are identical.
