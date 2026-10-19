#!/usr/bin/env bash
# Shared helpers. Source it; don't run it.
#
# Every psql/flyway call runs against the "current target", selected with
# use_global or use_instance <name>. A target is one Postgres database:
# the Global DB, or one tenant DB instance.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FLYWAY_IMAGE="${FLYWAY_IMAGE:-flyway/flyway:11-alpine}"
NAME_RE='^[a-z][a-z0-9_]{0,62}$'
TENANT_RE='^tenant_[a-z0-9_]{1,55}$'

log()  { printf '\033[36m==>\033[0m %s\n' "$*" >&2; }
warn() { printf '\033[33m!!\033[0m %s\n' "$*" >&2; }
die()  { printf '\033[31mxx\033[0m %s\n' "$*" >&2; exit 1; }

valid_name() { [[ "$1" =~ $NAME_RE ]] || die "Invalid ${2:-name}: '$1'"; }
csv()        { printf '%s\n' "${1//,/$'\n'}" | sed 's/[[:space:]]//g' | grep -v '^$' || true; }
upper()      { printf '%s' "$1" | tr '[:lower:]' '[:upper:]'; }
need()       { [[ -n "${!1:-}" ]] || die "$1 is not set (see .env.example)"; }

# .env is a local convenience; CI/CD injects the same variables directly.
# Already-set variables win, so a stray .env can never override CI secrets.
load_env() {
  if [[ -f "$ROOT/.env" ]]; then
    local k v
    while IFS='=' read -r k v || [[ -n "$k" ]]; do
      [[ "$k" =~ ^[A-Z_][A-Z0-9_]*$ ]] || continue
      [[ -n "${!k+x}" ]] && continue
      v="${v%\"}"; v="${v#\"}"
      export "$k=$v"
    done < "$ROOT/.env"
  fi
  : "${DB_TARGET:=local}" "${DB_SSLMODE:=require}" "${LOCK_TIMEOUT:=5s}"
  : "${GLOBAL_DB_PORT:=5432}" "${GLOBAL_SCHEMA:=global}" "${TENANT_DB_PORT:=5432}"
  : "${POSTGRES_VERSION:=18}" "${TENANT_INSTANCES:=}"
  [[ "$DB_TARGET" == local || "$DB_TARGET" == remote ]] || die "DB_TARGET must be local|remote"
  local v2
  for v2 in GLOBAL_DB_HOST GLOBAL_DB_NAME GLOBAL_DB_MIGRATOR_USER GLOBAL_DB_MIGRATOR_PASSWORD GLOBAL_DB_APP_ROLE; do
    need "$v2"
  done
  valid_name "$GLOBAL_SCHEMA" "GLOBAL_SCHEMA"

  # Containers reach the DB over the compose network locally; over the default
  # bridge for remote hosts. Override with DOCKER_NETWORK=host for tunnels.
  local net="${DOCKER_NETWORK:-}"
  [[ -z "$net" && "$DB_TARGET" == local ]] && net="sanketa-db_default"
  NET_ARGS=(); [[ -n "$net" ]] && NET_ARGS=(--network "$net")
  return 0
}

compose() {
  if docker compose version >/dev/null 2>&1; then docker compose "$@"; else docker-compose "$@"; fi
}

tenant_instances() { csv "$TENANT_INSTANCES"; }

# ---- target selection -------------------------------------------------------
use_global() {
  T_LABEL="global"
  T_HOST="$GLOBAL_DB_HOST"; T_PORT="$GLOBAL_DB_PORT"; T_DB="$GLOBAL_DB_NAME"
  T_SSL="${GLOBAL_DB_SSLMODE:-$DB_SSLMODE}"
  T_USER="$GLOBAL_DB_MIGRATOR_USER"; T_PASS="$GLOBAL_DB_MIGRATOR_PASSWORD"
  T_APP_ROLE="$GLOBAL_DB_APP_ROLE"
}

# use_instance sanketa_db_2 -> reads SANKETA_DB_2_<SETTING>, falling back to TENANT_DB_<SETTING>
use_instance() {
  local name="$1" p; valid_name "$name" "instance name"
  tenant_instances | grep -qx "$name" || die "Unknown tenant instance '$name' (not in TENANT_INSTANCES)"
  p="$(upper "$name")"
  pick() { local a="${p}_$1" b="TENANT_DB_$1"; printf '%s' "${!a:-${!b:-${2:-}}}"; }
  T_LABEL="$name"
  T_HOST="$(pick HOST)"; T_PORT="$(pick PORT 5432)"; T_DB="$(pick NAME "$name")"
  T_SSL="$(pick SSLMODE "$DB_SSLMODE")"
  T_USER="$(pick MIGRATOR_USER)"; T_PASS="$(pick MIGRATOR_PASSWORD)"
  T_APP_ROLE="$(pick APP_ROLE)"
  local v
  for v in T_HOST T_USER T_PASS T_APP_ROLE; do
    [[ -n "${!v}" ]] || die "Instance '$name': set ${p}_${v#T_} or TENANT_DB_${v#T_}"
  done
  valid_name "$T_DB" "database name"
}

# ---- runners ----------------------------------------------------------------
# psql_q "<sql>" -> unaligned, tuples-only output, as the target's migrator.
psql_q() {
  docker run --rm -i ${NET_ARGS[@]+"${NET_ARGS[@]}"} -e PGPASSWORD="$T_PASS" \
    "postgres:${POSTGRES_VERSION}" \
    psql "host=$T_HOST port=$T_PORT dbname=$T_DB user=$T_USER sslmode=$T_SSL connect_timeout=5" \
    -XAtq -v ON_ERROR_STOP=1 -c "$1"
}

# run_flyway <global|tenant> <schema> <flyway command> [extra args...]
# SEED_RUN=1 targets seeds/<kind> with its own history table, so dev seed
# history never mixes with (or fails validation of) real migrations.
run_flyway() {
  local kind="$1" schema="$2"; shift 2
  valid_name "$schema" "schema name"
  local locations="filesystem:/flyway/sql/${kind},filesystem:/flyway/sql/callbacks"
  local table=flyway_schema_history extra=()
  if [[ "${SEED_RUN:-0}" == 1 ]]; then
    locations="filesystem:/flyway/seeds/${kind}"; table=flyway_seed_history
    extra=(-baselineOnMigrate=true -baselineVersion=0)
  fi

  # transactional.lock=false: Flyway's default transaction-scoped advisory lock
  # makes CREATE INDEX CONCURRENTLY wait on Flyway itself (hang / lock timeout).
  # Credentials go via env, never argv (argv is visible in `ps` and CI logs).
  docker run --rm ${NET_ARGS[@]+"${NET_ARGS[@]}"} \
    -v "$ROOT/migrations:/flyway/sql:ro" \
    -v "$ROOT/seeds:/flyway/seeds:ro" \
    -e FLYWAY_URL="jdbc:postgresql://${T_HOST}:${T_PORT}/${T_DB}?sslmode=${T_SSL}&ApplicationName=sanketa-db-migrator" \
    -e FLYWAY_USER="$T_USER" \
    -e FLYWAY_PASSWORD="$T_PASS" \
    "$FLYWAY_IMAGE" \
    -schemas="$schema" -defaultSchema="$schema" -createSchemas=true \
    -locations="$locations" \
    -table="$table" ${extra[@]+"${extra[@]}"} \
    -initSql="SET lock_timeout = '${LOCK_TIMEOUT}'" \
    -validateMigrationNaming=true -validateOnMigrate=true \
    -outOfOrder=false -mixed=false -cleanDisabled=true \
    -postgresql.transactional.lock=false \
    -placeholders.app_role="$T_APP_ROLE" \
    "$@"
}
