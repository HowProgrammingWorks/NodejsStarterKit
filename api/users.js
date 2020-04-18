async () => {
  const fields = ['Id', 'Login', 'FullName'];
  const data = await application.db.select('SystemUser', fields);
  return { result: 'success', data };
};
