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

# ---- output style -----------------------------------------------------------
# Colour and symbols only on a real terminal; piped / CI / NO_COLOR output stays
# plain text so logs and tests can grep it. One accent (cyan) for actions,
# green/yellow/red only for status, dim for context.
if [[ -t 2 && -z "${NO_COLOR:-}" && "${TERM:-}" != dumb ]]; then
  UI_TTY=1 C_R=$'\e[0m' C_B=$'\e[1m' C_DIM=$'\e[2m' C_ACC=$'\e[36m' C_OK=$'\e[32m' C_WARN=$'\e[33m' C_ERR=$'\e[31m'
else
  UI_TTY=0 C_R='' C_B='' C_DIM='' C_ACC='' C_OK='' C_WARN='' C_ERR=''
fi
case "${LC_ALL:-${LC_CTYPE:-${LANG:-}}}" in
  *UTF-8*|*utf8*) S_STEP='●' S_OK='✓' S_ERR='✗' S_HINT='⎿' ;;
  *)              S_STEP='*' S_OK='+' S_ERR='x' S_HINT='->' ;;
esac

log()  { printf '%s %s\n' "${C_ACC}${S_STEP}${C_R}" "$*" >&2; }
ok()   { printf '  %s %s\n' "${C_OK}${S_OK}${C_R}" "$*" >&2; }
warn() { printf '%s %s\n' "${C_WARN}!${C_R}" "$*" >&2; }
detail() { printf '  %s\n' "${C_DIM}$*${C_R}" >&2; }
hint() { printf '  %s\n' "${C_DIM}${S_HINT} $*${C_R}" >&2; }
die()  { spin_stop; printf '%s %s\n' "${C_ERR}${S_ERR}${C_R}" "${C_B}$*${C_R}" >&2; exit 1; }

# Colour a status word (last table column) by meaning.
paint() {
  case "$1" in
    "up to date"*)                       printf '%s' "${C_OK}$1${C_R}" ;;
    applied*|pending*|*pending|behind|ahead|"not migrated") printf '%s' "${C_WARN}$1${C_R}" ;;
    failed|unreachable|"no access")      printf '%s' "${C_ERR}$1${C_R}" ;;
    *)                                   printf '%s' "$1" ;;
  esac
}

# Spinner for slow steps (Flyway, pg_dump); terminal only, never in CI.
SPIN_PID=""
spin_start() {
  [[ $UI_TTY == 1 && -z "${CI:-}" ]] || return 0
  ( trap 'exit 0' TERM; f='|/-\'; [[ $S_STEP == '●' ]] && f='⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'; i=0
    while :; do printf '\r%s %s' "${C_ACC}${f:$((i % ${#f})):1}${C_R}" "${C_DIM}$*${C_R}" >&2; i=$((i + 1)); sleep 0.08; done ) &
  SPIN_PID=$!
}
spin_stop() {
  [[ -n "$SPIN_PID" ]] || return 0
  kill "$SPIN_PID" 2>/dev/null || true; wait "$SPIN_PID" 2>/dev/null || true
  SPIN_PID=""; printf '\r\e[2K' >&2
}

valid_name() { [[ "$1" =~ $NAME_RE ]] || die "Invalid ${2:-name}: '$1'"; }
csv()        { printf '%s\n' "${1//,/$'\n'}" | sed 's/[[:space:]]//g' | grep -v '^$' || true; }
upper()      { printf '%s' "$1" | tr '[:lower:]' '[:upper:]'; }
need()       { [[ -n "${!1:-}" ]] || die "$1 is not set (mise.<profile>.toml, or .secrets/<profile>.env for passwords)"; }

# Read a dotenv file into the environment. Already-set variables win, so a
# file can never override what CI or the caller injected.
read_env_file() {
  local k v
  while IFS='=' read -r k v || [[ -n "$k" ]]; do
    [[ "$k" =~ ^[A-Z_][A-Z0-9_]*$ ]] || continue
    [[ -n "${!k+x}" ]] && continue
    v="${v%\"}"; v="${v#\"}"
    export "$k=$v"
  done < "$1"
}

# Secrets for the active profile. Only passwords come from here.
load_secrets() {
  case "${SECRETS_SOURCE:-file}" in
    file)
      local f="$ROOT/.secrets/${DB_PROFILE}.env"
      if [[ ! -f "$f" ]]; then
        [[ "$DB_TARGET" == local ]] || die "Missing $f (secrets for profile '$DB_PROFILE')"
        mkdir -p "$ROOT/.secrets"
        cp "$ROOT/config/secrets.local.example" "$f"
        log "Created $f from config/secrets.local.example"
      fi
      read_env_file "$f" ;;
    env)   ;;  # injected by the caller (CI)
    vault) die "SECRETS_SOURCE=vault is not implemented yet" ;;
    *)     die "Unknown SECRETS_SOURCE '${SECRETS_SOURCE}' (file|env)" ;;
  esac
}

# Keys a profile may leave out (mise.toml sets the rest).
config_defaults() {
  : "${DB_TARGET:=local}" "${DB_SSLMODE:=require}" "${TENANT_INSTANCES:=}" "${LOCAL_PORT:=5433}"
  export DB_TARGET DB_SSLMODE TENANT_INSTANCES LOCAL_PORT
}

# Config comes from mise (mise.toml + mise.<profile>.toml); secrets from load_secrets.
load_config() {
  [[ -n "${DB_PROFILE:-}" ]] || die "No profile loaded. Run through mise: 'mise run <task>' or 'mise -E <profile> run <task>'"
  config_defaults
  [[ "$DB_TARGET" == local || "$DB_TARGET" == remote ]] || die "DB_TARGET must be local|remote"
  [[ "${LOCK_TIMEOUT:-}" =~ ^[0-9]+(ms|s|min)?$ ]] || die "LOCK_TIMEOUT must look like 5s / 500ms / 1min"
  load_secrets
  local v
  for v in GLOBAL_DB_HOST GLOBAL_DB_NAME GLOBAL_DB_MIGRATOR_USER GLOBAL_DB_MIGRATOR_PASSWORD GLOBAL_DB_APP_ROLE; do
    need "$v"
  done
  valid_name "$GLOBAL_SCHEMA" "GLOBAL_SCHEMA"
  [[ "$DB_TARGET" == remote && "$DB_SSLMODE" == disable ]] && warn "TLS disabled against a remote database"

  # Containers reach the DB over the compose network locally; over the default
  # bridge for remote hosts. Override with DOCKER_NETWORK=host for tunnels.
  local net="${DOCKER_NETWORK:-}"
  [[ -z "$net" && "$DB_TARGET" == local ]] && net="sanketa-db-${DB_PROFILE}_default"
  LOCAL_CONTAINER="sanketa-postgres-${DB_PROFILE}"
  NET_ARGS=(); [[ -n "$net" ]] && NET_ARGS=(--network "$net")
  return 0
}

# ---- profile safety switches ------------------------------------------------
is_true() { [[ "$(printf '%s' "${1:-}" | tr '[:upper:]' '[:lower:]')" =~ ^(1|true|yes|on)$ ]]; }
# require_allowed ALLOW_RESET "Resetting the database"
require_allowed() {
  is_true "${!1:-false}" || die "$2 is disabled for profile '$DB_PROFILE' ($1=false)"
}
require_local() {
  [[ "$DB_TARGET" == local ]] || die "$1 only works on local profiles (profile '$DB_PROFILE' is remote)"
}

# ---- interaction --------------------------------------------------------------
# Prompts read /dev/tty so they work inside mise tasks; non-interactive runs
# (CI, pipes) must pass values as arguments instead.
has_tty() { [[ -z "${CI:-}" ]] && { : </dev/tty; } 2>/dev/null; }

# pick VAR "Question" option...   -> numbered menu, result in VAR
pick() {
  local __var="$1" q="$2"; shift 2
  [[ $# -gt 0 ]] || die "Nothing to choose from for: $q"
  if [[ $# -eq 1 ]]; then printf -v "$__var" '%s' "$1"; return; fi
  has_tty || die "$q: pass it as an argument (no terminal to prompt on)"
  local i=1 o reply opts=("$@")
  printf '%s\n' "$q" >/dev/tty
  for o in "$@"; do printf '  %d) %s\n' "$i" "$o" >/dev/tty; i=$((i + 1)); done
  while true; do
    printf '> ' >/dev/tty; read -r reply </dev/tty || die "Cancelled"
    if [[ "$reply" =~ ^[0-9]+$ ]] && (( reply >= 1 && reply <= $# )); then
      printf -v "$__var" '%s' "${opts[$((reply - 1))]}"; return
    fi
    printf 'Enter 1-%d\n' "$#" >/dev/tty
  done
}

# ask VAR "Question"   -> free text, result in VAR
ask() {
  has_tty || die "$2: pass it as an argument (no terminal to prompt on)"
  local reply; printf '%s ' "$2" >/dev/tty; read -r reply </dev/tty || die "Cancelled"
  printf -v "$1" '%s' "$reply"
}

# confirm_typed "word"   -> user must type the word exactly (skipped with ASSUME_YES=1)
confirm_typed() {
  is_true "${ASSUME_YES:-}" && return 0
  has_tty || die "Confirmation required: re-run with --yes (non-interactive)"
  local reply; printf 'Type \033[1m%s\033[0m to continue: ' "$1" >/dev/tty
  read -r reply </dev/tty || die "Cancelled"
  [[ "$reply" == "$1" ]] || die "Cancelled"
}

# One-line header so every command shows where it is pointed.
banner() {
  local n; n="$(tenant_instances | grep -c . || true)"
  printf '%s %s\n' "${C_B}${C_ACC}${DB_PROFILE}${C_R}" \
    "${C_DIM}profile · ${DB_TARGET} · global ${GLOBAL_DB_HOST}:${GLOBAL_DB_PORT}/${GLOBAL_DB_NAME} · ${n} tenant instance(s)${C_R}" >&2
}

compose() {
  local f=(-f "$ROOT/docker-compose.yml" --project-directory "$ROOT")
  if docker compose version >/dev/null 2>&1; then docker compose "${f[@]}" "$@"; else docker-compose "${f[@]}" "$@"; fi
}

tenant_instances() { csv "$TENANT_INSTANCES"; }

# ---- target selection -------------------------------------------------------
use_global() {
  T_LABEL="global"
  T_HOST="$GLOBAL_DB_HOST"; T_PORT="$GLOBAL_DB_PORT"; T_DB="$GLOBAL_DB_NAME"
  T_SSL="${GLOBAL_DB_SSLMODE:-$DB_SSLMODE}"
  T_USER="$GLOBAL_DB_MIGRATOR_USER"; T_PASS="$GLOBAL_DB_MIGRATOR_PASSWORD"
  T_APP_ROLE="$GLOBAL_DB_APP_ROLE"
  valid_name "$T_DB" "database name"; valid_name "$T_USER" "migrator user"; valid_name "$T_APP_ROLE" "app role"
}

# use_instance sanketa_db_2 -> reads SANKETA_DB_2_<SETTING>, falling back to TENANT_DB_<SETTING>
_inst_setting() {  # prefix setting [default]
  local a="${1}_$2" b="TENANT_DB_$2"; printf '%s' "${!a:-${!b:-${3:-}}}"
}
use_instance() {
  local name="$1" p; valid_name "$name" "instance name"
  [[ ",${TENANT_INSTANCES// /}," == *",$name,"* ]] || die "Unknown tenant instance '$name' (not in TENANT_INSTANCES)"
  p="$(upper "$name")"
  T_LABEL="$name"
  T_HOST="$(_inst_setting "$p" HOST)"; T_PORT="$(_inst_setting "$p" PORT 5432)"
  T_DB="$(_inst_setting "$p" NAME "$name")"; T_SSL="$(_inst_setting "$p" SSLMODE "$DB_SSLMODE")"
  T_USER="$(_inst_setting "$p" MIGRATOR_USER)"; T_PASS="$(_inst_setting "$p" MIGRATOR_PASSWORD)"
  T_APP_ROLE="$(_inst_setting "$p" APP_ROLE)"
  local pair var
  for pair in T_HOST:HOST T_USER:MIGRATOR_USER T_PASS:MIGRATOR_PASSWORD T_APP_ROLE:APP_ROLE; do
    var="${pair%%:*}"
    [[ -n "${!var}" ]] || die "Instance '$name': set ${p}_${pair#*:} or TENANT_DB_${pair#*:}"
  done
  valid_name "$T_DB" "database name"; valid_name "$T_USER" "migrator user"; valid_name "$T_APP_ROLE" "app role"
}

# ---- runners ----------------------------------------------------------------
# psql_q "<sql>" -> unaligned, tuples-only output, as the target's migrator.
psql_q() {
  # Secrets are passed to docker by NAME (-e VAR), so they never appear in `ps`.
  PGPASSWORD="$T_PASS" docker run --rm -i ${NET_ARGS[@]+"${NET_ARGS[@]}"} -e PGPASSWORD \
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
  # Credentials are passed by name only: never in argv (visible in `ps` and CI logs).
  FLYWAY_PASSWORD="$T_PASS" docker run --rm ${NET_ARGS[@]+"${NET_ARGS[@]}"} \
    -v "$ROOT/migrations:/flyway/sql:ro" \
    -v "$ROOT/seeds:/flyway/seeds:ro" \
    -e FLYWAY_URL="jdbc:postgresql://${T_HOST}:${T_PORT}/${T_DB}?sslmode=${T_SSL}&ApplicationName=sanketa-db-migrator" \
    -e FLYWAY_USER="$T_USER" \
    -e FLYWAY_PASSWORD \
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
