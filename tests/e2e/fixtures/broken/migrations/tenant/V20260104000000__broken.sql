-- e2e fixture: BROKEN on purpose. The table is created, then the file fails;
-- the whole file must roll back and stop the run.
CREATE TABLE broken_partial (
    id UUID NOT NULL DEFAULT uuidv7(),
    CONSTRAINT pk_broken_partial PRIMARY KEY (id)
);

INSERT INTO no_such_table (id) VALUES (uuidv7());
