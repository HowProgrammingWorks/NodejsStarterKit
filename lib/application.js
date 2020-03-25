'use strict';

const EventEmitter = require('events');
const path = require('path');
const Config = require('./config.js');

class Application extends EventEmitter {
  constructor(applicationPath) {
    super();
    this.path = applicationPath;
    const configPath = path.join(applicationPath, 'config');
    this.config = new Config(configPath);
    this.config.on('loaded', () => {
      this.emit('started');
    });
  }
}

module.exports = Application;
