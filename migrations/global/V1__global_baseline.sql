-- =============================================================================
-- V1 :: global :: baseline (Global DB, schema `global`)
-- -----------------------------------------------------------------------------
-- Pre-release: this one file is the whole global schema and is edited in place
-- (rebuild locally with `mise run dev:reset --yes`). Once released (tag
-- db-release-N) it is frozen; every later change is a new `mise run db:new` file.
-- =============================================================================

-- ---- shared: updated_at trigger function --------------------------------------
-- Keeps updated_at correct on every UPDATE, whichever client writes. Attach per table:
--   CREATE TRIGGER tg_<table>__updated_at BEFORE UPDATE ON <table>
--   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE FUNCTION set_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION set_updated_at() IS 'BEFORE UPDATE trigger: sets updated_at to the transaction time';

-- ---- users ---------------------------------------------------------------------
-- One row per person across all schools: every student (from admission, KG
-- included), parent, teacher and admin. A row is an identity, not a login:
-- logging in is a state (status = active) switched on when credentials exist.
-- Keycloak owns credentials; this table owns identity, status and contact points.
-- Personal details (name, date of birth, photo) live in user_profiles.

CREATE TABLE users (
    -- The one ID, used everywhere: joins, APIs, other databases. UUIDv7 is
    -- time-ordered (indexes well) and unguessable (safe to expose).
    id UUID NOT NULL DEFAULT uuidv7(),
    -- Chosen on the sign-up / admission form (required); not tied to any school.
    login_id TEXT NOT NULL,
    -- Null until login is set up; a person without one can never authenticate.
    keycloak_user_id UUID,

    -- Optional contact points, added as people get them. Usable for login only
    -- once verified (enforced by fabric / Keycloak).
    email TEXT,
    email_verified_at TIMESTAMPTZ,
    phone TEXT,
    phone_verified_at TIMESTAMPTZ,

    status TEXT NOT NULL DEFAULT 'provisioned',

    -- Audit: who (users.id) and when. updated_at is kept by the trigger below.
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID,
    deleted_at TIMESTAMPTZ,
    version INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT pk_users PRIMARY KEY (id),
    -- Across deleted rows too: a login ID is never handed to someone else.
    CONSTRAINT uq_users__login_id UNIQUE (login_id),
    CONSTRAINT uq_users__keycloak_user_id UNIQUE (keycloak_user_id),
    -- Length and format are separate rules so the app can say exactly what's wrong.
    CONSTRAINT ck_users__login_id_length CHECK (char_length(login_id) BETWEEN 6 AND 20),
    -- Lower-case only, so 'Ravi.K' and 'ravi.k' can never both exist. Starts with a
    -- letter, so one login box can tell a login ID from a phone (+91...) or email (@).
    CONSTRAINT ck_users__login_id_format CHECK (login_id ~ '^[a-z][a-z0-9._]*$'),
    CONSTRAINT ck_users__status CHECK (status IN ('provisioned', 'active', 'suspended', 'inactive')),
    -- Only a person with a login account can be active.
    CONSTRAINT ck_users__active_has_login CHECK (status <> 'active' OR keycloak_user_id IS NOT NULL),
    -- 6 = shortest real address (a@b.in), 320 = the email standard's maximum.
    CONSTRAINT ck_users__email_length CHECK (char_length(email) BETWEEN 6 AND 320),
    -- Shape only; real validation (and verification) is the app's job.
    CONSTRAINT ck_users__email_format CHECK (email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
    -- E.164: '+' then 8 to 15 digits, any country (India: +91 + 10 digits = 13).
    CONSTRAINT ck_users__phone_length CHECK (char_length(phone) BETWEEN 9 AND 16),
    CONSTRAINT ck_users__phone_format CHECK (phone ~ '^\+[1-9][0-9]+$'),
    CONSTRAINT ck_users__email_verified CHECK (email_verified_at IS NULL OR email IS NOT NULL),
    CONSTRAINT ck_users__phone_verified CHECK (phone_verified_at IS NULL OR phone IS NOT NULL)
);

-- One live account per email, so email login is unambiguous. A family's shared
-- email belongs on the profile as a contact address, not here.
CREATE UNIQUE INDEX uq_users__email ON users (lower(email)) WHERE deleted_at IS NULL;
-- Not unique: parents and children often share one phone (OTP login then
-- offers an account picker).
CREATE INDEX ix_users__phone ON users (phone) WHERE deleted_at IS NULL;

CREATE TRIGGER tg_users__updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE users IS 'Every person across all schools; logging in is a state, credentials live in Keycloak';
COMMENT ON COLUMN users.id IS 'UUIDv7; the only ID, used in joins, APIs and other databases';
COMMENT ON COLUMN users.login_id IS 'Chosen login ID, e.g. ravi.k2014; lower-case, unique forever (never reused)';
COMMENT ON COLUMN users.email IS 'Optional; one live account per email; usable for login only once verified';
COMMENT ON COLUMN users.phone IS 'Optional, E.164 (+919876543210); may be shared by family members';
COMMENT ON COLUMN users.keycloak_user_id IS 'Keycloak user id (sub claim); null until login is set up';
COMMENT ON COLUMN users.status IS 'provisioned (exists, cannot log in) | active | suspended | inactive';
COMMENT ON COLUMN users.deleted_at IS 'Soft delete; set instead of deleting the row';
COMMENT ON COLUMN users.version IS 'Optimistic lock: incremented by the app on every update';
