-- expect: concurrently-mixed
-- expect-not: concurrently-in-transaction
CREATE INDEX CONCURRENTLY ix_teachers__last_name ON teachers (last_name);
ALTER TABLE teachers ADD COLUMN nickname TEXT;
