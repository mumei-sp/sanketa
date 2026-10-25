-- Runs after every `migrate` on every schema (global and each tenant).
-- Keeps the app role's grants complete, including for objects created by the
-- migration that just ran. Idempotent.
GRANT USAGE ON SCHEMA ${flyway:defaultSchema} TO ${app_role};
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA ${flyway:defaultSchema} TO ${app_role};
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA ${flyway:defaultSchema} TO ${app_role};
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA ${flyway:defaultSchema} TO ${app_role};

-- No hard deletes by default: rows are soft-deleted or closed, so an app bug can't
-- destroy people, schools or history. DELETE only where erasure needs it (DPDP).
-- Add a table here only when it must be hard-deletable.
REVOKE DELETE ON ALL TABLES IN SCHEMA ${flyway:defaultSchema} FROM ${app_role};
DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['user_profiles', 'user_identity_documents'] LOOP
        IF to_regclass(format('%I.%I', '${flyway:defaultSchema}', t)) IS NOT NULL THEN
            EXECUTE format('GRANT DELETE ON %I.%I TO %I', '${flyway:defaultSchema}', t, '${app_role}');
        END IF;
    END LOOP;
END $$;

-- Never Flyway's own bookkeeping: the app must not rewrite which migrations ran.
-- (The seed history table only exists where seeds were loaded.)
REVOKE ALL ON ${flyway:defaultSchema}.flyway_schema_history FROM ${app_role};
DO $$
BEGIN
    IF to_regclass('${flyway:defaultSchema}.flyway_seed_history') IS NOT NULL THEN
        REVOKE ALL ON ${flyway:defaultSchema}.flyway_seed_history FROM ${app_role};
    END IF;
END $$;
