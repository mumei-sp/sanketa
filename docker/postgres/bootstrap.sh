#!/usr/bin/env bash
# Local/CI only: create roles + databases if missing. Idempotent; run by
# db-sync on every local sync, as the docker superuser.
#
# This is also the reference for what infra must provision in staging/prod.
# Local profiles use the shared TENANT_DB_* roles (per-instance overrides are
# for remote profiles).
set -euo pipefail

psql_su() { psql -v ON_ERROR_STOP=1 -XAtq -U postgres -d "${1:-postgres}"; }

ensure_role() {  # name password
  psql_su <<SQL
DO \$\$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '$1') THEN
    CREATE ROLE $1 LOGIN PASSWORD '$2';
  ELSE
    ALTER ROLE $1 PASSWORD '$2';  -- keep in sync with .secrets/<profile>.env
  END IF;
END \$\$;
SQL
}

ensure_database() {  # db migrator app_role
  psql_su <<SQL
SELECT 'CREATE DATABASE $1' WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = '$1')
\gexec
REVOKE ALL ON DATABASE $1 FROM PUBLIC;
GRANT CONNECT, CREATE    ON DATABASE $1 TO $2;
GRANT CONNECT, TEMPORARY ON DATABASE $1 TO $3;
SQL
  echo "REVOKE ALL ON SCHEMA public FROM PUBLIC;" | psql_su "$1"
}

ensure_role "$GLOBAL_DB_MIGRATOR_USER" "$GLOBAL_DB_MIGRATOR_PASSWORD"
ensure_role "$GLOBAL_DB_APP_ROLE"      "$GLOBAL_DB_APP_PASSWORD"
ensure_role "$TENANT_DB_MIGRATOR_USER" "$TENANT_DB_MIGRATOR_PASSWORD"
ensure_role "$TENANT_DB_APP_ROLE"      "$TENANT_DB_APP_PASSWORD"

ensure_database "$GLOBAL_DB_NAME" "$GLOBAL_DB_MIGRATOR_USER" "$GLOBAL_DB_APP_ROLE"
IFS=',' read -ra INSTANCES <<< "${TENANT_INSTANCES// /}"
for db in "${INSTANCES[@]}"; do
  ensure_database "$db" "$TENANT_DB_MIGRATOR_USER" "$TENANT_DB_APP_ROLE"
done
