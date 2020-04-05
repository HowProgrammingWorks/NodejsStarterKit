(async (login, password) => {
  const where = {
    Login: login,
    Password: password,
  };
  const id = application.db.select('SystemUser', ['Id'], where);
  if (!id) throw new Error('Incorrect login or password');
  return { result: 'success' };
});
