-- e2e fixture: a global table.
CREATE TABLE schools (
    id UUID NOT NULL DEFAULT uuidv7(),
    code TEXT NOT NULL,
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT pk_schools PRIMARY KEY (id),
    CONSTRAINT uq_schools__code UNIQUE (code),
    CONSTRAINT ck_schools__code_len CHECK (char_length(code) <= 32)
);
