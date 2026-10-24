-- expect: fk-without-index
CREATE TABLE enrolments (
    id BIGINT GENERATED ALWAYS AS IDENTITY,
    student_id BIGINT NOT NULL REFERENCES students (id),
    course_id BIGINT NOT NULL,
    CONSTRAINT pk_enrolments PRIMARY KEY (id),
    CONSTRAINT fk_enrolments__courses FOREIGN KEY (course_id) REFERENCES courses (id)
);
-- Index exists but course_id is not its leading column.
CREATE INDEX ix_enrolments__student_id__course_id ON enrolments (student_id, course_id);
