-- e2e fixture: index on an existing table, built concurrently (see .conf).
DROP INDEX CONCURRENTLY IF EXISTS ix_students__roll_no;
CREATE INDEX CONCURRENTLY ix_students__roll_no ON students (roll_no);
