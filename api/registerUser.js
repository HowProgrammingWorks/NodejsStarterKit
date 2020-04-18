async ({ login, password, fullName }) => {
  const user = { login, password, fullName };
  const id = application.db.insert('SystemUser', user);
  if (!id) throw new Error('Can not register user');
  return { result: 'success' };
};
