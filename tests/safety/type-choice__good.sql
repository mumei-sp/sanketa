-- expect: none
CREATE TABLE payments (
    id BIGINT GENERATED ALWAYS AS IDENTITY,
    paid_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
    due_at TIMESTAMP WITH TIME ZONE,
    amount NUMERIC(19, 4) NOT NULL,
    currency CHAR(3) NOT NULL,
    status TEXT NOT NULL,
    CONSTRAINT pk_payments PRIMARY KEY (id),
    CONSTRAINT ck_payments__status CHECK (status IN ('due', 'paid', 'serial varchar(3) money'))
);
