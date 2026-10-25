-- =============================================================================
-- V1.1 :: global :: functions
-- -----------------------------------------------------------------------------
-- Shared functions used by every later file.
-- Pre-release: edited in place (rebuild with `mise run dev:reset --yes`). Frozen
-- at the release tag (db-release-N); later changes are new `mise run db:new` files.
-- Files run in version order: a table may only reference earlier files.
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
