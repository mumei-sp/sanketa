-- e2e fixture: idempotent dev seed.
INSERT INTO classes (code, title)
VALUES ('C1', 'Class 1')
ON CONFLICT (code) DO NOTHING;

INSERT INTO students (class_id, admission_no, full_name)
SELECT
    c.id,
    'A-001' AS admission_no,
    'Asha Rao' AS full_name
FROM classes AS c
WHERE c.code = 'C1'
ON CONFLICT (admission_no) DO NOTHING;
