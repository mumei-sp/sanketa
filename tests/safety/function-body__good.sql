-- expect: none
-- Semicolons and DDL-looking text inside a function body are not statements.
CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    -- DROP TABLE students;  (comment in body)
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;
