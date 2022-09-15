async () => {
  const fields = ['Id', 'Name'];
  const data = await domain.database.example.select('Country', fields);
  return { result: 'success', data };
};
