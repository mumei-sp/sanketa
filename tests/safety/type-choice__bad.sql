-- expect: type-choice
CREATE TABLE fees (
    id BIGSERIAL,
    paid_at TIMESTAMP,
    due_at TIMESTAMP WITHOUT TIME ZONE,
    amount MONEY,
    rate DOUBLE PRECISION,
    code VARCHAR(10),
    CONSTRAINT pk_fees PRIMARY KEY (id)
);
CREATE TYPE fee_status AS ENUM ('due', 'paid');
