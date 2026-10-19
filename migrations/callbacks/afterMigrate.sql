-- Runs after every `migrate` on every schema (global and each tenant).
-- Keeps the app role's DML grants complete, including for objects created
-- by the migration that just ran. Idempotent.
GRANT USAGE ON SCHEMA ${flyway:defaultSchema} TO ${app_role};
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA ${flyway:defaultSchema} TO ${app_role};
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA ${flyway:defaultSchema} TO ${app_role};
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA ${flyway:defaultSchema} TO ${app_role};
