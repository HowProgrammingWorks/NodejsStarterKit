'use strict';

const EventEmitter = require('events');
const path = require('path');

const Config = require('./config.js');
const Database = require('./db.js');

class Application extends EventEmitter {
  constructor(applicationPath) {
    super();
    this.path = applicationPath;
    const configPath = path.join(applicationPath, 'config');
    this.config = new Config(configPath);
    this.db = null;
    this.config.on('loaded', () => {
      this.db = new Database(this.config.database);
      this.emit('started');
    });
  }
}

module.exports = Application;
