INSERT INTO SystemUser (Login, Password) VALUES
  ('admin', '$scrypt$N=32768,r=8,p=1,maxmem=67108864$XcD5Zfk+BVIGEyiksBjjy9LL42AFOOqlhEB650woECs$3CNOs25gOVV8AZMYQc6bFnrYdM+3xP996shxJEq5LxGt4gs1g9cocZmi/SYg/H16egY4j7qxTD/oygyEI80cgg'),
  ('marcus', '$scrypt$N=32768,r=8,p=1,maxmem=67108864$aGKuH5D2zndi6zFu74/rEj5m3u5kRh5b+QXYfKrhAU8$257up1h/3R9CoxH2382zX0+kbxRPrd+GwzJIxYI+K+gBYCcLrA8Z6wv7lSwLElfbDTJRgUhQJFhMT1tpp5AJxw'),
  ('user', '$scrypt$N=32768,r=8,p=1,maxmem=67108864$z5uf2xGdpgq5v2sZbgh36QoZG9CDmGmJUNJkrs1zs2w$3s3x22k4Td0jkup4WduFQGFVjrFKHjN1WV9k8/Bh3DKI58Wrlo/D4Js9j/DiskwI8rltDd8pF15JylivFu2T0g'),
  ('iskandar', '$scrypt$N=32768,r=8,p=1,maxmem=67108864$EfcPTou2sTms7Esp4lsbJddN2RLAqqZUhP6sflwT7KU$FJiY0ad+qeNtZyFa0sXfQfeSIDS5HYS8wMk2/gtUlqy5vBddzVgKQYDqF5lKMNCm7IpOaYUZtRv7BQbxbVgkYg');

-- Examples login/password
-- admin/123456
-- marcus/marcus
-- user/nopassword
-- iskandar/zulqarnayn

INSERT INTO SystemGroup (Name) VALUES
  ('admins'),
  ('users'),
  ('guests');

INSERT INTO GroupUser (GroupId, UserId) VALUES
  (1, 1),
  (2, 2),
  (2, 3),
  (2, 4);

INSERT INTO Country (Name) VALUES
  ('Soviet Union'),
  ('People''s Republic of China'),
  ('Vietnam'),
  ('Cuba');

INSERT INTO City (Name, CountryId) VALUES
  ('Beijing', 2),
  ('Wuhan', 2),
  ('Kiev', 1),
  ('Havana', 4),
  ('Hanoi', 3),
  ('Kaliningrad', 1);
