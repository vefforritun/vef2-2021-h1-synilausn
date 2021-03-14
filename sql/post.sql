-- TODO hér er hætta á ferðum!
-- Ef við keyrum þetta á production grunn er þekktur admin notandi til
-- Ættum að gera öðruvísi en...
-- Sjá readme í /src/tests/

INSERT INTO
  users (username, email, password, admin)
VALUES
  ('admin', 'admin@example.org', '$2b$04$5XvV1IIubvtw.RI3dMmDPumdpr9GQlUM.yWVbUxaRqu/3exbw3mke', true);
