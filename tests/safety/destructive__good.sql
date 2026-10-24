-- expect: none
-- Dropping a constraint/default or renaming a constraint is not destructive.
ALTER TABLE students DROP CONSTRAINT ck_students__old, ALTER COLUMN nickname DROP DEFAULT;
ALTER TABLE students RENAME CONSTRAINT ck_a TO ck_students__a;
COMMENT ON TABLE students IS 'DROP TABLE in a string is fine';
