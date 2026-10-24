-- expect: none
-- safety:ignore fk-without-index ix_students__house_id was built CONCURRENTLY in an earlier release
ALTER TABLE students
    ADD CONSTRAINT fk_students__houses FOREIGN KEY (house_id) REFERENCES houses (id) NOT VALID;
ALTER TABLE students VALIDATE CONSTRAINT fk_students__clubs;
