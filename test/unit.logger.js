'use strict';

const assert = require('assert').strict;
const path = require('path');

const Logger = require('../lib/logger.js');
assert(Logger);

const APP_PATH = process.cwd();
const LOG_PATH = path.join(APP_PATH, 'log');
const workerId = 1;
const logger = new Logger(LOG_PATH, workerId);
assert(logger);

assert(logger.write);
assert.equal(typeof logger.write, 'function');

assert(logger.log);
assert.equal(typeof logger.log, 'function');

logger.log('Logger test: log method');
logger.dir('Logger test: dir method');
logger.debug('Logger test: debug method');
logger.error(new Error('Logger test: Example error'));
