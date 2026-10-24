#!/usr/bin/env bash
# Run scripts/check-safety.py on every fixture and assert its findings.
# Each fixture declares, in header comments:
#   -- expect: <rule> ...        rules that must be reported (or `none` = no findings at all)
#   -- expect-not: <rule> ...    rules that must not be reported
# The exit code must be 1 exactly when an ERROR is reported.
set -uo pipefail
cd "$(dirname "$0")/../.."

pass=0; fail=0
for f in tests/safety/*.sql; do
  out="$(python3 scripts/check-safety.py "$f")"; rc=$?
  found="$(printf '%s\n' "$out" | awk '$1=="ERROR"||$1=="WARN"{print $2}' | sort -u | tr '\n' ' ')"
  expect="$(sed -n 's/^-- expect: *//p' "$f" | tr '\n' ' ')"
  expect_not="$(sed -n 's/^-- expect-not: *//p' "$f" | tr '\n' ' ')"
  problems=""

  for r in $expect; do
    if [[ "$r" == none ]]; then
      [[ -z "$found" ]] || problems+=" expected no findings, got: $found;"
    elif [[ " $found " != *" $r "* ]]; then
      problems+=" missing $r;"
    fi
  done
  for r in $expect_not; do
    [[ " $found " != *" $r "* ]] || problems+=" unexpected $r;"
  done
  want_rc=0; printf '%s\n' "$out" | grep -q '^ERROR' && want_rc=1
  [[ "$rc" == "$want_rc" ]] || problems+=" exit $rc, want $want_rc;"

  if [[ -z "$problems" ]]; then
    pass=$((pass + 1)); echo "ok    $f"
  else
    fail=$((fail + 1)); echo "FAIL  $f:$problems"; printf '%s\n' "$out" | sed 's/^/        /'
  fi
done
echo "safety tests: $pass passed, $fail failed"
[[ "$fail" == 0 ]]
