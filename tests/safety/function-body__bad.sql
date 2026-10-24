-- expect: schema-qualified type-choice
-- expect-not: destructive
CREATE OR REPLACE FUNCTION f() RETURNS void LANGUAGE plpgsql AS $fn$
DECLARE t TIMESTAMP;
BEGIN
    PERFORM 1 FROM global.users;
END;
$fn$;
