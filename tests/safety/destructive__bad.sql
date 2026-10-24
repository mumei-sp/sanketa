-- expect: destructive
DROP TABLE IF EXISTS legacy_marks;
ALTER TABLE students DROP COLUMN middle_name;
ALTER TABLE students RENAME COLUMN dob TO date_of_birth;
ALTER TABLE students RENAME TO pupils;
ALTER TABLE students ALTER COLUMN admission_no TYPE BIGINT;
