-- =============================================================================
-- V1.4 :: global :: routing
-- -----------------------------------------------------------------------------
-- Where each school's data lives: tenant database servers and placements.
-- Pre-release: edited in place (rebuild with `mise run dev:reset --yes`). Frozen
-- at the release tag (db-release-N); later changes are new `mise run db:new` files.
-- Files run in version order: a table may only reference earlier files.
-- =============================================================================

-- ---- database_instances --------------------------------------------------------
-- Tenant database servers (sanketa_db_1, ...); every school lives on one. fabric
-- reads this to connect; onboarding uses it to place a new school. No secrets
-- here: credentials live in Vault, referenced by vault_secret_path. Live health is
-- monitoring's job (not stored here), and tenant counts come from
-- tenant_database_mapping (no stored counter to drift).
CREATE TABLE database_instances (
    id UUID NOT NULL DEFAULT uuidv7() CONSTRAINT pk_database_instances PRIMARY KEY,
    -- Same names as the sanketa-db profiles' TENANT_INSTANCES.
    name TEXT NOT NULL,
    host TEXT NOT NULL,
    port INTEGER NOT NULL DEFAULT 5432,
    database_name TEXT NOT NULL,
    -- libpq sslmode; 'disable' only for local development instances.
    ssl_mode TEXT NOT NULL DEFAULT 'verify-full',
    -- Where fabric reads this instance's username/password in Vault. Rotation
    -- happens in Vault only; the password is never stored or cached outside it.
    vault_secret_path TEXT NOT NULL,
    -- Where the server is: schools are placed on an instance in their own country.
    country_code TEXT NOT NULL DEFAULT 'IN',
    status TEXT NOT NULL DEFAULT 'open',
    -- Optional capacity limit used when placing new schools.
    max_tenants INTEGER,

    -- Audit: who (users.id) and when. No deleted_at: an instance is retired, never
    -- deleted, so the history of where schools lived stays explainable.
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID,
    version INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT uq_database_instances__name UNIQUE (name),
    -- The same physical database can't be registered twice.
    CONSTRAINT uq_database_instances__location UNIQUE (host, port, database_name),
    -- Postgres identifier rules (lower-case, starts with a letter, max 63).
    CONSTRAINT ck_database_instances__name CHECK (name ~ '^[a-z][a-z0-9_]{2,62}$'),
    CONSTRAINT ck_database_instances__database_name CHECK (database_name ~ '^[a-z][a-z0-9_]{0,62}$'),
    -- Hostname or IP address, no spaces or scheme.
    CONSTRAINT ck_database_instances__host CHECK (
        char_length(host) BETWEEN 1 AND 253 AND host ~ '^[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?$'
    ),
    CONSTRAINT ck_database_instances__port CHECK (port BETWEEN 1 AND 65535),
    -- A Vault path (secret/sanketa/prod/db/sanketa_db_1), never a password or URL.
    CONSTRAINT ck_database_instances__vault_secret_path CHECK (
        char_length(vault_secret_path) BETWEEN 3 AND 300
        AND vault_secret_path ~ '^[a-z0-9][a-z0-9_-]*(/[a-z0-9][a-z0-9_.-]*)+$'
    ),
    CONSTRAINT ck_database_instances__ssl_mode CHECK (ssl_mode IN ('disable', 'require', 'verify-ca', 'verify-full')),
    CONSTRAINT ck_database_instances__country_code CHECK (country_code ~ '^[A-Z]{2}$'),
    -- open: takes new schools | closed: serves its schools, takes no new ones |
    -- retired: empty, out of use.
    CONSTRAINT ck_database_instances__status CHECK (status IN ('open', 'closed', 'retired')),
    CONSTRAINT ck_database_instances__max_tenants CHECK (max_tenants > 0)
);

CREATE TRIGGER tg_database_instances__updated_at BEFORE UPDATE ON database_instances
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE database_instances IS 'Tenant database servers; where each school''s schema lives';
COMMENT ON COLUMN database_instances.name IS 'Instance name, e.g. sanketa_db_1; matches sanketa-db TENANT_INSTANCES';
COMMENT ON COLUMN database_instances.ssl_mode IS 'libpq sslmode: disable (local dev only) | require | verify-ca | verify-full';
COMMENT ON COLUMN database_instances.vault_secret_path IS 'Vault path of the connection credentials; no secret is stored in this DB';
COMMENT ON COLUMN database_instances.status IS 'open (takes new schools) | closed (no new schools) | retired';
COMMENT ON COLUMN database_instances.max_tenants IS 'Optional capacity limit when placing new schools';

-- ---- tenant_placements ---------------------------------------------------------
-- Where each school's data lives: which instance and which schema. Every request
-- for a school routes through the one active placement. A move (rebalancing, or
-- to another country's server) prepares a provisioning placement while the active
-- one keeps serving, then switches; the old one is retired, kept as history.
CREATE TABLE tenant_placements (
    id UUID NOT NULL DEFAULT uuidv7() CONSTRAINT pk_tenant_placements PRIMARY KEY,
    tenant_id UUID NOT NULL CONSTRAINT fk_tenant_placements__tenants REFERENCES tenants (id),
    database_instance_id UUID NOT NULL CONSTRAINT fk_tenant_placements__database_instances REFERENCES database_instances (id),
    -- Derived from the school code at onboarding (dps-rkpuram -> tenant_dps_rkpuram)
    -- but stored, so routing never depends on recomputing it.
    schema_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'provisioning',
    activated_at TIMESTAMPTZ,
    retired_at TIMESTAMPTZ,

    -- Audit: who (users.id) and when. No deleted_at: placement history stays.
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID,
    version INTEGER NOT NULL DEFAULT 0,

    -- Same rule the sanketa-db tooling uses to find school schemas.
    CONSTRAINT ck_tenant_placements__schema_name CHECK (schema_name ~ '^tenant_[a-z0-9_]{1,55}$'),
    -- provisioning: being created/copied, never routed to | active: live |
    -- retired: old location after a move (or an abandoned move).
    CONSTRAINT ck_tenant_placements__status CHECK (status IN ('provisioning', 'active', 'retired')),
    CONSTRAINT ck_tenant_placements__active_has_activated_at CHECK (status <> 'active' OR activated_at IS NOT NULL),
    CONSTRAINT ck_tenant_placements__provisioning_not_activated CHECK (status <> 'provisioning' OR activated_at IS NULL),
    CONSTRAINT ck_tenant_placements__retired_at CHECK ((status = 'retired') = (retired_at IS NOT NULL)),
    CONSTRAINT ck_tenant_placements__retired_after_activated CHECK (retired_at >= activated_at)
);

-- Exactly one place to route a school to.
CREATE UNIQUE INDEX uq_tenant_placements__active ON tenant_placements (tenant_id) WHERE status = 'active';
-- One move at a time.
CREATE UNIQUE INDEX uq_tenant_placements__provisioning
ON tenant_placements (tenant_id) WHERE status = 'provisioning';
-- Two schools never share a schema; also serves "schools on this instance".
CREATE UNIQUE INDEX uq_tenant_placements__instance_schema
ON tenant_placements (database_instance_id, schema_name) WHERE status <> 'retired';

CREATE TRIGGER tg_tenant_placements__updated_at BEFORE UPDATE ON tenant_placements
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE tenant_placements IS 'Which instance and schema each school lives on; one active placement per school';
COMMENT ON COLUMN tenant_placements.schema_name IS 'School schema, e.g. tenant_dps_rkpuram (tenant_ + code with - as _)';
COMMENT ON COLUMN tenant_placements.status IS 'provisioning (never routed to) | active (live) | retired (after a move)';
