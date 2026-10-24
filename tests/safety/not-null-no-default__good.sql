-- expect: none
ALTER TABLE students ADD COLUMN is_boarder BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN nickname TEXT;
