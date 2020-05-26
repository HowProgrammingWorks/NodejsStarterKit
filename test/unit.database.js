'use strict';

const assert = require('assert').strict;
const path = require('path');

const application = require('../lib/application.js');
application.logger = { log: console.log };

const Database = require('../lib/database.js');
assert(Database);

const Config = require('../lib/config.js');
assert(Config);

const PATH = process.cwd();

(async () => {
  const configPath = path.join(PATH, 'config');
  const config = await new Config(configPath);
  const databaseConfig = config.sections.database;
  const database = new Database(databaseConfig);

  const empty = 'empty';
  try {
    const user = { login: empty, password: empty, fullName: empty };
    const result = await database.insert('SystemUser', user);
    assert(result);
    assert.equal(result.rowCount, 1);
  } catch (err) {
    console.log(err.stack);
    process.exit(1);
  }
  try {
    const fields = ['login', 'password'];
    const cond = { login: empty };
    const [record] = await database.select('SystemUser', fields, cond);
    assert.equal(record.login, empty);
    assert.equal(record.password, empty);
  } catch (err) {
    console.log(err.stack);
    process.exit(1);
  }
  try {
    const delta = { password: empty };
    const cond = { login: empty };
    const result = await database.update('SystemUser', delta, cond);
    assert.equal(result.rowCount, 1);
  } catch (err) {
    console.log(err.stack);
    process.exit(1);
  }
  try {
    const cond = { login: empty };
    const result = await database.delete('SystemUser', cond);
    assert.equal(result.rowCount, 1);
  } catch (err) {
    console.log(err.stack);
    process.exit(1);
  }
  database.close();
})();
