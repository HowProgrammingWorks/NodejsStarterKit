async ({ countryId }) => {
  const fields = ['Id', 'Name'];
  const where = { countryId };
  const data = await application.db.select('City', fields, where);
  return { result: 'success', data };
};
