async ({ login, password, fullName }) => {
  const hash = await api.security.hashPassword(password);
  await application.auth.registerUser(login, hash, fullName);
  return { result: 'success' };
};
