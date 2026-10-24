-- expect: none
CREATE TABLE grades (
    id BIGINT GENERATED ALWAYS AS IDENTITY,
    student_id BIGINT NOT NULL,
    term_id BIGINT NOT NULL,
    exam_id BIGINT NOT NULL,
    CONSTRAINT pk_grades PRIMARY KEY (id),
    CONSTRAINT uq_grades__term_id__student_id UNIQUE (term_id, student_id),
    CONSTRAINT fk_grades__students FOREIGN KEY (student_id) REFERENCES students (id),
    CONSTRAINT fk_grades__terms FOREIGN KEY (term_id) REFERENCES terms (id),
    CONSTRAINT fk_grades__exams FOREIGN KEY (exam_id) REFERENCES exams (id)
);
CREATE INDEX ix_grades__student_id ON grades (student_id);
CREATE INDEX ix_grades__exam_id ON grades USING btree (exam_id DESC);
