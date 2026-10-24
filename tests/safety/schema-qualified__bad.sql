-- expect: schema-qualified

CREATE TABLE global.audit_events (
    id UUID NOT NULL DEFAULT uuidv7(),
    CONSTRAINT pk_audit_events PRIMARY KEY (id)
);
CREATE TABLE notes (
    id UUID DEFAULT public.next_id(),
    CONSTRAINT pk_notes PRIMARY KEY (id)
);
SELECT * FROM tenant_school_001.students;
