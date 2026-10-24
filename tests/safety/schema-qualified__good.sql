-- expect: none
-- Placeholders and table-qualified columns (tenant_* tables) are fine.
GRANT USAGE ON SCHEMA ${flyway:defaultSchema} TO ${app_role};
CREATE TABLE ${flyway:defaultSchema}.memos (
    id UUID NOT NULL DEFAULT uuidv7(),
    CONSTRAINT pk_memos PRIMARY KEY (id)
);
CREATE OR REPLACE VIEW v_tenant_db AS
SELECT tenant_database_mapping.schema_name FROM tenant_database_mapping;
-- a comment mentioning global.users is ignored
COMMENT ON VIEW v_tenant_db IS 'see public.foo';
