#!/usr/bin/env bash
# Schema-only, normalised dump of the active profile, for review in git.
#
#   scripts/schema-dump.sh               -> snapshots/<profile>/{global,tenant}.sql
#   scripts/schema-dump.sh --out <dir>   -> <dir>/{global,tenant}.sql
#
# tenant.sql is the first tenant schema found, with its name replaced by
# __TENANT__ (every tenant schema must be identical; see `mise run db:diff`).
# Also sourced by schema-diff.sh for dump_schema / list_tenants.
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

# dump_schema <schema> [tenant]   (current target) -> normalised DDL on stdout
dump_schema() {
  local schema="$1" raw
  valid_name "$schema" "schema name"
  # PGPASSWORD is exported into docker's env and passed by name, never argv.
  raw="$(PGPASSWORD="$T_PASS" docker run --rm ${NET_ARGS[@]+"${NET_ARGS[@]}"} -e PGPASSWORD \
    "postgres:${POSTGRES_VERSION}" \
    pg_dump -d "host=$T_HOST port=$T_PORT dbname=$T_DB user=$T_USER sslmode=$T_SSL connect_timeout=5" \
    --schema-only --no-owner --no-privileges \
    --schema="$schema" --exclude-table="${schema}.flyway_seed_history")" \
    || die "[$T_LABEL] pg_dump of schema '$schema' failed"
  # Drop comments, session SETs and PG 18's \restrict lines (random key per
  # run); squeeze blank runs so the output is stable across runs and hosts.
  printf '%s\n' "$raw" \
    | grep -vE '^(--|SET |SELECT pg_catalog\.set_config|\\restrict|\\unrestrict)' \
    | awk 'NF { if (seen && blank) print ""; print; seen = 1; blank = 0; next } { blank = 1 }' \
    | if [[ "${2:-}" == tenant ]]; then
        # Twice: adjacent occurrences share a boundary char, one pass misses the second.
        sed -E "s/(^|[^a-z0-9_])${schema}([^a-z0-9_]|$)/\1__TENANT__\2/g; s/(^|[^a-z0-9_])${schema}([^a-z0-9_]|$)/\1__TENANT__\2/g"
      else cat; fi
}

# list_tenants -> "<instance> <schema>" per line, every instance in config order
list_tenants() {
  local inst
  for inst in $(tenant_instances); do
    use_instance "$inst"
    psql_q "SELECT nspname FROM pg_namespace WHERE nspname ~ '${TENANT_RE}' ORDER BY nspname" \
      | sed "s/^/$inst /" || die "[$inst] cannot list tenant schemas"
  done
}

# dump_profile <dir> -> <dir>/global.sql (+ <dir>/tenant.sql when a tenant exists).
# Schemas that don't exist yet (fresh database) are skipped, not errors.
dump_profile() {
  local out="$1" first
  mkdir -p "$out"
  DUMPED_GLOBAL=""; DUMPED_TENANT=""
  use_global
  if [[ -n "$(psql_q "SELECT 1 FROM pg_namespace WHERE nspname = '${GLOBAL_SCHEMA}'")" ]]; then
    dump_schema "$GLOBAL_SCHEMA" > "$out/global.sql.tmp"; DUMPED_GLOBAL=1
  fi
  first="$(list_tenants)"; first="${first%%$'\n'*}"
  if [[ -n "$first" ]]; then
    use_instance "${first%% *}"
    dump_schema "${first#* }" tenant > "$out/tenant.sql.tmp"
    DUMPED_TENANT="${first% *}:${first#* }"
  fi
  # Only replace files once every dump succeeded.
  [[ -n "$DUMPED_GLOBAL" ]] && mv "$out/global.sql.tmp" "$out/global.sql"
  [[ -n "$DUMPED_TENANT" ]] && mv "$out/tenant.sql.tmp" "$out/tenant.sql"
  return 0
}

main() {
  local out=""
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --out)     out="${2:?--out needs a directory}"; shift ;;
      -h|--help) sed -n '2,9p' "$0"; exit 0 ;;
      *)         echo "Unknown option: $1" >&2; exit 2 ;;
    esac
    shift
  done
  load_config; banner
  [[ -n "$out" ]] || out="$ROOT/snapshots/$DB_PROFILE"
  dump_profile "$out"
  if [[ -n "$DUMPED_GLOBAL" ]]; then log "Wrote $out/global.sql (schema $GLOBAL_SCHEMA)"; else warn "Global schema not created yet; skipped"; fi
  if [[ -n "$DUMPED_TENANT" ]]; then log "Wrote $out/tenant.sql (from $DUMPED_TENANT)"; else warn "No tenant schemas yet; skipped tenant.sql"; fi
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then main "$@"; fi
