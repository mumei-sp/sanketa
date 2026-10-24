#!/usr/bin/env bash
# Compare live schemas (active profile).
#
#   scripts/schema-diff.sh                     tenant drift: every tenant schema vs the first
#   scripts/schema-diff.sh --against <profile> live global + tenant vs snapshots/<profile>/
#
# Exit: 0 identical | 1 different (or failure) | 2 bad usage
source "$(dirname "$0")/schema-dump.sh"

AGAINST=""; MAX_LINES="${DIFF_MAX_LINES:-60}"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --against) AGAINST="${2:?--against needs a profile}"; shift ;;
    -h|--help) sed -n '2,7p' "$0"; exit 0 ;;
    *)         echo "Unknown option: $1" >&2; exit 2 ;;
  esac
  shift
done

load_config; banner
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT

# show_diff <a> <b> <label a> <label b> -> prints a (truncated) unified diff; 1 if different
show_diff() {
  diff -u --label "$3" --label "$4" "$1" "$2" > "$tmp/d" && return 0
  local n; n="$(wc -l < "$tmp/d" | tr -d ' ')"
  head -n "$MAX_LINES" "$tmp/d"
  [[ $n -gt $MAX_LINES ]] && printf '... (%d more diff lines; DIFF_MAX_LINES=%d)\n' "$((n - MAX_LINES))" "$MAX_LINES"
  return 1
}

if [[ -n "$AGAINST" ]]; then
  valid_name "$AGAINST" "profile"
  snap="$ROOT/snapshots/$AGAINST"
  [[ -f "$snap/global.sql" && -f "$snap/tenant.sql" ]] \
    || die "No snapshots in snapshots/$AGAINST/ (run 'mise -E $AGAINST run db:dump' and commit them)"
  dump_profile "$tmp/live"
  [[ -n "$DUMPED_GLOBAL" && -n "$DUMPED_TENANT" ]] \
    || die "Profile '$DB_PROFILE' has no global or tenant schema yet (run 'mise run db:sync')"
  rc=0
  for f in global tenant; do
    if show_diff "$snap/$f.sql" "$tmp/live/$f.sql" "snapshots/$AGAINST/$f.sql" "live:$DB_PROFILE/$f"; then
      log "$f: matches snapshots/$AGAINST/$f.sql"
    else
      warn "$f: differs from snapshots/$AGAINST/$f.sql"; rc=1
    fi
  done
  [[ $rc == 0 ]] || warn "Live '$DB_PROFILE' differs from snapshots/$AGAINST (re-run db:dump and commit if intended)"
  exit $rc
fi

# ---- tenant drift ------------------------------------------------------------
list_tenants > "$tmp/tenants"
total="$(grep -c . "$tmp/tenants" || true)"
[[ $total -gt 0 ]] || die "No tenant schemas found on any instance"
ref=""; drift=()
while read -r inst schema; do
  use_instance "$inst"
  dump_schema "$schema" tenant > "$tmp/$inst.$schema.sql"
  if [[ -z "$ref" ]]; then ref="$inst:$schema"; reffile="$tmp/$inst.$schema.sql"; continue; fi
  if ! show_diff "$reffile" "$tmp/$inst.$schema.sql" "$ref" "$inst:$schema" > "$tmp/$inst.$schema.diff"; then
    drift+=("$inst:$schema")
  fi
done < "$tmp/tenants"

if [[ ${#drift[@]} -eq 0 ]]; then
  log "All $total tenant schemas identical (reference $ref)"
  exit 0
fi
warn "${#drift[@]} of $total tenant schemas drift from $ref:"
for d in "${drift[@]}"; do
  printf '\n\033[1m%s\033[0m\n' "$d"
  cat "$tmp/${d%%:*}.${d#*:}.diff"
done
exit 1
