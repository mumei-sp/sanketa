-- e2e fixture: UNSAFE on purpose (NOT NULL without DEFAULT on an existing table).
ALTER TABLE students ADD COLUMN email TEXT NOT NULL;
