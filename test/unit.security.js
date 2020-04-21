'use strict';

const assert = require('assert').strict;

const Security = require('../lib/security.js');

assert(Security);

const password = 'correct horse battery staple';
const wrongPassword = 'password';

Security.hashPassword(password).then(hash => {
  assert(hash);
  assert.equal(typeof hash, 'string');
  return Promise.all([
    Security.validatePassword(password, hash),
    Security.validatePassword(wrongPassword, hash),
  ]);
}).then(result => {
  assert.deepEqual(result, [true, false]);
}).catch(err => {
  process.exitCode = 1;
  assert.fail(err);
});
