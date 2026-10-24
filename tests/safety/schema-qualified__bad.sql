-- expect: schema-qualified

CREATE TABLE global.audit_events (
    id BIGINT GENERATED ALWAYS AS IDENTITY,
    CONSTRAINT pk_audit_events PRIMARY KEY (id)
);
CREATE TABLE notes (
    id BIGINT DEFAULT public.next_id(),
    CONSTRAINT pk_notes PRIMARY KEY (id)
);
SELECT * FROM tenant_school_001.students;
