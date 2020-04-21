async ({ login, password, fullName }) => {
  const hash = await api.Security.hashPassword(password);
  const user = { login, password: hash, fullName };
  await application.db.insert('SystemUser', user);
  return { result: 'success' };
};
