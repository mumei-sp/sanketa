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
    id UUID NOT NULL DEFAULT uuidv7() CONSTRAINT pk_users PRIMARY KEY,
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

    -- Across deleted rows too: a login ID is never handed to someone else.
    CONSTRAINT uq_users__login_id UNIQUE (login_id),
    CONSTRAINT uq_users__keycloak_user_id UNIQUE (keycloak_user_id),
    -- Length and format are separate rules so the app can say exactly what's wrong.
    CONSTRAINT ck_users__login_id_length CHECK (char_length(login_id) BETWEEN 6 AND 20),
    -- Lower-case only, so 'Ravi.K' and 'ravi.k' can never both exist. Starts with a
    -- letter, so one login box can tell a login ID from a phone (+91...) or email (@).
    -- '.' and '_' only between letters/digits: no 'ravi.', 'ravi..k' or '.ravi'.
    CONSTRAINT ck_users__login_id_format CHECK (login_id ~ '^[a-z][a-z0-9]*([._][a-z0-9]+)*$'),
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

-- ---- user_profiles -------------------------------------------------------------
-- Personal details of each person, 1-to-1 with users (shares its id). Kept apart
-- so identity lookups stay small and personal data can be erased (DPDP Act)
-- without losing the identity row. Create it in the same transaction as the user.
-- Government IDs live in user_identity_documents. School-reporting data (religion,
-- social category, mother tongue) belongs to each school's records, not here.
CREATE TABLE user_profiles (
    -- Primary key and foreign key at once: one profile per user, only for real users.
    user_id UUID NOT NULL CONSTRAINT pk_user_profiles PRIMARY KEY CONSTRAINT fk_user_profiles__users REFERENCES users (id),

    -- As on official records. Indian names don't split reliably (single names,
    -- initials), so the parts are optional and used for sorting when known.
    full_name TEXT NOT NULL,
    given_name TEXT,
    family_name TEXT,
    preferred_name TEXT,

    date_of_birth DATE,
    gender TEXT,
    blood_group TEXT,

    -- Extra contact points; the login phone and email live in users.
    alternate_phone TEXT,
    -- E.g. a family's shared email: notifications only, never used to log in.
    contact_email TEXT,
    preferred_contact_method TEXT NOT NULL DEFAULT 'whatsapp',

    -- Home address; moves with the person, not the school.
    address_line1 TEXT,
    address_line2 TEXT,
    locality TEXT,
    city TEXT,
    district TEXT,
    state_code TEXT,
    postal_code TEXT,
    country_code TEXT NOT NULL DEFAULT 'IN',

    -- Storage object key; the app builds the (signed) URL.
    photo_key TEXT,

    -- Audit: who (users.id) and when. No deleted_at: lives and dies with its user.
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID,
    version INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT ck_user_profiles__full_name_length CHECK (char_length(full_name) BETWEEN 1 AND 150),
    -- No stray spaces, so the same name can't be stored two ways.
    CONSTRAINT ck_user_profiles__full_name_trimmed CHECK (full_name = btrim(full_name)),
    CONSTRAINT ck_user_profiles__given_name_length CHECK (char_length(given_name) BETWEEN 1 AND 100),
    CONSTRAINT ck_user_profiles__family_name_length CHECK (char_length(family_name) BETWEEN 1 AND 100),
    CONSTRAINT ck_user_profiles__preferred_name_length CHECK (char_length(preferred_name) BETWEEN 1 AND 100),

    -- Not in the future is checked by the app (a CHECK can't safely use today's date).
    CONSTRAINT ck_user_profiles__date_of_birth CHECK (date_of_birth >= DATE '1900-01-01'),
    -- Aligned with UDISE+ (national school data system) plus "not disclosed".
    CONSTRAINT ck_user_profiles__gender CHECK (gender IN ('male', 'female', 'transgender', 'not_disclosed')),
    CONSTRAINT ck_user_profiles__blood_group CHECK (
        blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')
    ),

    -- Same rules as users.phone / users.email.
    CONSTRAINT ck_user_profiles__alternate_phone_length CHECK (char_length(alternate_phone) BETWEEN 9 AND 16),
    CONSTRAINT ck_user_profiles__alternate_phone_format CHECK (alternate_phone ~ '^\+[1-9][0-9]+$'),
    CONSTRAINT ck_user_profiles__contact_email_length CHECK (char_length(contact_email) BETWEEN 6 AND 320),
    CONSTRAINT ck_user_profiles__contact_email_format CHECK (
        contact_email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
    ),
    CONSTRAINT ck_user_profiles__preferred_contact_method CHECK (
        preferred_contact_method IN ('whatsapp', 'sms', 'call', 'email')
    ),

    CONSTRAINT ck_user_profiles__address_line1_length CHECK (char_length(address_line1) BETWEEN 1 AND 200),
    CONSTRAINT ck_user_profiles__address_line2_length CHECK (char_length(address_line2) BETWEEN 1 AND 200),
    CONSTRAINT ck_user_profiles__locality_length CHECK (char_length(locality) BETWEEN 1 AND 100),
    CONSTRAINT ck_user_profiles__city_length CHECK (char_length(city) BETWEEN 1 AND 100),
    CONSTRAINT ck_user_profiles__district_length CHECK (char_length(district) BETWEEN 1 AND 100),
    -- ISO 3166: country 'IN', state 'IN-KA' (state must belong to the country).
    CONSTRAINT ck_user_profiles__country_code CHECK (country_code ~ '^[A-Z]{2}$'),
    CONSTRAINT ck_user_profiles__state_code CHECK (
        state_code ~ '^[A-Z]{2}-[A-Z0-9]{1,3}$' AND left(state_code, 2) = country_code
    ),
    CONSTRAINT ck_user_profiles__postal_code_length CHECK (char_length(postal_code) BETWEEN 3 AND 10),
    -- Indian PIN code: 6 digits, not starting with 0.
    CONSTRAINT ck_user_profiles__postal_code_in CHECK (
        country_code <> 'IN' OR postal_code ~ '^[1-9][0-9]{5}$'
    ),

    CONSTRAINT ck_user_profiles__photo_key_length CHECK (char_length(photo_key) BETWEEN 1 AND 500)
);

CREATE TRIGGER tg_user_profiles__updated_at BEFORE UPDATE ON user_profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE user_profiles IS 'Personal details of each person (1-to-1 with users); erasable under DPDP';
COMMENT ON COLUMN user_profiles.full_name IS 'Name as on official records; required';
COMMENT ON COLUMN user_profiles.gender IS 'male | female | transgender | not_disclosed (UDISE+)';
COMMENT ON COLUMN user_profiles.contact_email IS 'Notification address, may be shared by a family; never a login';
COMMENT ON COLUMN user_profiles.preferred_contact_method IS 'whatsapp | sms | call | email';
COMMENT ON COLUMN user_profiles.state_code IS 'ISO 3166-2, e.g. IN-KA; must belong to country_code';
COMMENT ON COLUMN user_profiles.postal_code IS 'For India a 6-digit PIN code';
COMMENT ON COLUMN user_profiles.photo_key IS 'Object storage key; the app builds the URL';

-- ---- user_identity_documents ---------------------------------------------------
-- Government IDs (Aadhaar, PAN, driving licence, ...), all optional: Aadhaar can't
-- be made mandatory for admission (Supreme Court, 2018). Numbers are never stored
-- readable: fabric normalises and validates them, encrypts them with Vault Transit,
-- and keeps a keyed hash (to find duplicates without decrypting) and the last 4
-- characters (for display: XXXX XXXX 1234).
CREATE TABLE user_identity_documents (
    id UUID NOT NULL DEFAULT uuidv7() CONSTRAINT pk_user_identity_documents PRIMARY KEY,
    user_id UUID NOT NULL CONSTRAINT fk_user_identity_documents__users REFERENCES users (id),
    document_type TEXT NOT NULL,

    -- Vault Transit ciphertext of the normalised number (no spaces, upper-case).
    number_encrypted TEXT NOT NULL,
    -- HMAC-SHA256 (hex) of the normalised number with a secret key: same number, same hash.
    number_hash TEXT NOT NULL,
    number_last4 TEXT NOT NULL,

    -- When the number was checked (e.g. via DigiLocker or by a school officer).
    verified_at TIMESTAMPTZ,
    -- Driving licence and passport only.
    expires_on DATE,
    -- Storage object key of an uploaded copy, if any.
    scan_key TEXT,

    -- Audit: who (users.id) and when. A replaced document is soft-deleted.
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID,
    deleted_at TIMESTAMPTZ,
    version INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT ck_user_identity_documents__document_type CHECK (
        document_type IN ('aadhaar', 'pan', 'driving_licence', 'passport', 'voter_id', 'apaar')
    ),
    -- Guards against a readable number being saved by mistake.
    CONSTRAINT ck_user_identity_documents__number_encrypted CHECK (number_encrypted ~ '^vault:v[0-9]+:'),
    CONSTRAINT ck_user_identity_documents__number_hash CHECK (number_hash ~ '^[0-9a-f]{64}$'),
    CONSTRAINT ck_user_identity_documents__number_last4 CHECK (number_last4 ~ '^[0-9A-Z]{4}$'),
    CONSTRAINT ck_user_identity_documents__expires_on CHECK (
        expires_on IS NULL OR document_type IN ('driving_licence', 'passport')
    ),
    CONSTRAINT ck_user_identity_documents__scan_key_length CHECK (char_length(scan_key) BETWEEN 1 AND 500)
);

-- One live document of each type per person.
CREATE UNIQUE INDEX uq_user_identity_documents__user_type
ON user_identity_documents (user_id, document_type) WHERE deleted_at IS NULL;
-- The same number can't belong to two people (e.g. a child admitted twice).
CREATE UNIQUE INDEX uq_user_identity_documents__type_hash
ON user_identity_documents (document_type, number_hash) WHERE deleted_at IS NULL;

CREATE TRIGGER tg_user_identity_documents__updated_at BEFORE UPDATE ON user_identity_documents
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE user_identity_documents IS 'Government IDs per person; numbers encrypted, never readable';
COMMENT ON COLUMN user_identity_documents.document_type IS 'aadhaar | pan | driving_licence | passport | voter_id | apaar';
COMMENT ON COLUMN user_identity_documents.number_encrypted IS 'Vault Transit ciphertext; decrypt only for official exports';
COMMENT ON COLUMN user_identity_documents.number_hash IS 'HMAC-SHA256 hex of the normalised number; finds duplicates';
COMMENT ON COLUMN user_identity_documents.number_last4 IS 'Last 4 characters, for masked display';

-- ---- user_guardians ------------------------------------------------------------
-- Family links between people (parent -> child), kept globally because a family
-- spans schools: siblings at different schools, one parent login showing every
-- child, and DPDP consent for a minor needing their legal guardian. School-specific
-- rules (who may pick up, who gets fee receipts, contact order) live in each school.
CREATE TABLE user_guardians (
    id UUID NOT NULL DEFAULT uuidv7() CONSTRAINT pk_user_guardians PRIMARY KEY,
    guardian_user_id UUID NOT NULL CONSTRAINT fk_user_guardians__guardian_users REFERENCES users (id),
    ward_user_id UUID NOT NULL CONSTRAINT fk_user_guardians__ward_users REFERENCES users (id),
    -- What the guardian is to the ward: 'mother' = guardian is the ward's mother.
    relationship TEXT NOT NULL,
    -- Can give consent for a minor (DPDP); true for parents, not e.g. a pickup uncle.
    is_legal_guardian BOOLEAN NOT NULL DEFAULT FALSE,

    -- Audit: who (users.id) and when. An ended relationship (e.g. custody change)
    -- is soft-deleted, so history stays.
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID,
    deleted_at TIMESTAMPTZ,
    version INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT ck_user_guardians__not_self CHECK (guardian_user_id <> ward_user_id),
    CONSTRAINT ck_user_guardians__relationship CHECK (
        relationship IN ('mother', 'father', 'grandparent', 'sibling', 'relative', 'legal_guardian', 'other')
    ),
    -- A court-appointed / legal guardian always has consent rights.
    CONSTRAINT ck_user_guardians__legal_guardian_flag CHECK (relationship <> 'legal_guardian' OR is_legal_guardian)
);

-- One live link per guardian-child pair; also serves "this parent's children".
CREATE UNIQUE INDEX uq_user_guardians__guardian_ward
ON user_guardians (guardian_user_id, ward_user_id) WHERE deleted_at IS NULL;
-- "This child's guardians".
CREATE INDEX ix_user_guardians__ward_user_id ON user_guardians (ward_user_id) WHERE deleted_at IS NULL;

CREATE TRIGGER tg_user_guardians__updated_at BEFORE UPDATE ON user_guardians
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE user_guardians IS 'Family links (guardian -> ward) across schools; basis for parental consent';
COMMENT ON COLUMN user_guardians.relationship IS 'What the guardian is to the ward (mother = guardian is the mother)';
COMMENT ON COLUMN user_guardians.is_legal_guardian IS 'May consent on behalf of a minor (DPDP Act)';
