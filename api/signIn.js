async ({ login, password }) => {
  const where = { login, password };
  const id = application.db.select('SystemUser', ['Id'], where);
  if (!id) throw new Error('Incorrect login or password');
  console.log(`Logged user: ${login}`);
  return { result: 'success' };
};
