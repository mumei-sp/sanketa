#!/usr/bin/env bash
# End-to-end test of every mise task against a throwaway copy of this repo,
# with its own Docker stack (profile e2e). Non-interactive (CI=1).
#
#   tests/e2e/run.sh            (or: mise run test:e2e)
#   E2E_DIR=<dir>   where the working copy + log go (default ~/.cache/sanketa-db-e2e).
#                   Must be under $HOME with Colima: it only bind-mounts $HOME.
#   E2E_KEEP=1      keep the copy and the Docker stack afterwards (debugging)
#   E2E_PORT=<n>    host port for the e2e Postgres (default 5460)
#
# Exit 0 if every step passed, 1 otherwise.
set -uo pipefail

SRC="$(cd "$(dirname "$0")/../.." && pwd)"
FIX="$SRC/tests/e2e/fixtures"
E2E_DIR="${E2E_DIR:-$HOME/.cache/sanketa-db-e2e}"
WORK="$E2E_DIR/repo"
LOG="$E2E_DIR/e2e.log"
PORT="${E2E_PORT:-5460}"
P=e2e                      # the profile under test
G=e2e,e2e_guard            # same stack, deny-by-default safety switches
M=e2e,e2e_multi            # + a third instance on a second Postgres server
CONTAINER="sanketa-postgres-$P"
SERVER2="sanketa-e2e-server2"
T0=$SECONDS

# Settings inherited from a parent `mise run` (dev profile) must not leak in.
unset MISE_ENV DB_PROFILE

# ---- helpers -------------------------------------------------------------------
STEP=""; STEP_ERR=""; STEP_T0=0; N_PASS=0; N_FAIL=0; FAILED_STEPS=()

finish_step() {
  [[ -n "$STEP" ]] || return 0
  local t=$((SECONDS - STEP_T0))
  if [[ -z "$STEP_ERR" ]]; then
    printf '\033[32mPASS\033[0m %-70s %3ss\n' "$STEP" "$t"; N_PASS=$((N_PASS + 1))
  else
    printf '\033[31mFAIL\033[0m %-70s %3ss\n     %s\n' "$STEP" "$t" "$STEP_ERR"
    printf '%s\n' "$OUT" | tail -15 | sed 's/^/     | /'
    N_FAIL=$((N_FAIL + 1)); FAILED_STEPS+=("$STEP")
  fi
  STEP=""
}
step() { finish_step; STEP="$1"; STEP_ERR=""; STEP_T0=$SECONDS; printf '\n### %s\n' "$1" >> "$LOG"; }
fail() { STEP_ERR+="$1; "; }

# run <cmd...> -> OUT (colour-stripped stdout+stderr), RC
OUT=""; RC=0
run() {
  OUT="$("$@" 2>&1)"; RC=$?
  OUT="$(printf '%s' "$OUT" | sed $'s/\033\\[[0-9;]*m//g')"
  printf '$ %s\n%s\n[exit %s]\n' "$*" "$OUT" "$RC" >> "$LOG"
}
# mrun <profiles> <task> [args...]: a mise task, non-interactive
mrun() { local p="$1"; shift; run env CI=1 mise -E "$p" run -q "$@"; }

expect_exit()      { [[ "$RC" == "$1" ]] || fail "exit $RC, want $1"; }
expect_fail()      { [[ "$RC" != 0 ]] || fail "exit 0, want non-zero"; }
expect_output()    { grep -qE -- "$1" <<<"$OUT" || fail "output lacks /$1/"; }
expect_no_output() { ! grep -qE -- "$1" <<<"$OUT" || fail "output has /$1/"; }
expect_eq()        { [[ "$2" == "$3" ]] || fail "$1: got '$2', want '$3'"; }

# sql <db> <query>: as the container superuser (test assertions and drift setup)
sql() { docker exec -i "$CONTAINER" psql -U postgres -d "$1" -XAtq -v ON_ERROR_STOP=1 -c "$2" 2>&1; }
# as_role <role> <password key in .secrets> <db> <query>: over the network, like the app
as_role() {
  local pw; pw="$(sed -n "s/^$2=//p" "$WORK/.secrets/$P.env")"
  run env PGPASSWORD="$pw" docker run --rm -i --network "sanketa-db-${P}_default" -e PGPASSWORD \
    "postgres:18" psql "host=postgres dbname=$3 user=$1 connect_timeout=5" -XAtq -v ON_ERROR_STOP=1 -c "$4"
}
sql2() { docker exec -i "$SERVER2" psql -U postgres -d "$1" -XAtq -v ON_ERROR_STOP=1 -c "$2" 2>&1; }
add_fixture() { cp -R "$FIX/$1/." "$WORK/"; }
gitc() { git -c user.name=e2e -c user.email=e2e@localhost -c commit.gpgsign=false "$@"; }

docker_cleanup() {
  docker rm -f "$SERVER2" "$CONTAINER" >/dev/null 2>&1
  docker network rm "sanketa-db-${P}_default" >/dev/null 2>&1
  docker volume rm "sanketa-db-${P}_pg-data" >/dev/null 2>&1
  return 0
}
on_exit() {
  finish_step
  if [[ "${E2E_KEEP:-0}" == 1 ]]; then
    echo "E2E_KEEP=1: kept $WORK and container $CONTAINER (port $PORT)"
  else
    docker_cleanup; rm -rf "$WORK"
  fi
}
trap on_exit EXIT
trap 'exit 130' INT TERM

# ---- setup: fresh copy, git baseline, profiles ---------------------------------
mkdir -p "$E2E_DIR"; : > "$LOG"
echo "sanketa-db e2e: copy $WORK, port $PORT, log $LOG"
docker_cleanup; rm -rf "$WORK"

step "setup: working copy, git baseline, e2e profiles"
run rsync -a --exclude .git --exclude .secrets --exclude snapshots/.backups \
  --exclude mise.local.toml --exclude 'mise.*.local.toml' "$SRC/" "$WORK/"
expect_exit 0
cd "$WORK" || exit 1
add_fixture base

# Based on mise.ci.toml: own stack, port and tenant names.
cat > mise.e2e.toml <<EOF
# Profile: e2e (tests/e2e/run.sh). Throwaway local Docker, no prompts.
[env]
DB_PROFILE = "e2e"
DB_TARGET = "local"
DB_SSLMODE = "disable"
LOCAL_PORT = "$PORT"

GLOBAL_DB_HOST = "postgres"
TENANT_DB_HOST = "postgres"
TENANT_INSTANCES = "sanketa_db_1,sanketa_db_2"
SANKETA_DB_1_TENANTS = "tenant_e2e_a"
SANKETA_DB_2_TENANTS = "tenant_e2e_b"

ALLOW_SEEDS = "true"
ALLOW_RESET = "true"
REQUIRE_CONFIRM = "false"
EOF
# Layered on top of e2e (mise -E e2e,e2e_guard): same stack, safety switches like a remote env.
cat > mise.e2e_guard.toml <<'EOF'
[env]
ALLOW_SEEDS = "false"
ALLOW_RESET = "false"
REQUIRE_CONFIRM = "true"
BACKUP_BEFORE_MIGRATE = "true"
EOF

# Layered on e2e: a third instance living on a separate Postgres server, with its
# own migrator login (per-instance overrides; password in .secrets/e2e.env).
cat > mise.e2e_multi.toml <<EOF
[env]
TENANT_INSTANCES = "sanketa_db_1,sanketa_db_2,sanketa_db_3"
SANKETA_DB_3_HOST = "$SERVER2"
SANKETA_DB_3_MIGRATOR_USER = "sanketa_db_3_migrator"
SANKETA_DB_3_TENANTS = "tenant_e2e_srv2"
EOF

run sh -c 'git init -q && git checkout -q -b db/schema && git add -A'
expect_exit 0
run gitc commit -q --no-verify -m "e2e baseline"
expect_exit 0
run git update-ref refs/remotes/origin/db/schema HEAD
expect_exit 0
run sh -c 'mise trust -q && mise install -q'
expect_exit 0

# ---- 1. bring-up ----------------------------------------------------------------
step "dev:doctor: toolchain and profile ready"
mrun $P dev:doctor
expect_exit 0; expect_output "All good"; expect_output "port $PORT free"

step "dev:start from nothing (migrate + seed)"
mrun $P dev:start
expect_exit 0
expect_output "Postgres is up: localhost:$PORT"
expect_output "global +sanketa_global +global +applied 1"
expect_output "tenant_e2e_a +applied 1 \(\+seeds\)"
expect_output "tenant_e2e_b +applied 1 \(\+seeds\)"
expect_eq "seeded students" "$(sql sanketa_db_1 'SELECT count(*) FROM tenant_e2e_a.students')" 1
[[ -f .secrets/$P.env ]] || fail "secrets file not created in the copy"

step "dev:status: running, versions shown"
mrun $P dev:status
expect_exit 0; expect_output "$CONTAINER\): Up"
expect_output "tenant_e2e_b +20260101000100 .* up to date"

step "tenant:list: both tenants up to date"
mrun $P tenant:list
expect_exit 0
expect_output "global +sanketa_global +global +20260101000000 .* up to date"
expect_output "sanketa_db_1 +tenant_e2e_a .* up to date"
expect_output "sanketa_db_2 +tenant_e2e_b .* up to date"
expect_output "2 tenant\(s\) across 2 instance\(s\), 0 behind"

step "db:check: nothing pending (exit 0)"
mrun $P db:check
expect_exit 0; expect_no_output "pending:"

step "db:sync again: no-op"
mrun $P db:sync
expect_exit 0; expect_no_output "applied"
expect_output "tenant_e2e_a +up to date"

step "deploy:config: resolved, passwords masked"
mrun $P deploy:config
expect_exit 0
expect_output "GLOBAL_DB_MIGRATOR_PASSWORD +\*\*\*\* \(set\)"
expect_output "SANKETA_DB_2_TENANTS +tenant_e2e_b"
expect_output "Config for profile 'e2e' is complete"
expect_no_output "local_only"

# ---- 2. authoring ---------------------------------------------------------------
step "db:new with args creates the file (+ .conf for --concurrent-index)"
mrun $P db:new tenant "e2e probe"
expect_exit 0
f="$(printf '%s\n' "$OUT" | grep -E '^migrations/tenant/V[0-9]{14}__e2e_probe\.sql$' | tail -1)"
if [[ -n "$f" && -f "$f" ]]; then grep -q 'tenant :: e2e probe' "$f" || fail "template not filled in $f"; rm -f "$f"
else fail "no new file reported"; fi
mrun $P db:new global "e2e probe index" --concurrent-index
expect_exit 0
f="$(printf '%s\n' "$OUT" | grep -E '^migrations/global/V[0-9]{14}__e2e_probe_index\.sql$' | tail -1)"
if [[ -n "$f" && -f "$f.conf" ]]; then grep -qx 'executeInTransaction=false' "$f.conf" || fail ".conf content"; rm -f "$f" "$f.conf"
else fail "no file + .conf"; fi

step "db:new without args under CI: clean error"
mrun $P db:new
expect_exit 1; expect_output "pass it as an argument"
[[ -z "$(ls migrations/*/V*e2e_probe* 2>/dev/null)" ]] || fail "a file was created"

# ---- 3. a new migration: plan, apply, verify ----------------------------------
add_fixture next

step "db:check with new migrations: exit 3, lists them"
mrun $P db:check
expect_exit 3
expect_output "pending: 20260102000000 add students roll no"
expect_output "pending: 20260102000100 index students roll no"
expect_output "4 pending migration"

step "deploy:plan: exit 0, reports pending"
mrun $P deploy:plan
expect_exit 0; expect_output "4 pending"

step "tenant:list: tenants behind"
mrun $P tenant:list
expect_exit 0
expect_output "tenant_e2e_a +20260101000100 .* 20260102000100 +behind"
expect_output "2 behind"

step "db:sync applies (incl. CONCURRENTLY index)"
mrun $P db:sync
expect_exit 0
expect_output "tenant_e2e_a +applied 2"; expect_output "tenant_e2e_b +applied 2"
expect_eq "roll_no index valid" "$(sql sanketa_db_2 "SELECT i.indisvalid FROM pg_index i JOIN pg_class c ON c.oid = i.indexrelid JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'tenant_e2e_b' AND c.relname = 'ix_students__roll_no'")" t

step "db:diff: all tenants identical"
mrun $P db:diff
expect_exit 0; expect_output "All 2 tenant schemas identical"

step "db:dump: deterministic (twice -> identical), db:diff --against"
mrun $P db:dump
expect_exit 0
cp snapshots/$P/global.sql "$E2E_DIR/global.1.sql" 2>/dev/null; cp snapshots/$P/tenant.sql "$E2E_DIR/tenant.1.sql" 2>/dev/null
mrun $P db:dump
expect_exit 0
cmp -s "$E2E_DIR/global.1.sql" snapshots/$P/global.sql || fail "global.sql differs between dumps"
cmp -s "$E2E_DIR/tenant.1.sql" snapshots/$P/tenant.sql || fail "tenant.sql differs between dumps"
grep -q '__TENANT__.students' snapshots/$P/tenant.sql || fail "tenant.sql not normalised to __TENANT__"
! grep -q 'tenant_e2e_' snapshots/$P/tenant.sql || fail "tenant.sql still names a real tenant"
grep -q 'CREATE TABLE global.schools' snapshots/$P/global.sql || fail "global.sql lacks schools"
rm -f "$E2E_DIR"/global.1.sql "$E2E_DIR"/tenant.1.sql
mrun $P db:diff --against $P
expect_exit 0; expect_output "tenant: matches snapshots/e2e/tenant.sql"

step "manual drift on one tenant: db:diff exit 1, then revert"
sql sanketa_db_2 'ALTER TABLE tenant_e2e_b.students ADD COLUMN drift_col INTEGER' >/dev/null || fail "could not create drift"
mrun $P db:diff
expect_exit 1; expect_output "1 of 2 tenant schemas drift"; expect_output "\+ +drift_col integer"
sql sanketa_db_2 'ALTER TABLE tenant_e2e_b.students DROP COLUMN drift_col' >/dev/null || fail "could not revert drift"
mrun $P db:diff
expect_exit 0; expect_output "All 2 tenant schemas identical"

# ---- 4. tenants, seeds, isolation ---------------------------------------------
step "tenant:add new school on instance 2"
mrun $P tenant:add school_e2e_c --instance sanketa_db_2
expect_exit 0; expect_output "tenant_school_e2e_c is ready on sanketa_db_2"
mrun $P tenant:list
expect_output "sanketa_db_2 +tenant_school_e2e_c +20260102000100 .* up to date"
expect_output "3 tenant\(s\) across 2 instance\(s\), 0 behind"

step "tenant:add same school on instance 1: refused"
mrun $P tenant:add school_e2e_c --instance sanketa_db_1
expect_exit 1; expect_output "already exists on instance 'sanketa_db_2'"
expect_eq "schema on instance 1" "$(sql sanketa_db_1 "SELECT count(*) FROM pg_namespace WHERE nspname = 'tenant_school_e2e_c'")" 0

step "tenant:add under CI without name / instance: clean error"
mrun $P tenant:add
expect_exit 1; expect_output "Tenant name .*: pass it as an argument"
mrun $P tenant:add school_e2e_d
expect_exit 1; expect_output "Which tenant instance\?: pass it as an argument"

step "data:seed: seeds every tenant, incl. the new one"
mrun $P data:seed
expect_exit 0; expect_output "tenant_school_e2e_c +up to date \(\+seeds\)"
expect_eq "seeded students in new tenant" "$(sql sanketa_db_2 'SELECT count(*) FROM tenant_school_e2e_c.students')" 1

step "app roles: isolated per database, DML only"
as_role sanketa_tenant_app TENANT_DB_APP_PASSWORD sanketa_global "SELECT 1"
expect_fail; expect_output "permission denied for database"
as_role sanketa_global_app GLOBAL_DB_APP_PASSWORD sanketa_db_1 "SELECT 1"
expect_fail; expect_output "permission denied for database"
as_role sanketa_tenant_app TENANT_DB_APP_PASSWORD sanketa_db_1 "SELECT count(*) FROM tenant_e2e_a.students"
expect_exit 0; expect_output "^1$"
as_role sanketa_tenant_app TENANT_DB_APP_PASSWORD sanketa_db_1 "CREATE TABLE tenant_e2e_a.app_ddl (i INTEGER)"
expect_fail; expect_output "permission denied for schema"
as_role sanketa_global_app GLOBAL_DB_APP_PASSWORD sanketa_global "CREATE TABLE global.app_ddl (i INTEGER)"
expect_fail; expect_output "permission denied for schema"

step "dev:psql with piped SQL (database as argument)"
run sh -c "echo 'SELECT count(*) FROM tenant_e2e_a.students;' | CI=1 mise -E $P run -q dev:psql sanketa_db_1"
expect_exit 0; expect_output "^ *1$"

# ---- 5. static checks -----------------------------------------------------------
# ---- second tenant DB server -------------------------------------------------------
step "second server: own container, superuser, migrator login and database"
run docker run -d --name "$SERVER2" --network "sanketa-db-${P}_default" \
  -e POSTGRES_PASSWORD=server2_local_only "postgres:18"
expect_exit 0
for _ in $(seq 1 30); do docker exec "$SERVER2" pg_isready -q -U postgres -h 127.0.0.1 && break; sleep 1; done
# What infra would provision on a new server (docker/postgres/bootstrap.sh equivalent).
run docker exec -i "$SERVER2" psql -U postgres -XAtq -v ON_ERROR_STOP=1 -c "
  CREATE ROLE sanketa_db_3_migrator LOGIN PASSWORD 'srv2_migrator_local_only';
  CREATE ROLE sanketa_tenant_app LOGIN PASSWORD 'srv2_app_local_only';"
expect_exit 0
run docker exec -i "$SERVER2" psql -U postgres -XAtq -v ON_ERROR_STOP=1 -c "CREATE DATABASE sanketa_db_3"
expect_exit 0
run docker exec -i "$SERVER2" psql -U postgres -XAtq -v ON_ERROR_STOP=1 -c "
  REVOKE ALL ON DATABASE sanketa_db_3 FROM PUBLIC;
  GRANT CONNECT, CREATE ON DATABASE sanketa_db_3 TO sanketa_db_3_migrator;
  GRANT CONNECT, TEMPORARY ON DATABASE sanketa_db_3 TO sanketa_tenant_app;"
expect_exit 0
expect_eq "public schema locked" "$(sql2 sanketa_db_3 'REVOKE ALL ON SCHEMA public FROM PUBLIC')" ""
echo "SANKETA_DB_3_MIGRATOR_PASSWORD=srv2_migrator_local_only" >> ".secrets/$P.env"

step "db:sync across two servers: new schema lands on server 2 only"
mrun $M db:sync
expect_exit 0
expect_output "sanketa_db_1 +tenant_e2e_a +up to date"
expect_output "sanketa_db_3 +tenant_e2e_srv2 +applied [0-9]+"
expect_output "connecting to $SERVER2:5432/sanketa_db_3 as sanketa_db_3_migrator"
expect_eq "schema on server 2" "$(sql2 sanketa_db_3 "SELECT count(*) FROM pg_namespace WHERE nspname = 'tenant_e2e_srv2'")" 1
expect_eq "sanketa_db_3 on server 1" "$(sql postgres "SELECT count(*) FROM pg_database WHERE datname = 'sanketa_db_3'")" 0
expect_eq "app grants on server 2" "$(sql2 sanketa_db_3 "SELECT has_table_privilege('sanketa_tenant_app', 'tenant_e2e_srv2.students', 'INSERT')")" t

step "tenant:list, db:check, db:diff span both servers"
mrun $M tenant:list
expect_exit 0
expect_output "sanketa_db_3 +tenant_e2e_srv2 .* up to date"
expect_output "4 tenant\(s\) across 3 instance\(s\), 0 behind"
mrun $M db:check
expect_exit 0
mrun $M db:diff
expect_exit 0; expect_output "All 4 tenant schemas identical"

step "tenant:add onto server 2; same school on server 1 refused"
mrun $M tenant:add srv2_school --instance sanketa_db_3
expect_exit 0
expect_eq "new school on server 2" "$(sql2 sanketa_db_3 "SELECT count(*) FROM pg_namespace WHERE nspname = 'tenant_srv2_school'")" 1
mrun $M tenant:add srv2_school --instance sanketa_db_1
expect_fail; expect_output "already exists on instance 'sanketa_db_3'"

step "wrong password for server 2 only: server 1 done, clear auth error"
run env CI=1 SANKETA_DB_3_MIGRATOR_PASSWORD=wrong mise -E $M run -q db:sync
expect_exit 1
expect_output "sanketa_db_2 +tenant_e2e_b +up to date"
expect_output "\[sanketa_db_3\] cannot connect: password authentication failed for user \"sanketa_db_3_migrator\""
# Detach server 2 so a later compose down (dev:reset) can remove the network.
run docker rm -f "$SERVER2"
expect_exit 0

step "check:safety flags the unsafe migration"
add_fixture unsafe
mrun $P check:safety
expect_exit 1
expect_output "ERROR not-null-no-default .*V20260103000000__students_require_email.sql"
rm -f migrations/tenant/V20260103000000__students_require_email.sql

step "check:safety passes on the safe migrations"
mrun $P check:safety
expect_exit 0
expect_output "check-safety: 2 file\(s\), 0 error\(s\)"

step "check:immutable: edited merged migration fails, revert passes"
mrun $P check:immutable
expect_exit 0; expect_output "OK: no merged migration was modified"
merged=migrations/tenant/V20260101000100__create_classes_and_students.sql
echo "-- edited after merge" >> "$merged"
mrun $P check:immutable
expect_exit 1; expect_output "M\s+$merged"
gitc commit -q --no-verify -am "edit merged migration" >/dev/null
mrun $P check:immutable
expect_exit 1; expect_output "M\s+$merged"
git reset -q --hard HEAD~1
mrun $P check:immutable
expect_exit 0; expect_output "OK: no merged migration was modified"

step "check:lint"
mrun $P check:lint
expect_exit 0

step "check:all"
mrun $P check:all
expect_exit 0
expect_output "✓ check:lint"; expect_output "✓ check:safety"
expect_output "✓ check:immutable"; expect_output "✓ safety tests"

# ---- 6. failure and recovery ----------------------------------------------------
step "broken migration: db:sync exit 1, rolled back, fail-fast"
add_fixture broken
mrun $P db:sync
expect_exit 1
expect_output "tenant_e2e_a: migration failed"
expect_output "run db:repair sanketa_db_1:tenant_e2e_a"
expect_no_output "\[sanketa_db_2\] connecting"
for db in sanketa_db_1 sanketa_db_2; do
  expect_eq "broken_partial in $db" "$(sql $db "SELECT count(*) FROM pg_tables WHERE tablename = 'broken_partial'")" 0
done
expect_eq "failed history rows" "$(sql sanketa_db_1 'SELECT count(*) FROM tenant_e2e_a.flyway_schema_history WHERE NOT success')" 0

step "recover: remove it, db:repair, re-sync"
rm -f migrations/tenant/V20260104000000__broken.sql
mrun $P db:repair sanketa_db_1:tenant_e2e_a
expect_exit 0; expect_output "Successfully repaired schema history"
mrun $P db:sync
expect_exit 0
mrun $P tenant:list
expect_no_output "failed"; expect_output "3 tenant\(s\) across 2 instance\(s\), 0 behind"

# ---- 7. guarded deploy ------------------------------------------------------------
add_fixture deploy

step "deploy:apply with REQUIRE_CONFIRM, no --yes: refused, nothing applied"
mrun $G deploy:apply
expect_exit 1; expect_output "re-run with --yes"
mrun $P db:check
expect_exit 3; expect_output "3 pending migration"

step "deploy:apply --yes: snapshot, apply, verify"
mrun $G deploy:apply --yes
expect_exit 0
expect_output "Deployed 3 migration\(s\) to profile e2e \(local\). Verified in sync"
ls snapshots/.backups/e2e-*/tenant.sql >/dev/null 2>&1 || fail "no pre-deploy snapshot"
expect_eq "guardians in new tenant" "$(sql sanketa_db_2 "SELECT to_regclass('tenant_school_e2e_c.guardians') IS NOT NULL")" t

step "deploy:apply again: nothing to do"
mrun $G deploy:apply
expect_exit 0; expect_output "Nothing to do"

# ---- 8. profile guards, reset, stop ------------------------------------------------
step "dev:reset refused on ALLOW_RESET=false profile"
mrun $G dev:reset --yes
expect_exit 1; expect_output "Resetting the database is disabled for profile 'e2e' \(ALLOW_RESET=false\)"

step "data:seed refused on ALLOW_SEEDS=false profile"
mrun $G data:seed
expect_exit 1; expect_output "Seeding is disabled for profile 'e2e' \(ALLOW_SEEDS=false\)"

step "dev:reset under CI without --yes: refused, data kept"
mrun $P dev:reset
expect_exit 1; expect_output "re-run with --yes"
expect_eq "tenant kept" "$(sql sanketa_db_2 "SELECT count(*) FROM pg_namespace WHERE nspname = 'tenant_school_e2e_c'")" 1

step "dev:reset --yes: wiped and rebuilt"
mrun $P dev:reset --yes
expect_exit 0
expect_output "tenant_e2e_a +applied 4 \(\+seeds\)"
expect_eq "added tenant gone" "$(sql sanketa_db_2 "SELECT count(*) FROM pg_namespace WHERE nspname = 'tenant_school_e2e_c'")" 0
mrun $P tenant:list
expect_output "2 tenant\(s\) across 2 instance\(s\), 0 behind"

step "dev:stop, then dev:status says stopped"
mrun $P dev:stop
expect_exit 0
mrun $P dev:status
expect_exit 0; expect_output "$CONTAINER\): stopped"
[[ -z "$(docker ps -q --filter "name=^/${CONTAINER}$")" ]] || fail "container still running"

step "script run outside mise: clear error"
run env -u DB_PROFILE -u MISE_ENV bash scripts/db-sync.sh
expect_exit 1; expect_output "Run through mise"

# ---- summary ------------------------------------------------------------------------
finish_step
echo
printf '%d passed, %d failed in %ss (log: %s)\n' "$N_PASS" "$N_FAIL" "$((SECONDS - T0))" "$LOG"
for s in ${FAILED_STEPS[@]+"${FAILED_STEPS[@]}"}; do echo "  failed: $s"; done
[[ $N_FAIL == 0 ]]
