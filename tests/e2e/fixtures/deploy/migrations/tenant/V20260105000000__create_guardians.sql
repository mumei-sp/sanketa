-- e2e fixture: shipped through deploy:apply.
CREATE TABLE guardians (
    id UUID NOT NULL DEFAULT uuidv7(),
    student_id UUID NOT NULL,
    full_name TEXT NOT NULL,
    CONSTRAINT pk_guardians PRIMARY KEY (id),
    CONSTRAINT fk_guardians__students FOREIGN KEY (student_id) REFERENCES students (id)
);

CREATE INDEX ix_guardians__student_id ON guardians (student_id);
