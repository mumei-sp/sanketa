## What & why
<!-- ticket, module, intent -->

## Checklist
- [ ] New `V<timestamp>__*.sql` only — no edits to merged migrations
- [ ] Scope is right: `global` (Global DB: identity, tenants, routing) or `tenant` (every school schema on every instance)
- [ ] No cross-database references (tenant → global by id only)
- [ ] Follows `docs/CONVENTIONS.md` (naming, identity + uuidv7, timestamptz, text)
- [ ] Every FK column has an explicit index (Postgres doesn't add one)
- [ ] Indexes on existing tables use `CONCURRENTLY` in their own non-transactional file
- [ ] New constraints on existing tables use `NOT VALID` + `VALIDATE`
- [ ] Destructive change uses expand → migrate → contract across releases
- [ ] Seeds (if any) are `R__` and idempotent
- [ ] `make reset && make check` passes locally

## Deploy notes
<!-- table sizes, expected lock time, ordering with app release -->
