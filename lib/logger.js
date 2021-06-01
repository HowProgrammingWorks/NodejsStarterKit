'use strict';

const { fs, util, path } = require('./dependencies.js').node;

const COLORS = {
  info: '\x1b[1;37m',
  debug: '\x1b[1;33m',
  error: '\x1b[0;31m',
  system: '\x1b[1;34m',
  access: '\x1b[1;38m',
};

const DATETIME_LENGTH = 19;

class Logger {
  constructor(logPath, threadId = 0) {
    this.path = logPath;
    const date = new Date().toISOString().substring(0, 10);
    const filePath = path.join(logPath, `${date}-W${threadId}.log`);
    this.stream = fs.createWriteStream(filePath, { flags: 'a' });
    this.regexp = new RegExp(path.dirname(this.path), 'g');
  }

  close() {
    return new Promise((resolve) => this.stream.end(resolve));
  }

  write(level = 'info', s) {
    const now = new Date().toISOString();
    const date = now.substring(0, DATETIME_LENGTH);
    const color = COLORS[level];
    const line = date + '\t' + s;
    console.log(color + line + '\x1b[0m');
    const out = line.replace(/[\n\r]\s*/g, '; ') + '\n';
    this.stream.write(out);
  }

  log(...args) {
    const msg = util.format(...args);
    this.write('info', msg);
  }

  dir(...args) {
    const msg = util.inspect(...args);
    this.write('info', msg);
  }

  debug(...args) {
    const msg = util.format(...args);
    this.write('debug', msg);
  }

  error(...args) {
    const msg = util.format(...args).replace(/[\n\r]{2,}/g, '\n');
    this.write('error', msg.replace(this.regexp, ''));
  }

  system(...args) {
    const msg = util.format(...args);
    this.write('system', msg);
  }

  access(...args) {
    const msg = util.format(...args);
    this.write('access', msg);
  }
}

module.exports = Logger;
