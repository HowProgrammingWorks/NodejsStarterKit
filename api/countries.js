async () => {
  const fields = ['Id', 'Name'];
  const data = await application.db.select('Country', fields);
  return { result: 'success', data };
};
