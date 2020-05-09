async ({ login, password }) => {
  const user = await application.auth.getUser(login);
  const hash = user ? user.password : undefined;
  const verified = await application.security.validatePassword(password, hash);
  if (!user || !verified) throw new Error('Incorrect login or password');
  console.log(`Logged user: ${login}`);
  return { result: 'success', userId: user.id };
};
