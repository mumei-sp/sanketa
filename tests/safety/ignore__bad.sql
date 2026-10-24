-- expect: bad-ignore index-not-concurrent
-- safety:ignore index-not-concurrent
-- safety:ignore no-such-rule because
CREATE INDEX ix_students__house ON students (house);
