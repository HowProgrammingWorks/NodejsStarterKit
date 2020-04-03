'use strict';

module.exports = async (id, delta) => {
  await application.db.update('SystemUser', delta, { id });
  return { result: 'success' };
};
