-- e2e fixture: tenant tables with a FK and its indexes.
CREATE TABLE classes (
    id BIGINT GENERATED ALWAYS AS IDENTITY,
    code TEXT NOT NULL,
    title TEXT NOT NULL,
    CONSTRAINT pk_classes PRIMARY KEY (id),
    CONSTRAINT uq_classes__code UNIQUE (code)
);

CREATE TABLE students (
    id BIGINT GENERATED ALWAYS AS IDENTITY,
    public_id UUID NOT NULL DEFAULT uuidv7(),
    class_id BIGINT NOT NULL,
    admission_no TEXT NOT NULL,
    full_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT pk_students PRIMARY KEY (id),
    CONSTRAINT uq_students__public_id UNIQUE (public_id),
    CONSTRAINT uq_students__admission_no UNIQUE (admission_no),
    CONSTRAINT fk_students__classes FOREIGN KEY (class_id) REFERENCES classes (id)
);

CREATE INDEX ix_students__class_id ON students (class_id);
CREATE INDEX ix_students__full_name ON students (lower(full_name));
