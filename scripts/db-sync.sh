#!/usr/bin/env bash
# Bring every database to the state described by this branch. Idempotent:
# safe on a fresh setup, a half-migrated one, or one already up to date.
#
#   scripts/db-sync.sh                          global DB, then every tenant schema on every instance
#   scripts/db-sync.sh --check                  report only; exit 3 if anything is pending
#   scripts/db-sync.sh --instance sanketa_db_2  global + only that instance's tenants
#   scripts/db-sync.sh --tenant sanketa_db_1:tenant_school_042   global + one tenant (created if new)
#   scripts/db-sync.sh --with-seeds             also apply dev seeds (needs ALLOW_SEEDS=true)
#   scripts/db-sync.sh --check --verbose        also list each pending migration
#
# Exit: 0 in sync | 1 failure | 2 bad usage | 3 pending changes (--check)
source "$(dirname "$0")/lib.sh"

CHECK=0; SEEDS=0; VERBOSE=0; ONLY_INSTANCES=""; ONLY_TENANTS=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --check)      CHECK=1 ;;
    --with-seeds) SEEDS=1 ;;
    --verbose)    VERBOSE=1 ;;
    --instance)   ONLY_INSTANCES+="${2:?--instance needs a name},"; shift ;;
    --tenant)     [[ "${2:-}" == *:* ]] || { echo "--tenant needs <instance>:<schema>" >&2; exit 2; }
                  ONLY_TENANTS+="$2,"; ONLY_INSTANCES+="${2%%:*},"; shift ;;
    -h|--help)    sed -n '2,13p' "$0"; exit 0 ;;
    *)            echo "Unknown option: $1" >&2; exit 2 ;;
  esac
  shift
done

load_config
banner
[[ $SEEDS == 1 ]] && require_allowed ALLOW_SEEDS "Seeding"

# ---- 1. Local: start Postgres and create roles/databases if missing ---------
if [[ $DB_TARGET == local ]]; then
  spin_start "starting local Postgres"
  up_log="$(compose up -d --wait --quiet-pull postgres 2>&1)" || { spin_stop; echo "$up_log" >&2; die "Local Postgres failed to start"; }
  # Bootstrap only instances in this container; one with its own <INSTANCE>_HOST is another server.
  local_insts=""
  for i in $(tenant_instances); do v="$(upper "$i")_HOST"; [[ -z "${!v:-}" ]] && local_insts+="$i,"; done
  TENANT_INSTANCES="${local_insts%,}" docker exec -i \
    -e GLOBAL_DB_NAME -e GLOBAL_DB_MIGRATOR_USER -e GLOBAL_DB_MIGRATOR_PASSWORD \
    -e GLOBAL_DB_APP_ROLE -e GLOBAL_DB_APP_PASSWORD \
    -e TENANT_INSTANCES -e TENANT_DB_MIGRATOR_USER -e TENANT_DB_MIGRATOR_PASSWORD \
    -e TENANT_DB_APP_ROLE -e TENANT_DB_APP_PASSWORD \
    "$LOCAL_CONTAINER" bash /opt/sanketa/bootstrap.sh >/dev/null || die "Local bootstrap failed"
  spin_stop; ok "local Postgres ready  ${C_DIM}${LOCAL_CONTAINER} · localhost:${LOCAL_PORT}${C_R}"
fi

# Reachable, and the app role infra was supposed to create exists.
preflight() {
  [[ $UI_TTY == 1 ]] || detail "[$T_LABEL] connecting to ${T_HOST}:${T_PORT}/${T_DB} as ${T_USER}"
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
SUMMARY=(); PENDING_TOTAL=0
out="$(mktemp)"; trap 'spin_stop; rm -f "$out"' EXIT; trap 'exit 130' INT TERM

process() {  # kind schema   (uses current target)
  local kind="$1" schema="$2" status
  local repair="mise -E $DB_PROFILE run db:repair $([[ $kind == global ]] && echo global || echo "$T_LABEL:$schema")"
  if [[ $CHECK == 1 ]]; then
    spin_start "checking $T_DB/$schema"
    run_flyway "$kind" "$schema" info >"$out" 2>&1 || { spin_stop; cat "$out" >&2; die "[$T_LABEL] $schema: flyway info failed"; }
    spin_stop
    local pending failed
    pending=$(grep -cE '\|[[:space:]]+Pending[[:space:]]+\|' "$out" || true)
    failed=$(grep -cE '\|[[:space:]]+Failed[[:space:]]+\|' "$out" || true)
    [[ $failed -gt 0 ]] && { cat "$out" >&2; die "[$T_LABEL] $schema has FAILED migrations; fix the file, then: $repair"; }
    PENDING_TOTAL=$((PENDING_TOTAL + pending))
    if [[ $VERBOSE == 1 && $pending -gt 0 ]]; then
      # Flyway info table: | Category | Version | Description | Type | Installed On | State |
      grep -E '\|[[:space:]]+Pending[[:space:]]+\|' "$out" \
        | awk -F'|' '{gsub(/^ +| +$/,"",$3); gsub(/^ +| +$/,"",$4); printf "      pending: %s %s\n", $3, $4}' >&2
    fi
    status="$([[ $pending == 0 ]] && echo 'up to date' || echo "$pending pending")"
  else
    spin_start "migrating $T_DB/$schema"
    if ! run_flyway "$kind" "$schema" migrate >"$out" 2>&1; then
      spin_stop; cat "$out" >&2
      die "[$T_LABEL] $schema: migration failed. Transactional files were rolled back; for an executeInTransaction=false file, inspect the schema, fix, then: $repair"
    fi
    spin_stop
    local applied
    applied=$(grep -oE 'Successfully applied [0-9]+' "$out" | grep -oE '[0-9]+' || echo 0)
    status="$([[ $applied == 0 ]] && echo 'up to date' || echo "applied $applied")"
    if [[ $SEEDS == 1 ]]; then
      spin_start "seeding $T_DB/$schema"
      SEED_RUN=1 run_flyway "$kind" "$schema" migrate >"$out" 2>&1 || { cat "$out" >&2; die "[$T_LABEL] $schema: seeding failed"; }
      spin_stop; status+=" (+seeds)"
    fi
  fi
  local line; line="$(printf '%-7s %-18s %-28s %s' "$kind" "$T_DB" "$schema" "$(paint "$status")")"
  SUMMARY+=("$line"); ok "$line"
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
header="${C_DIM}$(printf '%-7s %-18s %-28s %s' SCOPE DATABASE SCHEMA STATUS)${C_R}"
# Terminal: the ✓ lines above already said it. Logs/CI: full table.
[[ $UI_TTY == 1 ]] || printf '\n%s\n%s\n' "$header" "$report"
if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
  { echo "### db-sync ($([[ $CHECK == 1 ]] && echo check || echo apply)): 1 global + ${TENANT_COUNT} tenant schema(s)"
    echo '```'; echo "$header"; echo "$report"; echo '```'; } >> "$GITHUB_STEP_SUMMARY"
fi

if [[ $CHECK == 1 && $PENDING_TOTAL -gt 0 ]]; then
  warn "$PENDING_TOTAL pending migration(s). Run without --check to apply."; exit 3
fi
log "Done: global + ${TENANT_COUNT} tenant schema(s) in sync with this branch"
