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
