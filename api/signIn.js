async ({ login, password }) => {
  const [user] = await application.db.select(
    'SystemUser', ['Password'], { login }
  );
  const hash = user && user.Password || api.security.defaultHash;
  const verified = await api.security.validatePassword(password, hash);
  if (!user || !verified) throw new Error('Incorrect login or password');
  console.log(`Logged user: ${login}`);
  return { result: 'success' };
};
