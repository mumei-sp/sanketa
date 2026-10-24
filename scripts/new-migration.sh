#!/usr/bin/env bash
# Create a new versioned migration from the template.
#
#   scripts/new-migration.sh global "create users table"
#   scripts/new-migration.sh tenant "add index on students admission_no"
#
# Versions are UTC timestamps (V202610191530__...) so parallel branches
# never collide on a version number.
set -euo pipefail
cd "$(dirname "$0")/.."

kind="${1:?global|tenant}"; desc="${2:?description}"
[[ "$kind" == global || "$kind" == tenant ]] || { echo "kind must be global|tenant" >&2; exit 2; }

# Two migrations in the same second would share a version: wait for the next one.
version="$(date -u +%Y%m%d%H%M%S)"
while ls migrations/*/V"${version}"__* >/dev/null 2>&1; do sleep 1; version="$(date -u +%Y%m%d%H%M%S)"; done
slug="$(echo "$desc" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/_/g; s/^_+|_+$//g')"
file="migrations/${kind}/V${version}__${slug}.sql"

[[ -n "$slug" ]] || { echo "description must contain letters or digits" >&2; exit 2; }
safe_desc="$(printf '%s' "$desc" | sed 's/[\/&|\\]/\\&/g')"
sed -e "s|{{DESCRIPTION}}|${safe_desc}|" -e "s|{{SCOPE}}|${kind}|" -e "s|{{VERSION}}|${version}|" \
  templates/migration.sql > "$file"
echo "$file"
