-- expect: index-not-concurrent
CREATE INDEX ix_students__last_name ON students (last_name);
