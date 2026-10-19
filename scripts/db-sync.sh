#!/usr/bin/env bash
# Bring every database to the state described by this branch. Idempotent:
# safe on a fresh setup, a half-migrated one, or one already up to date.
#
#   scripts/db-sync.sh                          global DB, then every tenant schema on every instance
#   scripts/db-sync.sh --check                  report only; exit 3 if anything is pending
#   scripts/db-sync.sh --instance sanketa_db_2  global + only that instance's tenants
#   scripts/db-sync.sh --tenant sanketa_db_1:tenant_school_042   global + one tenant (created if new)
#   scripts/db-sync.sh --with-seeds             also apply dev seeds (refused on remote targets)
#
# Exit: 0 in sync | 1 failure | 2 bad usage | 3 pending changes (--check)
source "$(dirname "$0")/lib.sh"

CHECK=0; SEEDS=0; ONLY_INSTANCES=""; ONLY_TENANTS=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --check)      CHECK=1 ;;
    --with-seeds) SEEDS=1 ;;
    --instance)   ONLY_INSTANCES+="${2:?--instance needs a name},"; shift ;;
    --tenant)     [[ "${2:-}" == *:* ]] || { echo "--tenant needs <instance>:<schema>" >&2; exit 2; }
                  ONLY_TENANTS+="$2,"; ONLY_INSTANCES+="${2%%:*},"; shift ;;
    -h|--help)    sed -n '2,12p' "$0"; exit 0 ;;
    *)            echo "Unknown option: $1" >&2; exit 2 ;;
  esac
  shift
done

load_env
[[ $SEEDS == 1 && $DB_TARGET == remote ]] && die "Seeds are local/CI only; refusing on a remote target"

# ---- 1. Local: start Postgres and create roles/databases if missing ---------
if [[ $DB_TARGET == local ]]; then
  log "Starting local Postgres"
  up_log="$(compose up -d --wait --quiet-pull postgres 2>&1)" || { echo "$up_log" >&2; die "Local Postgres failed to start"; }
  log "Bootstrapping local roles and databases"
  docker exec -i \
    -e GLOBAL_DB_NAME -e GLOBAL_DB_MIGRATOR_USER -e GLOBAL_DB_MIGRATOR_PASSWORD \
    -e GLOBAL_DB_APP_ROLE -e GLOBAL_DB_APP_PASSWORD \
    -e TENANT_INSTANCES -e TENANT_DB_MIGRATOR_USER -e TENANT_DB_MIGRATOR_PASSWORD \
    -e TENANT_DB_APP_ROLE -e TENANT_DB_APP_PASSWORD \
    sanketa-postgres bash /opt/sanketa/bootstrap.sh >/dev/null || die "Local bootstrap failed"
fi

# Reachable, and the app role infra was supposed to create exists.
preflight() {
  log "[$T_LABEL] connecting to ${T_HOST}:${T_PORT}/${T_DB} as ${T_USER}"
  local i err
  for i in 1 2 3 4 5 6 7 8 9 10; do
    err="$(psql_q "SELECT 1" 2>&1 >/dev/null)" && break
    # Wrong credentials / missing DB won't fix themselves: fail immediately.
    [[ "$err" == *"password authentication failed"* || "$err" == *"does not exist"* || "$err" == *"permission denied"* ]] && i=10
    [[ $i == 10 ]] && die "[$T_LABEL] cannot connect: ${err##*FATAL:  }"; sleep 2
  done
  psql_q "SELECT 1 FROM pg_roles WHERE rolname = '${T_APP_ROLE}'" | grep -q 1 \
    || die "[$T_LABEL] app role '${T_APP_ROLE}' does not exist (infra must create it)"
}

# ---- 2. Process one schema --------------------------------------------------
SUMMARY=(); PENDING_TOTAL=0; LAST=""
out="$(mktemp)"; trap 'rm -f "$out"' EXIT

process() {  # kind schema   (uses current target)
  local kind="$1" schema="$2" status
  if [[ $CHECK == 1 ]]; then
    run_flyway "$kind" "$schema" info >"$out" 2>&1 || { cat "$out" >&2; die "[$T_LABEL] $schema: flyway info failed"; }
    local pending failed
    pending=$(grep -cE '\|[[:space:]]+Pending[[:space:]]+\|' "$out" || true)
    failed=$(grep -cE '\|[[:space:]]+Failed[[:space:]]+\|' "$out" || true)
    [[ $failed -gt 0 ]] && { cat "$out" >&2; die "[$T_LABEL] $schema has FAILED migrations; fix, then scripts/flyway.sh repair"; }
    PENDING_TOTAL=$((PENDING_TOTAL + pending))
    status="$([[ $pending == 0 ]] && echo 'up to date' || echo "$pending pending")"
  else
    if ! run_flyway "$kind" "$schema" migrate >"$out" 2>&1; then
      cat "$out" >&2
      die "[$T_LABEL] $schema: migration failed. Transactional files were rolled back; for an executeInTransaction=false file, inspect the schema, fix, then scripts/flyway.sh repair"
    fi
    local applied
    applied=$(grep -oE 'Successfully applied [0-9]+' "$out" | grep -oE '[0-9]+' || echo 0)
    status="$([[ $applied == 0 ]] && echo 'up to date' || echo "applied $applied")"
    if [[ $SEEDS == 1 ]]; then
      SEED_RUN=1 run_flyway "$kind" "$schema" migrate >"$out" 2>&1 || { cat "$out" >&2; die "[$T_LABEL] $schema: seeding failed"; }
      status+=" (+seeds)"
    fi
  fi
  LAST="$(printf '%-7s %-18s %-28s %s' "$kind" "$T_DB" "$schema" "$status")"
  SUMMARY+=("$LAST"); log "$LAST"
}

# ---- 3. Global DB first -----------------------------------------------------
use_global; preflight
process global "$GLOBAL_SCHEMA"

# ---- 4. Every tenant instance, every tenant schema in it --------------------
# TODO: once the Global DB has database_instances / tenant_database_mapping,
#       read instances + tenant schemas from there instead of config + scan.
INSTANCES="$(if [[ -n "$ONLY_INSTANCES" ]]; then csv "$ONLY_INSTANCES" | sort -u; else tenant_instances; fi)"
[[ -z "$INSTANCES" ]] && warn "No tenant instances configured (TENANT_INSTANCES)"

TENANT_COUNT=0
for inst in $INSTANCES; do
  use_instance "$inst"; preflight
  if [[ -n "$ONLY_TENANTS" ]]; then
    schemas="$(csv "$ONLY_TENANTS" | { grep "^${inst}:" || true; } | cut -d: -f2 | sort -u)"
  else
    seed_var="$(upper "$inst")_TENANTS"
    schemas="$( { psql_q "SELECT nspname FROM pg_namespace WHERE nspname ~ '${TENANT_RE}'"; csv "${!seed_var:-}"; } | sort -u)"
  fi
  [[ -z "$schemas" ]] && warn "[$inst] no tenant schemas"
  for s in $schemas; do
    [[ "$s" =~ $TENANT_RE ]] || die "[$inst] invalid tenant schema '$s' (must match tenant_*)"
    process tenant "$s"; TENANT_COUNT=$((TENANT_COUNT + 1))
  done
done

# ---- 5. Report --------------------------------------------------------------
report="$(printf '%s\n' "${SUMMARY[@]}")"
header="$(printf '%-7s %-18s %-28s %s' SCOPE DATABASE SCHEMA STATUS)"
printf '\n%s\n%s\n' "$header" "$report"
if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
  { echo "### db-sync ($([[ $CHECK == 1 ]] && echo check || echo apply)): 1 global + ${TENANT_COUNT} tenant schema(s)"
    echo '```'; echo "$header"; echo "$report"; echo '```'; } >> "$GITHUB_STEP_SUMMARY"
fi

if [[ $CHECK == 1 && $PENDING_TOTAL -gt 0 ]]; then
  warn "$PENDING_TOTAL pending migration(s). Run without --check to apply."; exit 3
fi
log "Done: global + ${TENANT_COUNT} tenant schema(s) in sync with this branch"
