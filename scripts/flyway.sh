#!/usr/bin/env bash
# Low-level escape hatch: run any Flyway command on one schema.
#
#   scripts/flyway.sh global info
#   scripts/flyway.sh tenant sanketa_db_1 tenant_school_001 info
#   scripts/flyway.sh tenant sanketa_db_1 tenant_school_001 repair   # after fixing a failed migration
source "$(dirname "$0")/lib.sh"
load_config

kind="${1:?global|tenant}"; shift
case "$kind" in
  global) use_global; schema="$GLOBAL_SCHEMA" ;;
  tenant) use_instance "${1:?instance required}"; schema="${2:?tenant schema required}"; shift 2 ;;
  *) die "kind must be global|tenant" ;;
esac
[[ "$*" == *clean* ]] && die "clean is disabled"
# Anything beyond read-only commands on a remote profile needs a typed confirmation.
case " $* " in
  *" info "*|*" validate "*) ;;
  *) [[ "$DB_TARGET" == remote ]] && is_true "${REQUIRE_CONFIRM:-true}" && confirm_typed "$DB_PROFILE" ;;
esac
run_flyway "$kind" "$schema" "$@"
