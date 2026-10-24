-- expect: none
-- Has a sibling .conf with executeInTransaction=false.
DROP INDEX CONCURRENTLY IF EXISTS ix_students__last_name;
CREATE INDEX CONCURRENTLY ix_students__last_name ON students (last_name);
