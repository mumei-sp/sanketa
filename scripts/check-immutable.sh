#!/usr/bin/env bash
# Released migrations are immutable: fix forward with a new version.
# Before the first release (no db-release-* tag) the baseline files are edited
# freely; from the latest release tag on, every V* file it contained is frozen.
#
#   scripts/check-immutable.sh [ref]    (default: latest db-release-* tag reachable from HEAD)
set -euo pipefail
ref="${1:-$(git describe --tags --abbrev=0 --match 'db-release-*' 2>/dev/null || true)}"

if [[ -z "$ref" ]]; then
  echo "OK: pre-release (no db-release-* tag yet): migrations are editable."
  exit 0
fi
git rev-parse --verify --quiet "$ref^{commit}" >/dev/null || { echo "Unknown ref '$ref'" >&2; exit 2; }

# Release vs the working tree, so uncommitted edits are caught before a push too.
changed="$(git diff --name-status "$ref" -- 'migrations/**/V*' | grep -vE '^A' || true)"
if [[ -n "$changed" ]]; then
  echo "Migrations released in $ref are immutable. Offending changes:" >&2
  echo "$changed" >&2
  exit 1
fi
echo "OK: no migration released in $ref was modified."
