#!/usr/bin/env bash
# Fail if an already-merged migration was edited, renamed or deleted.
# Applied migrations are immutable: fix forward with a new version.
#
#   scripts/check-immutable.sh <base-ref>    (default: origin/db/schema)
set -euo pipefail
base="${1:-origin/db/schema}"

if ! git rev-parse --verify --quiet "$base" >/dev/null; then
  echo "Base ref '$base' not found; nothing to compare (first commit?)."
  exit 0
fi

# Merge base vs the working tree, so uncommitted edits are caught before a push too.
changed="$(git diff --name-status "$(git merge-base "$base" HEAD)" -- 'migrations/**/V*' | grep -vE '^A' || true)"
if [[ -n "$changed" ]]; then
  echo "Versioned migrations are immutable once merged. Offending changes:" >&2
  echo "$changed" >&2
  exit 1
fi
echo "OK: no merged migration was modified."
