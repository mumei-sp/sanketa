-- =============================================================================
-- V1.3 :: global :: schools
-- -----------------------------------------------------------------------------
-- Schools (tenants) and who belongs to which.
-- Pre-release: edited in place (rebuild with `mise run dev:reset --yes`). Frozen
-- at the release tag (db-release-N); later changes are new `mise run db:new` files.
-- Files run in version order: a table may only reference earlier files.
-- =============================================================================

-- ---- tenants -------------------------------------------------------------------
-- One school campus (each branch of a chain is its own tenant, as each has its own
-- UDISE+ code, admissions and staff). Only what's needed to identify, route and
-- control a school lives here; its details (address, board, logo, settings) live
-- in the school's own schema. Chains can later be grouped via an organization.
CREATE TABLE tenants (
    id UUID NOT NULL DEFAULT uuidv7() CONSTRAINT pk_tenants PRIMARY KEY,
    -- Readable, permanent slug for URLs, logs and support: dps-rkpuram.
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    -- Government school code (11 digits); optional for pre-schools / new schools.
    udise_code TEXT,
    status TEXT NOT NULL DEFAULT 'onboarding',
    -- Where the school is: decides data location (e.g. Gulf CBSE schools) and the
    -- local time for attendance cut-offs and scheduled messages.
    country_code TEXT NOT NULL DEFAULT 'IN',
    timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',

    -- Audit: who (users.id) and when. No deleted_at: a school is closed, never
    -- deleted (its records have legal retention periods).
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID,
    version INTEGER NOT NULL DEFAULT 0,

    -- Across closed schools too: a code is never handed to another school.
    CONSTRAINT uq_tenants__code UNIQUE (code),
    CONSTRAINT uq_tenants__udise_code UNIQUE (udise_code),
    CONSTRAINT ck_tenants__code_length CHECK (char_length(code) BETWEEN 3 AND 30),
    -- Lower-case letters and digits, '-' only between them: no 'dps-', 'dps--rk'.
    CONSTRAINT ck_tenants__code_format CHECK (code ~ '^[a-z][a-z0-9]*(-[a-z0-9]+)*$'),
    CONSTRAINT ck_tenants__name_length CHECK (char_length(name) BETWEEN 3 AND 200),
    CONSTRAINT ck_tenants__name_trimmed CHECK (name = btrim(name)),
    CONSTRAINT ck_tenants__udise_code CHECK (udise_code ~ '^[0-9]{11}$'),
    -- UDISE+ is India's school register; schools abroad have no such code.
    CONSTRAINT ck_tenants__udise_only_in CHECK (udise_code IS NULL OR country_code = 'IN'),
    -- onboarding: being set up, not usable | active | suspended: login blocked
    -- (e.g. unpaid) | closed: offboarded, data retained.
    CONSTRAINT ck_tenants__status CHECK (status IN ('onboarding', 'active', 'suspended', 'closed')),
    CONSTRAINT ck_tenants__country_code CHECK (country_code ~ '^[A-Z]{2}$'),
    -- IANA name shape (Asia/Kolkata); the app checks it against the real zone list.
    CONSTRAINT ck_tenants__timezone CHECK (timezone ~ '^[A-Za-z]+(/[A-Za-z0-9_+-]+)+$')
);

CREATE TRIGGER tg_tenants__updated_at BEFORE UPDATE ON tenants
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE tenants IS 'One school campus: identity, routing and lifecycle only; details live in its schema';
COMMENT ON COLUMN tenants.code IS 'Permanent readable slug, e.g. dps-rkpuram; used in URLs and logs, never reused';
COMMENT ON COLUMN tenants.udise_code IS 'UDISE+ government school code (11 digits), optional';
COMMENT ON COLUMN tenants.status IS 'onboarding | active | suspended | closed';
COMMENT ON COLUMN tenants.timezone IS 'IANA time zone for attendance cut-offs and scheduled messages';

-- ---- tenant_memberships --------------------------------------------------------
-- Which schools a person belongs to: the first lookup after login. A student,
-- parent, teacher or admin each has one per school. What they are at that school
-- (student, teacher, principal, ...) lives in the school's own schema, since one
-- person can be a teacher at one school and a parent at another.
CREATE TABLE tenant_memberships (
    id UUID NOT NULL DEFAULT uuidv7() CONSTRAINT pk_tenant_memberships PRIMARY KEY,
    user_id UUID NOT NULL CONSTRAINT fk_tenant_memberships__users REFERENCES users (id),
    tenant_id UUID NOT NULL CONSTRAINT fk_tenant_memberships__tenants REFERENCES tenants (id),
    status TEXT NOT NULL DEFAULT 'active',
    -- When they left (graduated, transferred, resigned); set with status = ended.
    ended_at TIMESTAMPTZ,

    -- Audit: who (users.id) and when. Ended memberships stay as history; rejoining
    -- creates a new row.
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID,
    version INTEGER NOT NULL DEFAULT 0,

    -- active | suspended: blocked by the school | ended: left the school.
    CONSTRAINT ck_tenant_memberships__status CHECK (status IN ('active', 'suspended', 'ended')),
    CONSTRAINT ck_tenant_memberships__ended_at CHECK ((status = 'ended') = (ended_at IS NOT NULL))
);

-- One current membership per person per school; also serves "my schools" at login.
CREATE UNIQUE INDEX uq_tenant_memberships__user_tenant
ON tenant_memberships (user_id, tenant_id) WHERE status <> 'ended';
-- "This school's members".
CREATE INDEX ix_tenant_memberships__tenant_id ON tenant_memberships (tenant_id) WHERE status <> 'ended';

CREATE TRIGGER tg_tenant_memberships__updated_at BEFORE UPDATE ON tenant_memberships
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE tenant_memberships IS 'Which schools each person belongs to; roles live in the school schema';
COMMENT ON COLUMN tenant_memberships.status IS 'active | suspended (blocked by the school) | ended (left)';
COMMENT ON COLUMN tenant_memberships.ended_at IS 'When the person left the school; set exactly when status = ended';
