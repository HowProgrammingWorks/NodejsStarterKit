INSERT INTO SystemUser VALUES
  (1, 'admin', '$scrypt$N=32768,r=8,p=1,maxmem=67108864$XcD5Zfk+BVIGEyiksBjjy9LL42AFOOqlhEB650woECs$3CNOs25gOVV8AZMYQc6bFnrYdM+3xP996shxJEq5LxGt4gs1g9cocZmi/SYg/H16egY4j7qxTD/oygyEI80cgg'),
  (2, 'marcus', '67108864$BmPFipv2QU9kpC6S/wEBCfw3/BYijrADK07y8nP+Gn0$W291hVMbm9qHUJbCOql1uy3cGBYqeig8Y7F2j+EZGInle/o9mq84pw0A9A/eFVWU6mI9eTrJiRFS3DQoc3D8Jw'),
  (3, 'user', '$scrypt$N=32768,r=8,p=1,maxmem=67108864$z5uf2xGdpgq5v2sZbgh36QoZG9CDmGmJUNJkrs1zs2w$3s3x22k4Td0jkup4WduFQGFVjrFKHjN1WV9k8/Bh3DKI58Wrlo/D4Js9j/DiskwI8rltDd8pF15JylivFu2T0g'),
  (4, 'iskandar', '$scrypt$N=32768,r=8,p=1,maxmem=67108864$EfcPTou2sTms7Esp4lsbJddN2RLAqqZUhP6sflwT7KU$FJiY0ad+qeNtZyFa0sXfQfeSIDS5HYS8wMk2/gtUlqy5vBddzVgKQYDqF5lKMNCm7IpOaYUZtRv7BQbxbVgkYg');

-- Examples login/password
-- admin/123456
-- marcus/marcus
-- user/nopassword
-- iskandar/zulqarnayn

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
