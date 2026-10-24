-- expect: none
ALTER TABLE students ADD CONSTRAINT ck_students__nickname_nn CHECK (nickname IS NOT NULL) NOT VALID;
