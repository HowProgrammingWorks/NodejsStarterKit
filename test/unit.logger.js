'use strict';

const assert = require('assert').strict;
const path = require('path');

const Logger = require('../lib/logger.js');
assert(Logger);

const PATH = process.cwd();
const workerId = 1;
const logPath = path.join(PATH, 'log');
const logger = new Logger(logPath, workerId);
assert(logger);

assert(logger.write);
assert.equal(typeof logger.write, 'function');

assert(logger.log);
assert.equal(typeof logger.log, 'function');

logger.log('Logger test: log method');
logger.dir('Logger test: dir method');
logger.debug('Logger test: debug method');
logger.error(new Error('Logger test: Example error'));
