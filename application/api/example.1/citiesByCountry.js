async ({ countryId }) => {
  const fields = ['Id', 'Name'];
  const where = { countryId };
  const data = await domain.database.example.select('City', fields, where);
  return { result: 'success', data };
};
