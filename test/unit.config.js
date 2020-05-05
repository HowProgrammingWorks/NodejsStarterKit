'use strict';

const path = require('path');
const assert = require('assert').strict;

const Config = require('../lib/config.js');

assert(Config);

const PATH = process.cwd();
const configPath = path.join(PATH, 'config');

(async () => {
  const config = await new Config(configPath);
  assert(config.sections);
  assert(config.sections.database);
  assert(config.sections.server);
})();
