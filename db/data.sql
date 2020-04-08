INSERT INTO SystemUser VALUES
  (1, 'admin', '123456'),
  (2, 'marcus', 'marcus'),
  (3, 'user', 'nopassword'),
  (4, 'iskandar', 'zulqarnayn');

INSERT INTO SystemGroup VALUES
  (1, 'admins'),
  (2, 'users'),
  (3, 'guests');

INSERT INTO GroupUser VALUES
  (1, 1),
  (2, 2),
  (2, 3),
  (2, 4);

INSERT INTO Country VALUES
  (1, 'Soviet Union'),
  (2, 'People''s Republic of China'),
  (3, 'Vietnam'),
  (4, 'Cuba');

INSERT INTO City VALUES
  (1, 'Beijing', 2),
  (2, 'Wuhan', 2),
  (3, 'Kiev', 1),
  (4, 'Havana', 4),
  (5, 'Hanoi', 3),
  (6, 'Kaliningrad', 1);
