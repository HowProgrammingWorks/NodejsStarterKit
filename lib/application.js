'use strict';

const EventEmitter = require('events');
const path = require('path');

const Config = require('./config.js');
const Database = require('./db.js');
const Server = require('./server.js');

class Application extends EventEmitter {
  constructor(applicationPath) {
    super();
    this.path = applicationPath;
    const configPath = path.join(applicationPath, 'config');
    this.config = new Config(configPath);
    this.db = null;
    this.server = null;
    this.config.on('loaded', () => {
      const { database, server } = this.config.sections;
      this.db = new Database(database);
      this.server = new Server(server);
      this.emit('started');
    });
  }
}

module.exports = Application;
