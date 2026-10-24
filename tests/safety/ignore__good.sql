-- expect: none
-- safety:ignore index-not-concurrent students is a tiny lookup table (< 100 rows)
CREATE INDEX ix_students__house ON students (house);
