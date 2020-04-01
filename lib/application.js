'use strict';

const EventEmitter = require('events');
const path = require('path');

const curDir = process.cwd();

const Config = require('./config.js');
const Logger = require('./logger.js');
const Database = require('./db.js');
const Server = require('./server.js');

class Application extends EventEmitter {
  constructor({ domain = null }) {
    super();
    this.path = curDir;
    this.domain = domain;
    const configPath = path.join(curDir, 'config');
    this.config = new Config(configPath);
    const logPath = path.join(curDir, 'application.log');
    this.logger = new Logger(logPath);
    this.db = null;
    this.server = null;
    this.state = new Map();
    this.config.on('loaded', () => {
      const { sections } = this.config;
      this.db = new Database(sections.database);
      this.server = new Server(sections.server, this);
      this.emit('started');
    });
    global.application = this;
  }

  async shutdown() {
    await this.server.close();
    await this.freeResources();
  }

  async freeResources() {
    application.logger.log('Free resources');
  }
}

module.exports = Application;
