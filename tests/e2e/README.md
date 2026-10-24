# End-to-end tests

`tests/e2e/run.sh` exercises every mise task the way a developer and CI use them: it copies this repo (no `.git`, `.secrets`) to a throwaway working copy, commits a git baseline (`origin/db/schema` points at it), writes its own profiles (`mise.e2e.toml`, plus the `e2e_guard` overlay with seeds/reset off and confirmation on) and runs everything non-interactively (`CI=1`) against its own Docker stack (`sanketa-postgres-e2e`, port 5460).
Fixture migrations in `fixtures/` are added step by step: bring-up, plan/apply, drift, dump, tenants, seeds, app-role isolation, the static checks, a broken migration and its recovery, a guarded `deploy:apply`, reset and stop. Each step prints PASS/FAIL; the exit code is 1 if any step failed.

```bash
mise run test:e2e            # or tests/e2e/run.sh; ~4 minutes, needs Docker
mise run test:e2e --keep     # keep the working copy and containers for debugging
```

- `E2E_DIR` (default `~/.cache/sanketa-db-e2e`): working copy (`repo/`) and full command log (`e2e.log`). With Colima it must be under `$HOME` (other paths mount empty).
- `E2E_KEEP=1`: same as `--keep`. Otherwise the copy and the e2e containers, network and volume are removed on exit. `E2E_PORT` changes the host port.

It also runs a second Postgres container as a separate tenant DB server (`sanketa_db_3`, own migrator login) to prove one run migrates across servers.
