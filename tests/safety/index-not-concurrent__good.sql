-- expect: none
-- New table in the same file: a plain index is fine.
CREATE TABLE guardians (
    id BIGINT GENERATED ALWAYS AS IDENTITY,
    email TEXT NOT NULL,
    CONSTRAINT pk_guardians PRIMARY KEY (id)
);
CREATE UNIQUE INDEX uq_guardians__email ON guardians (lower(email));
