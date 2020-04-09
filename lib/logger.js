'use strict';

const fs = require('fs');
const util = require('util');
const path = require('path');

const COLORS = {
  info: '\x1b[1;37m',
  debug: '\x1b[1;33m',
  error: '\x1b[0;31m',
};

class Logger {
  constructor(logPath, application) {
    this.path = logPath;
    this.application = application;
    const { threadId } = application.worker;
    const date = new Date().toISOString().substring(0, 10);
    const filePath = path.join(logPath, `${date}-W${threadId}.log`);
    this.stream = fs.createWriteStream(filePath);
  }

  write(level = 'info', s) {
    const date = new Date().toISOString();
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
    const msg = util.format(...args).replace(/[\n\r]{2,}/g, '\n')
      .replace(new RegExp(this.path, 'g'), '');
    this.write('error', msg);
  }
}

module.exports = Logger;
