'use strict';

const fs = require('fs');

const COLORS = {
  info: '\x1b[1;37m',
  debug: '\x1b[1;33m',
  error: '\x1b[0;31m',
};

class Logger {
  constructor(filePath) {
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

  log(s) {
    this.write('info', s);
  }

  dir(s) {
    this.write('info', s);
  }

  debug(s) {
    this.write('debug', s);
  }

  error(s) {
    this.write('error', s);
  }
}

module.exports = Logger;
