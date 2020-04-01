'use strict';

module.exports = async () => {
  const fields = ['Id', 'Login', 'FullName'];
  const data = await application.db.select('SystemUser', fields, { id: '>0' });
  return { result: 'success', data };
};
