-- expect: constraint-not-valid
-- expect-not: fk-without-index
ALTER TABLE students ADD CONSTRAINT ck_students__dob CHECK (dob > DATE '1990-01-01');
ALTER TABLE students ADD CONSTRAINT fk_students__houses FOREIGN KEY (house_id) REFERENCES houses (id);
CREATE INDEX CONCURRENTLY ix_students__house_id ON students (house_id);
