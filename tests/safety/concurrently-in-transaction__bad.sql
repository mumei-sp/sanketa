-- expect: concurrently-in-transaction
-- expect-not: index-not-concurrent
CREATE INDEX CONCURRENTLY ix_students__first_name ON students (first_name);
