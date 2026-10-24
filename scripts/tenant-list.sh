#!/usr/bin/env bash
# Fast, read-only overview of every schema's migration state. No Flyway: one
# psql query per database reads each schema's flyway_schema_history.
#
#   scripts/tenant-list.sh                         global + every tenant schema on every instance
#   scripts/tenant-list.sh --instance sanketa_db_2 global + that instance only
#
# Columns: SCOPE DATABASE SCHEMA VERSION APPLIED LATEST STATUS
# STATUS: up to date | behind | ahead | not migrated | failed | no access | unreachable
# Always exits 0 once config is loaded (unreachable databases become rows).
source "$(dirname "$0")/lib.sh"

ONLY=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --instance) ONLY="${2:?--instance needs a name}"; shift ;;
    -h|--help)  sed -n '2,10p' "$0"; exit 0 ;;
    *)          echo "Unknown option: $1" >&2; exit 2 ;;
  esac
  shift
done
load_config

# Newest V version on disk for a scope ("-" if none). Flyway shows V1_2 as 1.2.
latest_on_disk() {
  local v
  v="$(ls "$ROOT/migrations/$1" 2>/dev/null | sed -nE 's/^V([0-9][0-9_.]*)__.*\.sql$/\1/p' | tr _ . | sort -t. -k1,1n -k2,2n -k3,3n | tail -1)"
  printf '%s' "${v:--}"
}

# One row per schema: name|version|applied|failed, or name|none / name|noaccess.
# query_to_xml runs a per-schema query built with format(), so every schema's
# history table is read in this single statement.
SQL_TEMPLATE=$(cat <<'SQL'
SELECT n.nspname || '|' ||
  CASE
    WHEN to_regclass(format('%I.flyway_schema_history', n.nspname)) IS NULL THEN 'none'
    WHEN NOT has_table_privilege(to_regclass(format('%I.flyway_schema_history', n.nspname)), 'SELECT') THEN 'noaccess'
    ELSE (xpath('/row/r/text()', query_to_xml(format(
      $q$SELECT coalesce((SELECT version FROM %1$I.flyway_schema_history
                           WHERE success AND version IS NOT NULL
                           ORDER BY installed_rank DESC LIMIT 1), '-')
          || '|' || (SELECT count(*) FROM %1$I.flyway_schema_history WHERE success AND type <> 'SCHEMA')
          || '|' || (SELECT count(*) FROM %1$I.flyway_schema_history WHERE NOT success) AS r$q$,
      n.nspname), false, true, '')))[1]::text
  END
FROM pg_namespace n WHERE __FILTER__ ORDER BY n.nspname
SQL
)

# Compare two dotted versions: prints behind | ahead | same
vcmp() {
  [[ "$1" == "$2" ]] && { echo same; return; }
  local lo; lo="$(printf '%s\n%s\n' "$1" "$2" | sort -t. -k1,1n -k2,2n -k3,3n | head -1)"
  [[ "$lo" == "$1" ]] && echo behind || echo ahead
}

FMT='%-7s %-18s %-28s %-15s %-7s %-15s %s\n'
ROWS=""; N_TENANTS=0; N_BEHIND=0; N_FAILED=0; N_UNREACH=0

row() {  # scope db schema version applied latest status
  ROWS+="$(printf "$FMT" "$1" "$2" "$3" "$4" "$5" "$6" "$(paint "$7")")"$'\n'
  [[ "$1" == tenant && "$3" != "*" ]] && N_TENANTS=$((N_TENANTS + 1))
  case "$7" in
    behind|"not migrated") N_BEHIND=$((N_BEHIND + 1)) ;;
    failed)                N_FAILED=$((N_FAILED + 1)) ;;
    unreachable)           N_UNREACH=$((N_UNREACH + 1)) ;;
  esac
  return 0
}

# scan <scope> <sql filter> [expected schemas...]  (current target)
scan() {
  local scope="$1" filter="$2"; shift 2
  local latest out err line name info ver applied failed status seen=" "
  latest="$(latest_on_disk "$scope")"
  # No history table is only a problem if there is something to apply.
  local unmigrated="not migrated"; [[ "$latest" == - ]] && unmigrated="up to date"
  if ! out="$(psql_q "${SQL_TEMPLATE//__FILTER__/$filter}" 2>&1)"; then
    err="$(printf '%s' "$out" | tail -1)"; warn "[$T_LABEL] ${err##*FATAL:  }"
    row "$scope" "$T_DB" "*" - - "$latest" unreachable; return 0
  fi
  while IFS= read -r line; do
    [[ -z "$line" ]] && continue
    name="${line%%|*}"; info="${line#*|}"; seen+="$name "
    case "$info" in
      none)     row "$scope" "$T_DB" "$name" - 0 "$latest" "$unmigrated" ;;
      noaccess) row "$scope" "$T_DB" "$name" - - "$latest" "no access" ;;
      *)
        IFS='|' read -r ver applied failed <<<"$info"
        if [[ "$failed" != 0 ]]; then status=failed
        elif [[ "$latest" == - ]]; then status="up to date"
        elif [[ "$ver" == - ]]; then status=behind
        else
          case "$(vcmp "$ver" "$latest")" in
            same) status="up to date" ;; behind) status=behind ;; ahead) status=ahead ;;
          esac
        fi
        row "$scope" "$T_DB" "$name" "$ver" "$applied" "$latest" "$status" ;;
    esac
  done <<<"$out"
  # Schemas the profile expects (<INSTANCE>_TENANTS) that db-sync hasn't created yet.
  for name in "$@"; do
    [[ "$seen" == *" $name "* ]] || row "$scope" "$T_DB" "$name" - 0 "$latest" "$unmigrated"
  done
  return 0
}

use_global
scan global "n.nspname = '${GLOBAL_SCHEMA}'" "$GLOBAL_SCHEMA"

if [[ -n "$ONLY" ]]; then INSTANCES="$ONLY"; else INSTANCES="$(tenant_instances)"; fi
N_INST=0
for inst in $INSTANCES; do
  use_instance "$inst"; N_INST=$((N_INST + 1))
  seed_var="$(upper "$inst")_TENANTS"
  # shellcheck disable=SC2046  # word-split the configured list on purpose
  scan tenant "n.nspname ~ '${TENANT_RE}'" $(csv "${!seed_var:-}")
done

printf '%s' "$C_DIM"; printf "$FMT" SCOPE DATABASE SCHEMA VERSION APPLIED LATEST STATUS; printf '%s' "$C_R"
printf '%s' "$ROWS"
footer="${N_TENANTS} tenant(s) across ${N_INST} instance(s), ${N_BEHIND} behind"
[[ $N_FAILED -gt 0 ]] && footer+=", ${N_FAILED} failed"
[[ $N_UNREACH -gt 0 ]] && footer+=", ${N_UNREACH} database(s) unreachable"
printf '\n%s\n' "$footer"
exit 0
