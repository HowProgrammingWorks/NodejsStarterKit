'use strict';

module.exports = async login => {
  await application.db.delete('SystemUser', { login });
  return { result: 'success' };
};
