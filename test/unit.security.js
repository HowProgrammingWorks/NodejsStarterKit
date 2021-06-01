'use strict';

const assert = require('assert').strict;

const security = require('../lib/security.js');

assert(security);

const password = 'correct horse battery staple';
const wrongPassword = 'password';

security
  .hashPassword(password)
  .then((hash) => {
    assert(hash);
    assert.equal(typeof hash, 'string');
    return Promise.all([
      security.validatePassword(password, hash),
      security.validatePassword(wrongPassword, hash),
    ]);
  })
  .then((result) => {
    assert.deepEqual(result, [true, false]);
  })
  .catch((err) => {
    console.log(err.stack);
    process.exit(1);
  });
